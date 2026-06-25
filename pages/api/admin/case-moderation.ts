import type { NextApiRequest, NextApiResponse } from "next";
import { isAdminKeyValid, supabaseRest } from "../../../lib/supabaseRest";

type ModerationRow = {
  case_id: string;
  review_cycle: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }
  if (!isAdminKeyValid(req.headers["x-admin-key"] as string | undefined)) {
    res.status(401).json({ error: "Admin password required." });
    return;
  }

  const caseId = typeof req.body?.caseId === "string" ? req.body.caseId : "";
  const action = typeof req.body?.action === "string" ? req.body.action : "";
  if (!caseId || !["approve", "block", "dismiss"].includes(action)) {
    res.status(400).json({ error: "Valid case and moderation action required." });
    return;
  }

  try {
    const rows = await supabaseRest<ModerationRow[]>(
      `dentle_case_moderation?select=case_id,review_cycle&case_id=eq.${encodeURIComponent(caseId)}&limit=1`
    );
    if (!rows[0]) {
      res.status(404).json({ error: "Moderation record not found." });
      return;
    }

    const reviewed = action === "approve";
    await supabaseRest(`dentle_case_moderation?case_id=eq.${encodeURIComponent(caseId)}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        status: reviewed ? "reviewed" : action === "block" ? "needs_review" : "dismissed",
        report_count: reviewed || action === "dismiss" ? 0 : undefined,
        review_cycle: reviewed || action === "dismiss" ? rows[0].review_cycle + 1 : rows[0].review_cycle,
        reviewed_at: reviewed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      })
    });

    res.status(200).json({ updated: true, action, caseId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Could not update case moderation." });
  }
}
