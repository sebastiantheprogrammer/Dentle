import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { cases } from "../lib/cases";

type Metrics = {
  connected: boolean;
  cronConfigured?: boolean;
  aiConfigured?: boolean;
  missing?: string[];
  error?: string;
    totals?: {
    views: number;
    users: number;
    starts: number;
    guesses: number;
    solves: number;
    fails: number;
    subscribers: number;
    solveRate: number;
    subscribeRate: number;
  };
  daily?: Array<{ day: string; views: number; users: number; guesses: number; solves: number; subscriptions: number }>;
  boards?: Array<{ board: string; starts: number; guesses: number; solves: number; fails: number; solveRate: number; averageSolveAttempts: number }>;
  recentGuesses?: Array<{ id: string; created_at: string; board: string; category: string; attempt: number; isCorrect: boolean; guess: string }>;
  latestSubscribers?: Array<{ id: string; created_at: string; email: string }>;
  dailyCases?: Array<{ id: string; publish_date: string; source: string; status: string; cases: typeof cases; updated_at: string }>;
  cloudPlayers?: {
    available: boolean;
    total?: number;
    activeSevenDays?: number;
    completedBoards?: number;
    winRate?: number;
    averageWinningAttempts?: number;
    recent?: Array<{ id: string; lastSeen: string; games: number; wins: number }>;
  };
};

