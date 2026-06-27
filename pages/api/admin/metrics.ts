import type { NextApiRequest, NextApiResponse } from "next";
import { buildMetrics, type DailyCaseRecord, type DentleEvent, type Subscriber } from "../../../lib/adminMetrics";
import { diagnosisRotation } from "../../../lib/diagnosisRotation";
import { playerIdentityKey } from "../../../lib/playerIdentity";
import { getSupabaseStatus, isAdminKeyValid, supabaseRest } from "../../../lib/supabaseRest";

type CloudPlayer = {
  id: string;
  identity_key: string;
  created_at: string;
  last_seen_at: string;
};

type CloudResult = {
  player_id: string;
  solved: boolean;
  attempt_number: number | null;
  created_at: string;
};

type CaseReport = {
  id: string;
  created_at: string;
  case_id: string;
  board_date: string;
  review_cycle: number;
  reason: string;
  details: string | null;
  case_snapshot: Record<string, unknown>;
};

type CaseModeration = {
  case_id: string;
  board_date: string;
  review_cycle: number;
  status: "pending" | "needs_review" | "reviewed" | "dismissed";
  report_count: number;
  last_reported_at: string | null;
};

type AnalyticsBucket = {
  name: string;
  count: number;
};

function topValues(events: DentleEvent[], reader: (event: DentleEvent) => unknown, limit = 8): AnalyticsBucket[] {
  const counts = events.reduce<Record<string, number>>((acc, event) => {
    const value = reader(event);
    const label = typeof value === "string" && value.trim() ? value.trim() : "Unknown";
    acc[label] = (acc[label] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

function analyticsMetadata(event: DentleEvent) {
  const analytics = event.metadata?.analytics;
  return analytics && typeof analytics === "object" ? analytics as Record<string, unknown> : {};
}

function nestedValue(event: DentleEvent, group: "location" | "device", key: string) {
  const analytics = analyticsMetadata(event);
  const values = analytics[group];
  return values && typeof values === "object" ? (values as Record<string, unknown>)[key] : undefined;
}

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
          activeToday: number;
          completedBoards: number;
          completedToday: number;
          guessesSevenDays: number;
          guessesToday: number;
          locations: {
            countries: AnalyticsBucket[];
            cities: AnalyticsBucket[];
          };
          devices: {
            types: AnalyticsBucket[];
            browsers: AnalyticsBucket[];
            operatingSystems: AnalyticsBucket[];
          };
          winRate: number;
          averageWinningAttempts: number;
          recent: Array<{ id: string; lastSeen: string; games: number; wins: number; guesses: number }>;
        }
      | { available: false } = { available: false };

    try {
      const [players, results] = await Promise.all([
        supabaseRest<CloudPlayer[]>(
          "dentle_players?select=id,identity_key,created_at,last_seen_at&order=last_seen_at.desc&limit=1000"
        ),
        supabaseRest<CloudResult[]>(
          "dentle_player_results?select=player_id,solved,attempt_number,created_at&order=created_at.desc&limit=5000"
        )
      ]);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
      const today = new Date().toISOString().slice(0, 10);
      const wins = results.filter((result) => result.solved);
      const guessEvents = events.filter((event) => event.event_type === "guess_submit" && event.visitor_id);
      const knownAnalyticsEvents = events.filter((event) => Boolean(event.metadata?.analytics));
      const guessesByIdentity = guessEvents.reduce<Record<string, number>>((acc, event) => {
        try {
          const key = playerIdentityKey(event.visitor_id || "");
          acc[key] = (acc[key] || 0) + 1;
        } catch {
          return acc;
        }
        return acc;
      }, {});
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
        activeToday: players.filter((player) => player.last_seen_at.startsWith(today)).length,
        completedBoards: results.length,
        completedToday: results.filter((result) => result.created_at.startsWith(today)).length,
        guessesSevenDays: guessEvents.length,
        guessesToday: guessEvents.filter((event) => event.created_at.startsWith(today)).length,
        locations: {
          countries: topValues(knownAnalyticsEvents, (event) => nestedValue(event, "location", "country")),
          cities: topValues(knownAnalyticsEvents, (event) => {
            const city = nestedValue(event, "location", "city");
            const region = nestedValue(event, "location", "region");
            const country = nestedValue(event, "location", "country");
            const parts = [city, region, country].filter((part) => typeof part === "string" && part && part !== "Unknown");
            return parts.length ? parts.join(", ") : "Unknown";
          })
        },
        devices: {
          types: topValues(knownAnalyticsEvents, (event) => nestedValue(event, "device", "type")),
          browsers: topValues(knownAnalyticsEvents, (event) => nestedValue(event, "device", "browser")),
          operatingSystems: topValues(knownAnalyticsEvents, (event) => nestedValue(event, "device", "os"))
        },
        winRate: results.length ? Math.round((wins.length / results.length) * 100) : 0,
        averageWinningAttempts: wins.length
          ? Number((wins.reduce((total, result) => total + (result.attempt_number || 0), 0) / wins.length).toFixed(1))
          : 0,
        recent: players.slice(0, 8).map((player) => ({
          id: player.id,
          lastSeen: player.last_seen_at,
          games: gamesByPlayer[player.id]?.games || 0,
          wins: gamesByPlayer[player.id]?.wins || 0,
          guesses: guessesByIdentity[player.identity_key] || 0
        }))
      };
    } catch {
      // Player statistics are optional until the additive migration is run.
    }

    let caseReports:
      | {
          available: true;
          threshold: number;
          total: number;
          pending: number;
          needsReview: number;
          queue: Array<{
            caseId: string;
            boardDate: string;
            status: string;
            reportCount: number;
            lastReportedAt: string | null;
            snapshot: Record<string, unknown>;
            reports: Array<{
              id: string;
              reason: string;
              details: string | null;
              createdAt: string;
            }>;
          }>;
          recent: Array<{
            id: string;
            caseId: string;
            boardDate: string;
            reason: string;
            details: string | null;
            createdAt: string;
            snapshot: Record<string, unknown>;
          }>;
        }
      | { available: false } = { available: false };

    try {
      const [reports, moderation] = await Promise.all([
        supabaseRest<CaseReport[]>(
          "dentle_case_reports?select=id,created_at,case_id,board_date,review_cycle,reason,details,case_snapshot&order=created_at.desc&limit=500"
        ),
        supabaseRest<CaseModeration[]>(
          "dentle_case_moderation?select=case_id,board_date,review_cycle,status,report_count,last_reported_at&order=last_reported_at.desc&limit=500"
        )
      ]);
      const queueRows = moderation.filter((row) => row.status === "pending" || row.status === "needs_review");

      caseReports = {
        available: true,
        threshold: 3,
        total: reports.length,
        pending: queueRows.filter((row) => row.status === "pending").length,
        needsReview: queueRows.filter((row) => row.status === "needs_review").length,
        queue: queueRows.map((row) => {
          const matching = reports.filter((report) =>
            report.case_id === row.case_id && report.review_cycle === row.review_cycle
          );
          return {
            caseId: row.case_id,
            boardDate: row.board_date,
            status: row.status,
            reportCount: row.report_count,
            lastReportedAt: row.last_reported_at,
            snapshot: matching[0]?.case_snapshot || {},
            reports: matching.map((report) => ({
              id: report.id,
              reason: report.reason,
              details: report.details,
              createdAt: report.created_at
            }))
          };
        }),
        recent: reports.slice(0, 50).map((report) => ({
          id: report.id,
          caseId: report.case_id,
          boardDate: report.board_date,
          reason: report.reason,
          details: report.details,
          createdAt: report.created_at,
          snapshot: report.case_snapshot
        }))
      };
    } catch {
      // Case moderation is optional until its additive migration is run.
    }

    res.status(200).json({
      connected: true,
      cronConfigured: !!process.env.CRON_SECRET,
      aiConfigured: !!process.env.ANTHROPIC_API_KEY,
      cloudPlayers,
      caseReports,
      diagnosisRotation: diagnosisRotation(dailyCases),
      ...buildMetrics(events, subscribers, dailyCases)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ connected: false, error: "Could not load Supabase metrics." });
  }
}
