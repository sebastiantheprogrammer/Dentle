import type { NextApiRequest, NextApiResponse } from "next";
import { buildMetrics, type DailyCaseRecord, type DentleEvent, type Subscriber } from "../../../lib/adminMetrics";
import { getSupabaseStatus, isAdminKeyValid, supabaseRest } from "../../../lib/supabaseRest";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminKeyValid(req.headers["x-admin-key"] as string | undefined)) {
    res.status(401).json({ error: "Admin password required." });
    return;
  }

  const status = getSupabaseStatus();
  if (!status.configured) {
    res.status(200).json({ connected: false, missing: status.missing });
    return;
  }

  const since = new Date();
  since.setUTCDate(since.getUTCDate() - 6);
  since.setUTCHours(0, 0, 0, 0);

  try {
    const [events, subscribers, dailyCases] = await Promise.all([
      supabaseRest<DentleEvent[]>(
        `dentle_events?select=id,created_at,event_type,board_id,board_mode,board_category,is_correct,attempt_number&created_at=gte.${encodeURIComponent(since.toISOString())}&order=created_at.asc&limit=5000`
      ),
      supabaseRest<Subscriber[]>("dentle_subscribers?select=id,created_at,email&order=created_at.desc&limit=500"),
      supabaseRest<DailyCaseRecord[]>("dentle_daily_cases?select=id,publish_date,source,status,cases,created_at,updated_at&order=publish_date.desc&limit=14")
    ]);

    res.status(200).json({ connected: true, ...buildMetrics(events, subscribers, dailyCases) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ connected: false, error: "Could not load Supabase metrics." });
  }
}
