import type { NextApiRequest, NextApiResponse } from "next";
import { playerIdentity } from "../../lib/playerIdentity";
import { rateLimit } from "../../lib/rateLimit";
import { getSupabaseStatus, supabaseRest } from "../../lib/supabaseRest";

type PlayerRow = {
  id: string;
};

type ResultRow = {
  board_date: string;
  board_id: string;
  solved: boolean;
  attempt_number: number | null;
};

function dateBefore(date: string) {
  const value = new Date(`${date}T00:00:00.000Z`);
  value.setUTCDate(value.getUTCDate() - 1);
  return value.toISOString().slice(0, 10);
}

function buildStats(results: ResultRow[]) {
  const distribution = [0, 0, 0, 0, 0, 0];
  const completedBoards: Record<string, true> = {};
  const winDates: string[] = [];

  results.forEach((result) => {
    completedBoards[`${result.board_date}:${result.board_id}`] = true;
    if (!result.solved) return;
    if (result.attempt_number && result.attempt_number >= 1 && result.attempt_number <= 6) {
      distribution[result.attempt_number - 1] += 1;
    }
    winDates.push(result.board_date);
  });

  const dates = [...new Set(winDates)].sort();
  let longestStreak = 0;
  let run = 0;
  let previous = "";
  dates.forEach((date) => {
    run = previous && dateBefore(date) === previous ? run + 1 : 1;
    longestStreak = Math.max(longestStreak, run);
    previous = date;
  });

  const today = new Date().toISOString().slice(0, 10);
  const dateSet = new Set(dates);
  let cursor = dateSet.has(today) ? today : dateBefore(today);
  let currentStreak = 0;
  while (dateSet.has(cursor)) {
    currentStreak += 1;
    cursor = dateBefore(cursor);
  }

  return {
    gamesPlayed: results.length,
    wins: results.filter((result) => result.solved).length,
    currentStreak,
    longestStreak,
    distribution,
    completedBoards,
    winDates: dates
  };
}

async function getPlayer(req: NextApiRequest, visitorId: string) {
  const identity = playerIdentity(req, visitorId);
  const players = await supabaseRest<PlayerRow[]>("dentle_players?on_conflict=identity_key", {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({
      identity_key: identity.identityKey,
      ip_hash: identity.ipHash,
      last_seen_at: new Date().toISOString()
    })
  });

  if (!players[0]?.id) throw new Error("Could not create player");
  return players[0];
}

async function loadStats(playerId: string) {
  const results = await supabaseRest<ResultRow[]>(
    `dentle_player_results?select=board_date,board_id,solved,attempt_number&player_id=eq.${encodeURIComponent(playerId)}&order=board_date.asc&limit=5000`
  );
  return buildStats(results);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.status(405).json({ error: "Use GET or POST." });
    return;
  }

  const limit = rateLimit(req, "player-stats", 60, 60_000);
  if (limit.limited) {
    res.setHeader("Retry-After", String(limit.retryAfter));
    res.status(429).json({ error: "Too many statistics requests." });
    return;
  }

  const status = getSupabaseStatus();
  if (!status.configured) {
    res.status(503).json({ error: `Missing ${status.missing.join(", ")}` });
    return;
  }

  const visitorId = req.method === "GET"
    ? (typeof req.query.visitorId === "string" ? req.query.visitorId : "")
    : (typeof req.body?.visitorId === "string" ? req.body.visitorId : "");

  if (!visitorId) {
    res.status(400).json({ error: "Visitor ID required." });
    return;
  }

  try {
    const player = await getPlayer(req, visitorId);

    if (req.method === "POST") {
      const boardId = typeof req.body?.boardId === "string" ? req.body.boardId.slice(0, 120) : "";
      const boardDate = typeof req.body?.boardDate === "string" ? req.body.boardDate : "";
      const solved = req.body?.solved === true;
      const attemptNumber = Number(req.body?.attemptNumber);

      if (!boardId || !/^\d{4}-\d{2}-\d{2}$/.test(boardDate)) {
        res.status(400).json({ error: "Valid board ID and date required." });
        return;
      }

      await supabaseRest("dentle_player_results?on_conflict=player_id,board_date,board_id", {
        method: "POST",
        headers: { Prefer: "resolution=ignore-duplicates,return=minimal" },
        body: JSON.stringify({
          player_id: player.id,
          board_date: boardDate,
          board_id: boardId,
          solved,
          attempt_number: solved && Number.isInteger(attemptNumber) && attemptNumber >= 1 && attemptNumber <= 6
            ? attemptNumber
            : null
        })
      });
    }

    res.status(200).json({ stats: await loadStats(player.id) });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Player statistics are not ready. Run the player statistics SQL migration in Supabase."
    });
  }
}
