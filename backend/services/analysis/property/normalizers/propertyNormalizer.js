function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toBooleanOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "yes", "y", "1"].includes(v)) return true;
    if (["false", "no", "n", "0"].includes(v)) return false;
  }
  return null;
}

function normalizePropertyAnalysisInput(payload) {
  const property = payload.property || {};
  const listing = payload.listing || {};

  return {
    property: {
      propertyType: property.propertyType || "other",
      parcelId: property.parcelId || null,
      address: {
        line1: property.address?.line1 || null,
        line2: property.address?.line2 || null,
        city: property.address?.city || null,
        state: property.address?.state || null,
        zip: property.address?.zip || null,
      },
      beds: toNumberOrNull(property.beds),
      baths: toNumberOrNull(property.baths),
      sqft: toNumberOrNull(property.sqft),
      yearBuilt: toNumberOrNull(property.yearBuilt),
      lotSizeSqft: toNumberOrNull(property.lotSizeSqft),
      acreage: toNumberOrNull(property.acreage),

      hoa: {
        hasHOA: toBooleanOrNull(property.hoa?.hasHOA),
        monthlyDues: toNumberOrNull(property.hoa?.monthlyDues),
      },

      utilities: {
        waterSource: property.utilities?.waterSource || null,
        sewer: property.utilities?.sewer || null,
      },

      site: {
        floodZone: property.site?.floodZone || null,
        waterfront: toBooleanOrNull(property.site?.waterfront),
        accessNotes: property.site?.accessNotes || null,
      },

      systems: {
        roofAgeYears: toNumberOrNull(property.systems?.roofAgeYears),
        hvacAgeYears: toNumberOrNull(property.systems?.hvacAgeYears),
        electricalNotes: property.systems?.electricalNotes || null,
        plumbingNotes: property.systems?.plumbingNotes || null,
      },

      occupancy: {
        occupied: toBooleanOrNull(property.occupancy?.occupied),
        tenantOccupied: toBooleanOrNull(property.occupancy?.tenantOccupied),
      },
    },

    listing: {
      status: listing.status || null,
      dom: toNumberOrNull(listing.dom),
      cdom: toNumberOrNull(listing.cdom),
      relistedCount: toNumberOrNull(listing.relistedCount),
      pricingEvents: {
        hadPriceChanges: toBooleanOrNull(listing.pricingEvents?.hadPriceChanges),
        changeCount: toNumberOrNull(listing.pricingEvents?.changeCount),
      },
    },

    context: {
      source: payload.context?.source || "unknown",
      requestedBy: payload.context?.requestedBy || "anonymous",
    },
  };
}

module.exports = {
  normalizePropertyAnalysisInput,
};
