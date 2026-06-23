import type { DentalCase } from "./cases";
import { describeAiIssue, generateDailyBoards } from "./ai";
import { getSupabaseStatus, supabaseRest } from "./supabaseRest";

export async function publishDailyBoards(publishDate: string, source = "claude-cron") {
  const status = getSupabaseStatus();
  if (!status.configured) {
    return {
      status: 503,
      body: { error: `Missing ${status.missing.join(", ")}` }
    };
  }

  try {
    const existing = await supabaseRest<Array<{ cases: DentalCase[] }>>(
      `dentle_daily_cases?select=cases&publish_date=eq.${encodeURIComponent(publishDate)}&status=eq.published&limit=1`
    );

    if (existing[0]?.cases?.length) {
      return {
        status: 200,
        body: { published: false, reason: "Already published.", publishDate }
      };
    }

    const generated = await generateDailyBoards(publishDate);
    await supabaseRest("dentle_daily_cases?on_conflict=publish_date", {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
      body: JSON.stringify({
        publish_date: publishDate,
        source,
        status: "published",
        cases: generated,
        updated_at: new Date().toISOString()
      })
    });

    return {
      status: 200,
      body: { published: true, publishDate, boards: generated.length }
    };
  } catch (error) {
    console.error(error);
    const issue = describeAiIssue(error);
    return {
      status: 500,
      body: { error: issue.error, nextStep: issue.nextStep }
    };
  }
}