type AdminAction = "login" | "refresh" | "publish" | "generate" | "publisher" | "copy" | null;

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<AdminAction>(null);
  const [justUpdated, setJustUpdated] = useState(false);
  const [message, setMessage] = useState("");
  const [publishDate, setPublishDate] = useState(() => new Date().toISOString().slice(0, 10));

  const dailyMax = useMemo(() => maxValue((metrics?.daily || []).flatMap((day) => [day.views, day.users, day.guesses, day.solves])), [metrics]);
  const boardMax = useMemo(() => maxValue((metrics?.boards || []).map((board) => board.starts)), [metrics]);
  const todayCase = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return (metrics?.dailyCases || []).find((day) => day.publish_date === today) || null;
  }, [metrics]);
  const subscriberEmails = useMemo(() => (metrics?.latestSubscribers || []).map((subscriber) => subscriber.email).join(", "), [metrics]);

  useEffect(() => {
    const saved = window.localStorage.getItem("dentle_admin_key") || "";
    setAdminKey(saved);
    if (saved) loadMetrics(saved);
  }, []);

  async function loadMetrics(
    key = adminKey,
    options: { announce?: boolean; preserveMessage?: boolean; action?: AdminAction } = {}
  ) {
    if (!key) return;
    setLoading(true);
    setActiveAction(options.action || (metrics?.connected ? "refresh" : "login"));
    if (!options.preserveMessage) setMessage("");

    try {
      const response = await fetch("/api/admin/metrics", {
        headers: { "x-admin-key": key }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Admin request failed.");
      window.localStorage.setItem("dentle_admin_key", key);
      setMetrics(data);
      setJustUpdated(true);
      window.setTimeout(() => setJustUpdated(false), 650);
      if (options.announce) setMessage("Dashboard updated.");
    } catch (error) {
      setMetrics(null);
      setMessage(error instanceof Error ? error.message : "Could not load admin data.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  async function publishReviewedCases() {
    setLoading(true);
    setActiveAction("publish");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/daily?date=${encodeURIComponent(publishDate)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ source: "admin-reviewed", cases })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publish failed.");
      setMessage(`Reviewed launch boards are published for ${data.publishDate}.`);
      await loadMetrics(adminKey, { preserveMessage: true, action: "publish" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  async function generateAndPublishAi() {
    setLoading(true);
    setActiveAction("generate");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/daily?date=${encodeURIComponent(publishDate)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ source: "claude-admin" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI publish failed.");
      setMessage(`Claude boards generated and published for ${data.publishDate}.`);
      await loadMetrics(adminKey, { preserveMessage: true, action: "generate" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI publish failed.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  async function triggerDailyCron() {
    setLoading(true);
    setActiveAction("publisher");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/trigger-cron?date=${encodeURIComponent(publishDate)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cron execution failed.");
      
      if (data.published === false) {
        setMessage(`Publish completed: Already published for ${data.publishDate}.`);
      } else {
        setMessage(`Published ${data.boards} boards for ${data.publishDate}.`);
      }
      await loadMetrics(adminKey, { preserveMessage: true, action: "publisher" });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Cron execution failed.");
    } finally {
      setLoading(false);
      setActiveAction(null);
    }
  }

  async function copySubscriberEmails() {
    if (!subscriberEmails) return;
    setActiveAction("copy");
    try {
      await navigator.clipboard.writeText(subscriberEmails);
      setMessage("Subscriber emails copied.");
    } catch {
      setMessage("Could not copy emails from this browser context.");
    } finally {
      window.setTimeout(() => setActiveAction(null), 800);
    }
  }

  function switchAdminKey() {
    window.localStorage.removeItem("dentle_admin_key");
    setMetrics(null);
    setAdminKey("");
    setMessage("");
  }

  return (
    <>
      <Head>
        <title>Dentle Admin</title>
      </Head>
      <main className="adminShell">
        <header className="adminHeader">
          <div>
            <p className="eyebrow">Dentle Admin</p>
            <h1>Daily Boards and Growth</h1>
          </div>
          <a className="ghostAction adminHome" href="/">Player site</a>
        </header>

        {metrics?.connected ? (
          <section className="adminLogin activeSession">
            <strong>Admin unlocked</strong>
            <button className="ghostAction compact" type="button" onClick={switchAdminKey}>Switch key</button>
          </section>
        ) : (
          <section className="adminLogin">
            <input
              value={adminKey}
              onChange={(event) => setAdminKey(event.target.value)}
              placeholder="Admin password"
              type="password"
            />
            <button className={`primaryAction actionFeedback${activeAction === "login" ? " isLoading" : ""}`} type="button" onClick={() => loadMetrics()} disabled={loading || !adminKey}>
              {loading ? "Loading" : "Open admin"}
            </button>
          </section>
        )}

        {message && <div className="adminNotice" key={message}>{message}</div>}

        {metrics?.connected === false && (
          <section className="adminPanel">
            <h2>Connect Supabase</h2>
            <p>No fake analytics are shown. Add these env vars, run the SQL in <code>supabase/schema.sql</code>, then restart.</p>
            <div className="missingList">
              {(metrics.missing || []).map((item) => <span key={item}>{item}</span>)}
            </div>
          </section>
        )}

        {metrics?.connected && metrics.totals && (
          <div className={justUpdated ? "adminData justUpdated" : "adminData"}>
            <section className="metricGrid">
              <article><span>Daily views</span><strong>{metrics.totals.views}</strong></article>
              <article><span>Users</span><strong>{metrics.totals.users}</strong></article>
              <article><span>Board starts</span><strong>{metrics.totals.starts}</strong></article>
              <article><span>Guesses</span><strong>{metrics.totals.guesses}</strong></article>
              <article><span>Solves</span><strong>{metrics.totals.solves}</strong></article>
              <article><span>Subscribers</span><strong>{metrics.totals.subscribers}</strong></article>
            </section>

            <section className="adminPanel cloudPlayersPanel">
              <div className="panelHeader">
                <div>
                  <p className="eyebrow">Supabase players</p>
                  <h2>Cloud Player Activity</h2>
                </div>
                <button
                  className={`ghostAction compact actionFeedback${activeAction === "refresh" ? " isLoading" : ""}`}
                  type="button"
                  onClick={() => loadMetrics(adminKey, { announce: true, action: "refresh" })}
                  disabled={loading}
                >
                  {activeAction === "refresh" ? "Refreshing" : "Refresh"}
                </button>
              </div>
              {metrics.cloudPlayers?.available ? (
                <>
                  <div className="cloudPlayerGrid">
                    <div><span>Cloud players</span><strong>{metrics.cloudPlayers.total || 0}</strong></div>
                    <div><span>Active 7 days</span><strong>{metrics.cloudPlayers.activeSevenDays || 0}</strong></div>
                    <div><span>Boards recorded</span><strong>{metrics.cloudPlayers.completedBoards || 0}</strong></div>
                    <div><span>Cloud win rate</span><strong>{metrics.cloudPlayers.winRate || 0}%</strong></div>
                    <div><span>Avg. winning tries</span><strong>{metrics.cloudPlayers.averageWinningAttempts || "-"}</strong></div>
                  </div>
                  {(metrics.cloudPlayers.recent || []).length ? (
                    <div className="cloudPlayerList">
                      {(metrics.cloudPlayers.recent || []).map((player) => (
                        <div key={player.id}>
                          <strong>Player {player.id.slice(0, 8)}</strong>
                          <span>{player.games} games</span>
                          <span>{player.wins} wins</span>
                          <time>{new Date(player.lastSeen).toLocaleString()}</time>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>No cloud players have completed a board yet.</p>
                  )}
                </>
              ) : (
                <div className="migrationNotice">
                  Run <code>supabase/player-stats-migration.sql</code> to enable cloud player analytics.
                </div>
              )}
            </section>

            <section className="adminGrid">
              <article className="adminPanel">
                <h2>Operations</h2>
                <div className="statusGrid">
                  <div><span>Today</span><strong>{todayCase ? `${todayCase.cases.length} boards live` : "Fallback active"}</strong></div>
                  <div><span>Daily cron</span><strong>{metrics.cronConfigured ? "Configured" : "Missing secret"}</strong></div>
                  <div><span>Claude</span><strong>{metrics.aiConfigured ? "Ready" : "Missing key"}</strong></div>
                  <div><span>Solve rate</span><strong>{metrics.totals.solveRate}%</strong></div>
                  <div><span>Subscribe rate</span><strong>{metrics.totals.subscribeRate}%</strong></div>
                </div>
              </article>

              <article className="adminPanel">
                <h2>Publish date</h2>
                <div className="dateControl">
                  <input value={publishDate} onChange={(event) => setPublishDate(event.target.value)} type="date" />
                  <button className="ghostAction compact" type="button" onClick={() => setPublishDate(new Date().toISOString().slice(0, 10))}>Today</button>
                </div>
              </article>
            </section>

            <section className="adminGrid">
              <article className="adminPanel widePanel">
                <div className="panelHeader">
                  <h2>Last 7 days</h2>
                  <button className={`ghostAction compact actionFeedback${activeAction === "refresh" ? " isLoading" : ""}`} type="button" onClick={() => loadMetrics(adminKey, { announce: true, action: "refresh" })} disabled={loading}>
                    {activeAction === "refresh" ? "Refreshing" : "Refresh"}
                  </button>
                </div>
                <div className="dailyChart">
                  {(metrics.daily || []).map((day) => (
                    <div className="dayBars" key={day.day}>
                      <div className="barTrack"><span style={{ height: `${(day.views / dailyMax) * 100}%` }} /></div>
                      <div className="barTrack users"><span style={{ height: `${(day.users / dailyMax) * 100}%` }} /></div>
                      <div className="barTrack guesses"><span style={{ height: `${(day.guesses / dailyMax) * 100}%` }} /></div>
                      <div className="barTrack solves"><span style={{ height: `${(day.solves / dailyMax) * 100}%` }} /></div>
                      <small>{day.day.slice(5)}</small>
                    </div>
                  ))}
                </div>
                <div className="chartLegend">
                  <span><i /> views</span>
                  <span><i /> users</span>
                  <span><i /> guesses</span>
                  <span><i /> solves</span>
                </div>
              </article>

              <article className="adminPanel">
                <h2>Board performance</h2>
                <div className="boardBars">
                  {(metrics.boards || []).map((board) => (
                    <div key={board.board}>
                      <div>
                        <strong>{board.board}</strong>
                        <span>{board.solveRate}% solved</span>
                      </div>
                      <i style={{ width: `${(board.starts / boardMax) * 100}%` }} />
                      <small>{board.starts} starts / {board.guesses} guesses / {board.fails} fails / {board.averageSolveAttempts || "-"} avg tries</small>
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="adminPanel">
              <div className="panelHeader">
                <h2>Recent guesses</h2>
                <button className={`ghostAction compact actionFeedback${activeAction === "refresh" ? " isLoading" : ""}`} type="button" onClick={() => loadMetrics(adminKey, { announce: true, action: "refresh" })} disabled={loading}>
                  {activeAction === "refresh" ? "Refreshing" : "Refresh"}
                </button>
              </div>
              {(metrics.recentGuesses || []).length ? (
                <div className="guessList">
                  {(metrics.recentGuesses || []).map((guess) => (
                    <div key={guess.id}>
                      <strong>{guess.guess || "No guess text"}</strong>
                      <span>{guess.board}</span>
                      <span>Try {guess.attempt || "-"}</span>
                      <span className={guess.isCorrect ? "correct" : "miss"}>{guess.isCorrect ? "Correct" : "Miss"}</span>
                      <time>{new Date(guess.created_at).toLocaleString()}</time>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No guess text has been captured yet. New guesses will appear here.</p>
              )}
            </section>

            <section className="adminGrid">
              <article className="adminPanel">
                <h2>Daily question control</h2>
                <p>Publish reviewed boards, generate a selected date with Claude, or run the same daily publisher used by cron.</p>
                <div className="adminActions">
                  <button className={`primaryAction actionFeedback${activeAction === "publish" ? " isLoading" : ""}`} type="button" onClick={publishReviewedCases} disabled={loading}>
                    {activeAction === "publish" ? "Publishing" : "Publish reviewed"}
                  </button>
                  <button className={`ghostAction actionFeedback${activeAction === "generate" ? " isLoading" : ""}`} type="button" onClick={generateAndPublishAi} disabled={loading}>
                    {activeAction === "generate" ? "Generating" : "Generate AI date"}
                  </button>
                  <button className={`ghostAction actionFeedback${activeAction === "publisher" ? " isLoading" : ""}`} type="button" onClick={triggerDailyCron} disabled={loading}>
                    {activeAction === "publisher" ? "Running" : "Run publisher"}
                  </button>
                </div>
              </article>

              <article className="adminPanel">
                <div className="panelHeader">
                  <h2>Subscribers</h2>
                  <button className="ghostAction compact actionFeedback" type="button" onClick={copySubscriberEmails} disabled={!subscriberEmails}>
                    {activeAction === "copy" ? "Copied" : "Copy emails"}
                  </button>
                </div>
                {(metrics.latestSubscribers || []).length ? (
                  <div className="subscriberList">
                    {(metrics.latestSubscribers || []).map((subscriber) => (
                      <div key={subscriber.id}>
                        <strong>{subscriber.email}</strong>
                        <span>{new Date(subscriber.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No subscribers yet.</p>
                )}
              </article>
            </section>

            <section className="adminGrid">
              <article className="adminPanel">
                <h2>Cron &amp; Automation Status</h2>
                <p>The daily pipeline generates five boards using Claude and publishes them to Supabase. Use the selected date above for controlled backfills or manual tests.</p>
                
                <div style={{ display: "flex", gap: "20px", margin: "16px 0", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: metrics.cronConfigured ? "var(--teal)" : "var(--coral)"
                    }} />
                    <span style={{ fontSize: "0.9rem" }}>Cron Secret: <strong>{metrics.cronConfigured ? "Configured" : "Missing"}</strong></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      display: "inline-block",
                      width: "10px",
                      height: "10px",
                      borderRadius: "50%",
                      backgroundColor: metrics.aiConfigured ? "var(--teal)" : "var(--coral)"
                    }} />
                    <span style={{ fontSize: "0.9rem" }}>Claude AI Key: <strong>{metrics.aiConfigured ? "Configured" : "Missing"}</strong></span>
                  </div>
                </div>
              </article>

              <article className="adminPanel">
                <h2>External cron</h2>
                <p>Dentle Daily is scheduled in cron-job.org for 12:00 PM. This panel shows whether the app is ready to accept that protected request.</p>
                <div className="statusGrid twoColumn">
                  <div><span>Endpoint</span><strong>/api/cron/daily</strong></div>
                  <div><span>Secret</span><strong>{metrics.cronConfigured ? "Ready" : "Missing"}</strong></div>
                </div>
              </article>
            </section>

            <section className="adminPanel">
              <div className="panelHeader">
                <h2>Published days</h2>
                <button className={`ghostAction compact actionFeedback${activeAction === "refresh" ? " isLoading" : ""}`} type="button" onClick={() => loadMetrics(adminKey, { announce: true, action: "refresh" })} disabled={loading}>
                  {activeAction === "refresh" ? "Refreshing" : "Refresh"}
                </button>
              </div>
              <div className="publishedList">
                {(metrics.dailyCases || []).map((day) => (
                  <div key={day.id}>
                    <strong>{day.publish_date}</strong>
                    <span>{day.source}</span>
                    <span>{day.cases.length} boards</span>
                  </div>
                ))}
              </div>
            </section>

            {todayCase && (
              <section className="adminPanel">
                <h2>Today&apos;s board preview</h2>
                <div className="casePreviewGrid">
                  {todayCase.cases.map((dentalCase) => (
                    <article key={dentalCase.id}>
                      <span>{dentalCase.mode}</span>
                      <strong>{dentalCase.title}</strong>
                      <p>{dentalCase.answer}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </>
  );
}
