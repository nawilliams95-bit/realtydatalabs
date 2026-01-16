// backend/services/providers/rentcast/rentcastClient.js

const https = require("node:https");

/**
 * Minimal RentCast client (skeleton).
 * - No pricing/valuation logic here.
 * - Focus is: fetch raw property snapshot data for downstream normalization.
 */

class ProviderError extends Error {
  constructor(message, { code = "PROVIDER_ERROR", status = null, details = null } = {}) {
    super(message);
    this.name = "ProviderError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function buildQuery(params) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params || {})) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && v.trim().length === 0) continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

function httpGetJson({ baseUrl, path, apiKey, timeoutMs = 8000 }) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseUrl);

    const req = https.request(
      url,
      {
        method: "GET",
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
        },
      },
      (res) => {
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const status = res.statusCode || 0;

          let parsed = null;
          try {
            parsed = body ? JSON.parse(body) : null;
          } catch {
            // keep parsed as null
          }

          if (status >= 200 && status < 300) {
            return resolve({ status, data: parsed });
          }

          return reject(
            new ProviderError("RentCast request failed.", {
              code: "RENTCAST_HTTP_ERROR",
              status,
              details: parsed || body || null,
            })
          );
        });
      }
    );

    req.on("error", (err) => {
      return reject(
        new ProviderError("RentCast request error.", {
          code: "RENTCAST_NETWORK_ERROR",
          status: null,
          details: err.message,
        })
      );
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      return reject(
        new ProviderError("RentCast request timed out.", {
          code: "RENTCAST_TIMEOUT",
          status: null,
          details: `timeoutMs=${timeoutMs}`,
        })
      );
    });

    req.end();
  });
}

/**
 * Fetches a property snapshot using address fields.
 * NOTE: Endpoint path may be adjusted after you confirm your RentCast plan + docs.
 */
async function getPropertySnapshotByAddress(address, { timeoutMs = 8000 } = {}) {
  const apiKey = process.env.RENTCAST_API_KEY;
  if (!isNonEmptyString(apiKey)) {
    throw new ProviderError("RENTCAST_API_KEY is not set.", { code: "RENTCAST_MISSING_API_KEY" });
  }

  const baseUrl = process.env.RENTCAST_BASE_URL || "https://api.rentcast.io";
  const a = address || {};

  // Keep parameters conservative until you confirm the exact endpoint contract.
  const q = buildQuery({
    address: a.line1 || a.address1 || a.street,
    city: a.city,
    state: a.state,
    zip: a.postalCode || a.zip,
  });

  // Placeholder path; we will confirm and update once you share the RentCast endpoint you are using.
  const path = `/v1/properties${q}`;

  const { data } = await httpGetJson({ baseUrl, path, apiKey, timeoutMs });
  return data;
}

module.exports = {
  ProviderError,
  getPropertySnapshotByAddress,
};
