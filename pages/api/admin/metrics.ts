import type { NextApiRequest, NextApiResponse } from "next";
import { buildMetrics, type DailyCaseRecord, type DentleEvent, type Subscriber } from "../../../lib/adminMetrics";
import { diagnosisRotation } from "../../../lib/diagnosisRotation";
import { getSupabaseStatus, isAdminKeyValid, supabaseRest } from "../../../lib/supabaseRest";

type CloudPlayer = {
  id: string;
  created_at: string;
  last_seen_at: string;
};

type CloudResult = {
  player_id: string;
  solved: boolean;
  attempt_number: number | null;
  created_at: string;
};

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
        `dentle_events?select=id,created_at,visitor_id,event_type,board_id,board_mode,board_category,is_correct,attempt_number,metadata&created_at=gte.${encodeURIComponent(since.toISOString())}&order=created_at.asc&limit=5000`
      ),
      supabaseRest<Subscriber[]>("dentle_subscribers?select=id,created_at,email&order=created_at.desc&limit=500"),
      supabaseRest<DailyCaseRecord[]>("dentle_daily_cases?select=id,publish_date,source,status,cases,created_at,updated_at&order=publish_date.desc&limit=14")
    ]);

    let cloudPlayers:
      | {
          available: true;
          total: number;
          activeSevenDays: number;
          completedBoards: number;
          winRate: number;
          averageWinningAttempts: number;
          recent: Array<{ id: string; lastSeen: string; games: number; wins: number }>;
        }
      | { available: false } = { available: false };

    try {
      const [players, results] = await Promise.all([
        supabaseRest<CloudPlayer[]>(
          "dentle_players?select=id,created_at,last_seen_at&order=last_seen_at.desc&limit=1000"
        ),
        supabaseRest<CloudResult[]>(
          "dentle_player_results?select=player_id,solved,attempt_number,created_at&order=created_at.desc&limit=5000"
        )
      ]);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      const wins = results.filter((result) => result.solved);
      const gamesByPlayer = results.reduce<Record<string, { games: number; wins: number }>>((acc, result) => {
        if (!acc[result.player_id]) acc[result.player_id] = { games: 0, wins: 0 };
        acc[result.player_id].games += 1;
        if (result.solved) acc[result.player_id].wins += 1;
        return acc;
      }, {});

      cloudPlayers = {
        available: true,
        total: players.length,
        activeSevenDays: players.filter((player) => new Date(player.last_seen_at) >= sevenDaysAgo).length,
        completedBoards: results.length,
        winRate: results.length ? Math.round((wins.length / results.length) * 100) : 0,
        averageWinningAttempts: wins.length
          ? Number((wins.reduce((total, result) => total + (result.attempt_number || 0), 0) / wins.length).toFixed(1))
          : 0,
        recent: players.slice(0, 8).map((player) => ({
          id: player.id,
          lastSeen: player.last_seen_at,
          games: gamesByPlayer[player.id]?.games || 0,
          wins: gamesByPlayer[player.id]?.wins || 0
        }))
      };
    } catch {
      // Player statistics are optional until the additive migration is run.
    }

    res.status(200).json({
      connected: true,
      cronConfigured: !!process.env.CRON_SECRET,
      aiConfigured: !!process.env.ANTHROPIC_API_KEY,
      cloudPlayers,
      diagnosisRotation: diagnosisRotation(dailyCases),
      ...buildMetrics(events, subscribers, dailyCases)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ connected: false, error: "Could not load Supabase metrics." });
  }
}
