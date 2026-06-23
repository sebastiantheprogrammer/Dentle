import { createHmac } from "crypto";
import type { NextApiRequest } from "next";
import { clientIp } from "./rateLimit";

function identitySecret() {
  return (
    process.env.PLAYER_ID_SECRET ||
    process.env.CRON_SECRET ||
    process.env.ADMIN_PASSWORD ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ""
  );
}

function digest(value: string) {
  const secret = identitySecret();
  if (!secret) throw new Error("Missing PLAYER_ID_SECRET");
  return createHmac("sha256", secret).update(value).digest("hex");
}

export function playerIdentity(req: NextApiRequest, visitorId: string) {
  const normalizedVisitor = visitorId.trim().slice(0, 80);
  if (!normalizedVisitor) throw new Error("Missing visitor ID");

  return {
    identityKey: digest(`visitor:${normalizedVisitor}`),
    ipHash: digest(`ip:${clientIp(req)}`)
  };
}
