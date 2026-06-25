import type { DentalCase } from "./cases";

export type DentleEvent = {
  id: string;
  created_at: string;
  visitor_id: string | null;
  event_type: string;
  board_id: string | null;
  board_mode: string | null;
  board_category: string | null;
  is_correct: boolean | null;
  attempt_number: number | null;
  metadata: Record<string, unknown>;
};

export type Subscriber = {
  id: string;
  created_at: string;
  email: string;
};

export type DailyCaseRecord = {
  id: string;
  publish_date: string;
  source: string;
  status: string;
  cases: DentalCase[];
  created_at: string;
  updated_at: string;
};

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function buildMetrics(events: DentleEvent[], subscribers: Subscriber[], dailyCases: DailyCaseRecord[]) {
  const today = dayKey(new Date());
  const uniqueDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return dayKey(date);
  });

  const daily = uniqueDays.map((day) => {
    const dayEvents = events.filter((event) => event.created_at.startsWith(day));
    const views = dayEvents.filter((event) => event.event_type === "page_view").length;
    const users = new Set(dayEvents.map((event) => event.visitor_id).filter(Boolean)).size;
    const guesses = dayEvents.filter((event) => event.event_type === "guess_submit").length;
    const solves = dayEvents.filter((event) => event.event_type === "board_solved").length;
    const subscriptions = subscribers.filter((subscriber) => subscriber.created_at.startsWith(day)).length;
    return { day, views, users, guesses, solves, subscriptions };
  });

  const boards = events.reduce<Record<string, { board: string; starts: number; guesses: number; solves: number; fails: number; totalSolveAttempts: number }>>((acc, event) => {
    const board = event.board_mode || event.board_id || "Unknown";
    if (!acc[board]) acc[board] = { board, starts: 0, guesses: 0, solves: 0, fails: 0, totalSolveAttempts: 0 };
    if (event.event_type === "board_select") acc[board].starts += 1;
    if (event.event_type === "guess_submit") acc[board].guesses += 1;
    if (event.event_type === "board_solved") {
      acc[board].solves += 1;
      acc[board].totalSolveAttempts += event.attempt_number || 0;
    }
    if (event.event_type === "board_failed") acc[board].fails += 1;
    return acc;
  }, {});

  const totalViews = events.filter((event) => event.event_type === "page_view").length;
  const totalUsers = new Set(events.map((event) => event.visitor_id).filter(Boolean)).size;
  const totalGuesses = events.filter((event) => event.event_type === "guess_submit").length;
  const totalSolves = events.filter((event) => event.event_type === "board_solved").length;
  const totalFails = events.filter((event) => event.event_type === "board_failed").length;
  const totalStarts = events.filter((event) => event.event_type === "board_select").length;
  const rollingSubscriptions = daily.reduce((total, day) => total + day.subscriptions, 0);
  const todayEvents = events.filter((event) => event.created_at.startsWith(today));
  const todayViews = todayEvents.filter((event) => event.event_type === "page_view").length;
  const todayUsers = new Set(todayEvents.map((event) => event.visitor_id).filter(Boolean)).size;
  const todayGuesses = todayEvents.filter((event) => event.event_type === "guess_submit").length;
  const todaySolves = todayEvents.filter((event) => event.event_type === "board_solved").length;
  const todayFails = todayEvents.filter((event) => event.event_type === "board_failed").length;
  const todayStarts = todayEvents.filter((event) => event.event_type === "board_select").length;
  const todaySubscriptions = subscribers.filter((subscriber) => subscriber.created_at.startsWith(today)).length;

  return {
    today: {
      day: today,
      views: todayViews,
      users: todayUsers,
      starts: todayStarts,
      guesses: todayGuesses,
      solves: todaySolves,
      fails: todayFails,
      subscriptions: todaySubscriptions,
      solveRate: todayStarts ? Math.round((todaySolves / todayStarts) * 100) : 0
    },
    totals: {
      views: totalViews,
      users: totalUsers,
      starts: totalStarts,
      guesses: totalGuesses,
      solves: totalSolves,
      fails: totalFails,
      subscribers: subscribers.length,
      solveRate: totalStarts ? Math.round((totalSolves / totalStarts) * 100) : 0,
      subscribeRate: totalViews ? Math.round((rollingSubscriptions / totalViews) * 100) : 0
    },
    daily,
    boards: Object.values(boards)
      .map((board) => ({
        ...board,
        solveRate: board.starts ? Math.round((board.solves / board.starts) * 100) : 0,
        averageSolveAttempts: board.solves ? Number((board.totalSolveAttempts / board.solves).toFixed(1)) : 0
      }))
      .sort((a, b) => b.starts - a.starts),
    recentGuesses: events
      .filter((event) => event.event_type === "guess_submit")
      .slice(-20)
      .reverse()
      .map((event) => ({
        id: event.id,
        created_at: event.created_at,
        board: event.board_mode || event.board_id || "Unknown",
        category: event.board_category || "Unknown",
        attempt: event.attempt_number || 0,
        isCorrect: event.is_correct === true,
        guess: typeof event.metadata?.guess_text === "string" ? event.metadata.guess_text : "",
        player: event.visitor_id ? `Player ${event.visitor_id.slice(0, 8)}` : "Unknown player"
      })),
    latestSubscribers: subscribers.slice(0, 12),
    dailyCases
  };
}
