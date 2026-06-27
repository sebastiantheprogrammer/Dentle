import type { NextApiRequest } from "next";

function firstHeader(req: NextApiRequest, names: string[]) {
  for (const name of names) {
    const value = req.headers[name.toLowerCase()];
    if (Array.isArray(value)) return value[0] || "";
    if (typeof value === "string" && value) return value;
  }
  return "";
}

function clean(value: string, max = 80) {
  let decoded = value || "";
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    decoded = value || "";
  }

  return decoded
    .replace(/[^\w\s.,:()/+-]/g, "")
    .trim()
    .slice(0, max);
}

function deviceType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (/ipad|tablet|kindle|silk/.test(ua)) return "Tablet";
  if (/mobi|iphone|android/.test(ua)) return "Mobile";
  if (/bot|crawler|spider|slurp/.test(ua)) return "Bot";
  return "Desktop";
}

function browserName(userAgent: string) {
  if (/edg\//i.test(userAgent)) return "Edge";
  if (/opr\//i.test(userAgent)) return "Opera";
  if (/chrome|crios/i.test(userAgent)) return "Chrome";
  if (/safari/i.test(userAgent) && !/chrome|crios/i.test(userAgent)) return "Safari";
  if (/firefox|fxios/i.test(userAgent)) return "Firefox";
  return "Unknown";
}

function osName(userAgent: string) {
  if (/iphone|ipad|ipod/i.test(userAgent)) return "iOS";
  if (/android/i.test(userAgent)) return "Android";
  if (/mac os x|macintosh/i.test(userAgent)) return "macOS";
  if (/windows/i.test(userAgent)) return "Windows";
  if (/linux/i.test(userAgent)) return "Linux";
  return "Unknown";
}

export function requestAnalytics(req: NextApiRequest) {
  const userAgent = firstHeader(req, ["user-agent"]);
  const country = clean(firstHeader(req, ["x-vercel-ip-country", "cf-ipcountry"]), 48) || "Unknown";
  const region = clean(firstHeader(req, ["x-vercel-ip-country-region", "x-vercel-ip-region"]), 80);
  const city = clean(firstHeader(req, ["x-vercel-ip-city"]), 80);
  const timezone = clean(firstHeader(req, ["x-vercel-ip-timezone"]), 80);

  return {
    location: {
      country,
      region: region || "Unknown",
      city: city || "Unknown",
      timezone: timezone || "Unknown"
    },
    device: {
      type: deviceType(userAgent),
      browser: browserName(userAgent),
      os: osName(userAgent)
    }
  };
}
