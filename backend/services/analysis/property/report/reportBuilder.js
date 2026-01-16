// backend/services/analysis/property/report/reportBuilder.js

function uniqStrings(arr) {
  const out = [];
  const seen = new Set();
  for (const v of arr || []) {
    if (typeof v !== "string") continue;
    const t = v.trim();
    if (!t) continue;
    if (seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

function dedupeFlags(flags) {
  // Deduplicate by code (keep highest severity if duplicates exist)
  const severityRank = { low: 1, medium: 2, high: 3 };
  const byCode = new Map();

  for (const f of flags || []) {
    if (!f || typeof f !== "object") continue;
    const code = typeof f.code === "string" ? f.code : null;
    if (!code) continue;

    const existing = byCode.get(code);
    if (!existing) {
      byCode.set(code, f);
      continue;
    }

    const a = severityRank[String(existing.severity || "").toLowerCase()] || 0;
    const b = severityRank[String(f.severity || "").toLowerCase()] || 0;

    // Keep the one with higher severity; if tie, keep existing
    if (b > a) byCode.set(code, f);
  }

  return Array.from(byCode.values());
}

function normalizeDetailsToArray(details) {
  if (details === null || details === undefined) return [];
  if (Array.isArray(details)) return details.filter((d) => typeof d === "string" && d.trim().length > 0);
  if (typeof details === "string" && details.trim().length > 0) return [details.trim()];
  return [];
}

function dedupeRiskSignals(riskSignals) {
  // Dedupe by code + severity; aggregate details into details[]
  const map = new Map();

  for (const rs of riskSignals || []) {
    if (!rs || typeof rs !== "object") continue;

    const code = typeof rs.code === "string" ? rs.code : null;
    const severity = typeof rs.severity === "string" ? rs.severity : "low";
    if (!code) continue;

    const key = `${code}::${severity}`;
    const existing = map.get(key);

    const incomingDetails = normalizeDetailsToArray(rs.details);

    if (!existing) {
      map.set(key, {
        code,
        severity,
        details: uniqStrings(incomingDetails),
      });
      continue;
    }

    existing.details = uniqStrings([...(existing.details || []), ...incomingDetails]);
  }

  return Array.from(map.values());
}

function buildReport({
  engine,
  analysisVersion,
  createdAtIso,
  completeness,
  observations,
  flags,
  riskSignals,
}) {
  const normalizedObservations = uniqStrings(observations);
  const normalizedFlags = dedupeFlags(flags);
  const normalizedRiskSignals = dedupeRiskSignals(riskSignals);

  return {
    meta: {
      engine,
      analysisVersion,
      createdAt: createdAtIso,
    },
    disclaimers: [
      "This report is informational only and does not provide pricing, CMA, valuation, ARV, or comp-based estimates.",
      "Missing data will reduce analysis completeness; items marked 'worth verifying' should be confirmed from authoritative sources.",
    ],
    completeness,
    observations: normalizedObservations,
    flags: normalizedFlags,
    riskSignals: normalizedRiskSignals,
    exposureSignals: [],
  };
}

module.exports = { buildReport };
