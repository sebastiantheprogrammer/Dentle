import type { NextApiRequest, NextApiResponse } from "next";
import { rateLimit } from "../../lib/rateLimit";
import { getSupabaseStatus, supabaseRest } from "../../lib/supabaseRest";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  const limit = rateLimit(req, "subscribe", 5, 60_000);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    res.status(429).json({ subscribed: false, error: "Too many subscription attempts." });
    return;
  }

  const status = getSupabaseStatus();
  if (!status.configured) {
    res.status(503).json({ subscribed: false, error: `Missing ${status.missing.join(", ")}` });
    return;
  }

  const email = normalizeEmail(req.body?.email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ subscribed: false, error: "Enter a valid email." });
    return;
  }

  try {
    await supabaseRest("dentle_subscribers?on_conflict=email", {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates,return=minimal"
      },
      body: JSON.stringify({
        email,
        visitor_id: typeof req.body?.visitorId === "string" ? req.body.visitorId.slice(0, 80) : null,
        source: "correct_popup",
        notify_daily: true
      })
    });

    await supabaseRest("dentle_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        visitor_id: typeof req.body?.visitorId === "string" ? req.body.visitorId.slice(0, 80) : null,
        event_type: "subscribe_submit",
        board_id: typeof req.body?.boardId === "string" ? req.body.boardId.slice(0, 120) : null,
        board_mode: typeof req.body?.boardMode === "string" ? req.body.boardMode.slice(0, 120) : null,
        board_category: typeof req.body?.boardCategory === "string" ? req.body.boardCategory.slice(0, 120) : null,
        metadata: { email_domain: email.split("@")[1] || "" }
      })
    });

    res.status(200).json({ subscribed: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ subscribed: false, error: "Subscription failed." });
  }
}
