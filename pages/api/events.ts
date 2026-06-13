import type { NextApiRequest, NextApiResponse } from "next";
import { getSupabaseStatus, supabaseRest } from "../../lib/supabaseRest";

const allowedEvents = new Set([
  "page_view",
  "board_select",
  "guess_submit",
  "board_solved",
  "board_failed",
  "subscribe_prompt_view",
  "subscribe_prompt_dismiss",
  "subscribe_submit"
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  const status = getSupabaseStatus();
  if (!status.configured) {
    res.status(202).json({ tracked: false, missing: status.missing });
    return;
  }

  const eventType = typeof req.body?.eventType === "string" ? req.body.eventType : "";
  if (!allowedEvents.has(eventType)) {
    res.status(400).json({ error: "Unsupported event type." });
    return;
  }

  try {
    await supabaseRest("dentle_events", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        visitor_id: typeof req.body?.visitorId === "string" ? req.body.visitorId.slice(0, 80) : null,
        event_type: eventType,
        board_id: typeof req.body?.boardId === "string" ? req.body.boardId.slice(0, 120) : null,
        board_mode: typeof req.body?.boardMode === "string" ? req.body.boardMode.slice(0, 120) : null,
        board_category: typeof req.body?.boardCategory === "string" ? req.body.boardCategory.slice(0, 120) : null,
        attempt_number: Number.isFinite(req.body?.attemptNumber) ? req.body.attemptNumber : null,
        is_correct: typeof req.body?.isCorrect === "boolean" ? req.body.isCorrect : null,
        metadata: typeof req.body?.metadata === "object" && req.body.metadata ? req.body.metadata : {}
      })
    });

    res.status(200).json({ tracked: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ tracked: false, error: "Event tracking failed." });
  }
}
