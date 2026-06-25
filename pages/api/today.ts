import type { NextApiRequest, NextApiResponse } from "next";
import { cases, type DentalCase } from "../../lib/cases";
import { todaySeed } from "../../lib/ai";
import { getSupabaseStatus, supabaseRest } from "../../lib/supabaseRest";

type ModerationRow = {
  case_id: string;
  status: "pending" | "needs_review" | "reviewed" | "dismissed";
};

async function applyModeration(dailyCases: DentalCase[]) {
  try {
    const moderation = await supabaseRest<ModerationRow[]>(
      "dentle_case_moderation?select=case_id,status&limit=1000"
    );
    const statusByCase = new Map(moderation.map((row) => [row.case_id, row.status]));
    const blocked = new Set(
      moderation.filter((row) => row.status === "needs_review").map((row) => row.case_id)
    );
    const usedAnswers = new Set(
      dailyCases.filter((dentalCase) => !blocked.has(dentalCase.id)).map((dentalCase) => dentalCase.answer)
    );

    return dailyCases.flatMap((dentalCase) => {
      if (!blocked.has(dentalCase.id)) {
        return [{
          ...dentalCase,
          reviewStatus: statusByCase.get(dentalCase.id) === "reviewed"
            ? "clinically_reviewed" as const
            : "community_review_pending" as const
        }];
      }

      const replacement = cases.find((candidate) =>
        candidate.mode === dentalCase.mode &&
        !blocked.has(candidate.id) &&
        !usedAnswers.has(candidate.answer)
      );
      if (!replacement) return [];
      usedAnswers.add(replacement.answer);
      return [{
        ...replacement,
        reviewStatus: statusByCase.get(replacement.id) === "reviewed"
          ? "clinically_reviewed" as const
          : "community_review_pending" as const
      }];
    });
  } catch {
    return dailyCases.map((dentalCase) => ({
      ...dentalCase,
      reviewStatus: dentalCase.reviewStatus || "community_review_pending" as const
    }));
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const seed = typeof req.query.date === "string" ? req.query.date : todaySeed();

  const supabase = getSupabaseStatus();
  if (supabase.configured) {
    try {
      const rows = await supabaseRest<Array<{ cases: DentalCase[]; source: string }>>(
        `dentle_daily_cases?select=cases,source&publish_date=eq.${encodeURIComponent(seed)}&status=eq.published&limit=1`
      );

      if (rows[0]?.cases?.length) {
        res.status(200).json({
          cases: await applyModeration(rows[0].cases),
          seed,
          source: rows[0].source || "admin-published"
        });
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  res.status(200).json({
    cases: await applyModeration(cases),
    seed,
    source: "static-fallback",
    warning: "No published daily case found. Run the admin or cron publisher to generate today's boards."
  });
}
