function nowIso() {
  return new Date().toISOString();
}

function addFlag(flags, { code, severity, message, evidence = null, suggestedNextStep = "worth verifying" }) {
  flags.push({ code, severity, message, evidence, suggestedNextStep });
}

function summarizeProperty(p) {
  const parts = [];
  if (p.propertyType) parts.push(p.propertyType.replace("_", " "));
  if (p.beds !== null && p.baths !== null) parts.push(`${p.beds} bed, ${p.baths} bath`);
  if (p.sqft !== null) parts.push(`${p.sqft} sqft`);
  if (p.yearBuilt !== null) parts.push(`built ${p.yearBuilt}`);
  return parts.length ? parts.join(", ") : "Property details provided are limited.";
}

function requiredFieldsByType(propertyType) {
  const baseRequired = ["propertyType", "address", "sqft", "yearBuilt"];
  if (propertyType === "land") return ["propertyType", "address", "acreage"];
  if (["multi_family", "single_family", "townhome", "condo", "manufactured"].includes(propertyType)) {
    return ["propertyType", "address", "beds", "baths", "sqft", "yearBuilt"];
  }
  return baseRequired;
}

function checkCompleteness(normalized) {
  const p = normalized.property;
  const type = p.propertyType;

  const required = requiredFieldsByType(type);

  const missingRequired = [];
  const missingRecommended = [];

  const hasAddress =
    Boolean(p.address?.line1) || Boolean(p.address?.city) || Boolean(p.address?.state) || Boolean(p.parcelId);

  for (const field of required) {
    if (field === "address") {
      if (!hasAddress) missingRequired.push("address (or parcelId)");
      continue;
    }

    if (p[field] === null || p[field] === undefined || p[field] === "") {
      missingRequired.push(field);
    }
  }

  if (p.utilities.waterSource === "well") {
    missingRecommended.push("well details (test history, depth, maintenance notes)");
  }
  if (p.utilities.sewer === "septic") {
    missingRecommended.push("septic details (age, last service or pump, permit info)");
  }
  if (p.site.waterfront === true) {
    missingRecommended.push("waterfront specifics (setback, easements, flood info, access rights)");
  }
  if (type === "condo" || p.hoa.hasHOA === true) {
    if (p.hoa.monthlyDues === null) missingRecommended.push("HOA dues and coverage details");
  }

  const requiredTotal = required.length;
  const requiredMissing = missingRequired.length;
  const requiredPresent = Math.max(requiredTotal - requiredMissing, 0);

  return {
    missingRequired,
    missingRecommended,
    coverage: { requiredPresent, requiredTotal },
  };
}

function riskSignals(normalized) {
  const p = normalized.property;
  const signals = [];

  const roofAge = p.systems.roofAgeYears;
  if (roofAge !== null && roofAge >= 20) {
    signals.push({
      code: "roof_age_high",
      message: "Roof age is 20+ years; inspection and documentation may be important.",
      evidence: { roofAgeYears: roofAge },
      suggestedNextStep: "worth verifying",
    });
  } else if (roofAge === null) {
    signals.push({
      code: "roof_age_unknown",
      message: "Roof age is not provided.",
      evidence: null,
      suggestedNextStep: "worth verifying",
    });
  }

  const hvacAge = p.systems.hvacAgeYears;
  if (hvacAge !== null && hvacAge >= 15) {
    signals.push({
      code: "hvac_age_high",
      message: "HVAC age is 15+ years; service history and inspection may be important.",
      evidence: { hvacAgeYears: hvacAge },
      suggestedNextStep: "worth verifying",
    });
  } else if (hvacAge === null) {
    signals.push({
      code: "hvac_age_unknown",
      message: "HVAC age is not provided.",
      evidence: null,
      suggestedNextStep: "worth verifying",
    });
  }

  if (p.site.floodZone && String(p.site.floodZone).trim().length > 0) {
    signals.push({
      code: "flood_zone_present",
      message: "Flood zone is provided; confirm FEMA map status and insurance requirements.",
      evidence: { floodZone: p.site.floodZone },
      suggestedNextStep: "worth verifying",
    });
  }

  return signals;
}

function exposureSignals(normalized) {
  const l = normalized.listing;
  const signals = [];

  if (l.dom !== null) {
    signals.push({ code: "dom_provided", message: "DOM is provided as an exposure signal.", evidence: { dom: l.dom } });
  }
  if (l.cdom !== null) {
    signals.push({ code: "cdom_provided", message: "CDOM is provided as an exposure signal.", evidence: { cdom: l.cdom } });
  }
  if (l.relistedCount !== null && l.relistedCount > 0) {
    signals.push({
      code: "relisted_history",
      message: "Relist history is present; it can affect buyer perception even without pricing details.",
      evidence: { relistedCount: l.relistedCount },
    });
  }
  if (l.pricingEvents.hadPriceChanges === true || (l.pricingEvents.changeCount !== null && l.pricingEvents.changeCount > 0)) {
    signals.push({
      code: "pricing_events_present",
      message: "Pricing events were indicated (counts only). No pricing guidance is produced.",
      evidence: { changeCount: l.pricingEvents.changeCount ?? null },
    });
  }

  return signals;
}

function analyze(normalizedInput) {
  const p = normalizedInput.property;

  const observations = [
    {
      code: "property_summary",
      message: summarizeProperty(p),
      evidence: {
        propertyType: p.propertyType,
        beds: p.beds,
        baths: p.baths,
        sqft: p.sqft,
        yearBuilt: p.yearBuilt,
      },
    },
  ];

  const completeness = checkCompleteness(normalizedInput);

  const flags = [];
  if (completeness.missingRequired.length > 0) {
    addFlag(flags, {
      code: "missing_required_fields",
      severity: "high",
      message: "Some required fields are missing for a reliable analysis output.",
      evidence: { missingRequired: completeness.missingRequired },
      suggestedNextStep: "worth verifying",
    });
  }

  if (completeness.missingRecommended.length > 0) {
    addFlag(flags, {
      code: "missing_recommended_fields",
      severity: "medium",
      message: "Some recommended fields are missing and could improve risk and diligence signals.",
      evidence: { missingRecommended: completeness.missingRecommended },
      suggestedNextStep: "worth verifying",
    });
  }

  const risk = riskSignals(normalizedInput);
  const exposure = exposureSignals(normalizedInput);

  return {
    meta: {
      engine: "rules_v1",
      analysisVersion: "1.0.0",
      createdAt: nowIso(),
    },
    disclaimers: [
      "This output is analysis-only: observations, completeness, flags, and risk signals.",
      "No pricing, CMA, or valuation logic is included.",
      "Consider professional inspection and local compliance requirements where applicable.",
    ],
    completeness,
    observations,
    flags,
    riskSignals: risk,
    exposureSignals: exposure,
  };
}

module.exports = {
  analyze,
};
