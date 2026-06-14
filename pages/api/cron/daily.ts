import type { NextApiRequest, NextApiResponse } from "next";
import type { DentalCase } from "../../../lib/cases";
import { describeAiIssue, generateDailyBoards, todaySeed } from "../../../lib/ai";
import { getSupabaseStatus, supabaseRest } from "../../../lib/supabaseRest";

function hasCronAccess(req: NextApiRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.authorization === `Bearer ${secret}` || req.headers["x-cron-key"] === secret;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasCronAccess(req)) {
    res.status(401).json({ error: "Cron secret required." });
    return;
  }

  const status = getSupabaseStatus();
  if (!status.configured) {
    res.status(503).json({ error: `Missing ${status.missing.join(", ")}` });
    return;
  }

  const publishDate = typeof req.query.date === "string" ? req.query.date : todaySeed();

  try {
    const existing = await supabaseRest<Array<{ cases: DentalCase[] }>>(
      `dentle_daily_cases?select=cases&publish_date=eq.${encodeURIComponent(publishDate)}&status=eq.published&limit=1`
    );

    if (existing[0]?.cases?.length) {
      res.status(200).json({ published: false, reason: "Already published.", publishDate });
      return;
    }

    const generated = await generateDailyBoards(publishDate);
    await supabaseRest("dentle_daily_cases?on_conflict=publish_date", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        publish_date: publishDate,
        source: "claude-cron",
        status: "published",
        cases: generated,
        updated_at: new Date().toISOString()
      })
    });

    res.status(200).json({ published: true, publishDate, boards: generated.length });
  } catch (error) {
    console.error(error);
    const issue = describeAiIssue(error);
    res.status(500).json({ error: issue.error, nextStep: issue.nextStep });
  }
}
