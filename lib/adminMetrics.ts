import type { DentalCase } from "./cases";

export type DentleEvent = {
  id: string;
  created_at: string;
  event_type: string;
  board_id: string | null;
  board_mode: string | null;
  board_category: string | null;
  is_correct: boolean | null;
  attempt_number: number | null;
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
  const uniqueDays = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - (6 - index));
    return dayKey(date);
  });

  const daily = uniqueDays.map((day) => {
    const dayEvents = events.filter((event) => event.created_at.startsWith(day));
    const views = dayEvents.filter((event) => event.event_type === "page_view").length;
    const guesses = dayEvents.filter((event) => event.event_type === "guess_submit").length;
    const solves = dayEvents.filter((event) => event.event_type === "board_solved").length;
    const subscriptions = subscribers.filter((subscriber) => subscriber.created_at.startsWith(day)).length;
    return { day, views, guesses, solves, subscriptions };
  });

  const boards = events.reduce<Record<string, { board: string; starts: number; guesses: number; solves: number }>>((acc, event) => {
    const board = event.board_mode || event.board_id || "Unknown";
    if (!acc[board]) acc[board] = { board, starts: 0, guesses: 0, solves: 0 };
    if (event.event_type === "board_select") acc[board].starts += 1;
    if (event.event_type === "guess_submit") acc[board].guesses += 1;
    if (event.event_type === "board_solved") acc[board].solves += 1;
    return acc;
  }, {});

  const totalViews = events.filter((event) => event.event_type === "page_view").length;
  const totalGuesses = events.filter((event) => event.event_type === "guess_submit").length;
  const totalSolves = events.filter((event) => event.event_type === "board_solved").length;
  const totalFails = events.filter((event) => event.event_type === "board_failed").length;
  const totalStarts = events.filter((event) => event.event_type === "board_select").length;

  return {
    totals: {
      views: totalViews,
      starts: totalStarts,
      guesses: totalGuesses,
      solves: totalSolves,
      fails: totalFails,
      subscribers: subscribers.length,
      solveRate: totalStarts ? Math.round((totalSolves / totalStarts) * 100) : 0,
      subscribeRate: totalViews ? Math.round((subscribers.length / totalViews) * 100) : 0
    },
    daily,
    boards: Object.values(boards).sort((a, b) => b.starts - a.starts),
    latestSubscribers: subscribers.slice(0, 12),
    dailyCases
  };
}
