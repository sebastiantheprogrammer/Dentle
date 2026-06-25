import type { NextApiRequest, NextApiResponse } from "next";
import { playerIdentity } from "../../lib/playerIdentity";
import { rateLimit } from "../../lib/rateLimit";
import { getSupabaseStatus, supabaseRest } from "../../lib/supabaseRest";

const allowedReasons = new Set([
  "incorrect_diagnosis",
  "radiograph_mismatch",
  "inconsistent_clues",
  "answer_should_be_accepted",
  "wrong_image",
  "too_easy",
  "too_hard",
  "other"
]);

type ModerationRow = {
  case_id: string;
  review_cycle: number;
  status: "pending" | "needs_review" | "reviewed" | "dismissed";
};

type ReportRow = {
  id: string;
};

function text(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function caseSnapshot(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const snapshot = value as Record<string, unknown>;
  return {
    mode: text(snapshot.mode, 40),
    category: text(snapshot.category, 80),
    title: text(snapshot.title, 160),
    prompt: text(snapshot.prompt, 1000),
    answer: text(snapshot.answer, 160),
    aliases: Array.isArray(snapshot.aliases)
      ? snapshot.aliases.slice(0, 20).map((alias) => text(alias, 160)).filter(Boolean)
      : [],
    clues: Array.isArray(snapshot.clues)
      ? snapshot.clues.slice(0, 10).map((clue) => text(clue, 500)).filter(Boolean)
      : []
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  const limit = rateLimit(req, "case-reports", 8, 60_000);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    res.status(429).json({ error: "Too many report attempts." });
    return;
  }

  const status = getSupabaseStatus();
  if (!status.configured) {
    res.status(503).json({ error: "Case reporting is not configured yet." });
    return;
  }

  const visitorId = typeof req.body?.visitorId === "string" ? req.body.visitorId : "";
  const caseId = typeof req.body?.caseId === "string" ? req.body.caseId.slice(0, 120) : "";
  const boardDate = typeof req.body?.boardDate === "string" ? req.body.boardDate : "";
  const reason = typeof req.body?.reason === "string" ? req.body.reason : "";
  const details = typeof req.body?.details === "string" ? req.body.details.trim().slice(0, 1000) : "";
  const snapshot = caseSnapshot(req.body?.caseSnapshot);

  if (!visitorId || !caseId || !/^\d{4}-\d{2}-\d{2}$/.test(boardDate) || !allowedReasons.has(reason)) {
    res.status(400).json({ error: "A valid case, date, and reason are required." });
    return;
  }
  if (reason === "other" && !details) {
    res.status(400).json({ error: "Please explain the issue." });
    return;
  }

  try {
    const identity = playerIdentity(req, visitorId);
    const moderationRows = await supabaseRest<ModerationRow[]>(
      `dentle_case_moderation?select=case_id,review_cycle,status&case_id=eq.${encodeURIComponent(caseId)}&limit=1`
    );
    const reviewCycle = moderationRows[0]?.review_cycle || 0;
    if (!moderationRows[0]) {
      await supabaseRest("dentle_case_moderation?on_conflict=case_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          case_id: caseId,
          board_date: boardDate,
          review_cycle: reviewCycle,
          status: "pending",
          report_count: 0,
          last_reported_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      });
    }

    await supabaseRest("dentle_case_reports?on_conflict=reporter_key,case_id,board_date,review_cycle", {
      method: "POST",
      headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
      body: JSON.stringify({
        reporter_key: identity.identityKey,
        case_id: caseId,
        board_date: boardDate,
        review_cycle: reviewCycle,
        reason,
        details: details || null,
        case_snapshot: snapshot
      })
    });

    const reports = await supabaseRest<ReportRow[]>(
      `dentle_case_reports?select=id&case_id=eq.${encodeURIComponent(caseId)}&board_date=eq.${encodeURIComponent(boardDate)}&review_cycle=eq.${reviewCycle}&limit=100`
    );
    const reportCount = reports.length;
    const moderationStatus = reportCount >= 3 ? "needs_review" : "pending";

    await supabaseRest("dentle_case_moderation?on_conflict=case_id", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        case_id: caseId,
        board_date: boardDate,
        review_cycle: reviewCycle,
        status: moderationStatus,
        report_count: reportCount,
        last_reported_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });

    res.status(200).json({
      reported: true,
      reportCount,
      status: moderationStatus,
      message: moderationStatus === "needs_review"
        ? "Thanks. This case has been removed for review."
        : "Thanks. Your report was added to the review queue."
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Case reporting is not ready. Run the case-report migration in Supabase."
    });
  }
}
