import type { NextApiRequest, NextApiResponse } from "next";
import { cases, type DentalCase } from "../../lib/cases";
import { todaySeed } from "../../lib/ai";
import { getSupabaseStatus, supabaseRest } from "../../lib/supabaseRest";

let cachedDaily:
  | {
      seed: string;
      cases: DentalCase[];
      source: string;
      warning?: string;
      nextStep?: string;
    }
  | undefined;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const seed = typeof req.query.date === "string" ? req.query.date : todaySeed();

  const supabase = getSupabaseStatus();
  if (supabase.configured) {
    try {
      const rows = await supabaseRest<Array<{ cases: DentalCase[]; source: string }>>(
        `dentle_daily_cases?select=cases,source&publish_date=eq.${encodeURIComponent(seed)}&status=eq.published&limit=1`
      );

      if (rows[0]?.cases?.length) {
        cachedDaily = { cases: rows[0].cases, seed, source: rows[0].source || "admin-published" };
        res.status(200).json(cachedDaily);
        return;
      }
    } catch (error) {
      console.error(error);
    }
  }

  if (cachedDaily?.seed === seed) {
    res.status(200).json(cachedDaily);
    return;
  }

  cachedDaily = {
    cases,
    seed,
    source: "static-fallback",
    warning: "No published daily case found. Run the admin or cron publisher to generate today's boards."
  };
  res.status(200).json(cachedDaily);
}
