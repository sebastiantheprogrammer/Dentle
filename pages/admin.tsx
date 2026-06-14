import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import { cases } from "../lib/cases";

type Metrics = {
  connected: boolean;
  missing?: string[];
  error?: string;
  totals?: {
    views: number;
    starts: number;
    guesses: number;
    solves: number;
    fails: number;
    subscribers: number;
    solveRate: number;
    subscribeRate: number;
  };
  daily?: Array<{ day: string; views: number; guesses: number; solves: number; subscriptions: number }>;
  boards?: Array<{ board: string; starts: number; guesses: number; solves: number }>;
  latestSubscribers?: Array<{ id: string; created_at: string; email: string }>;
  dailyCases?: Array<{ id: string; publish_date: string; source: string; status: string; cases: typeof cases; updated_at: string }>;
};

function maxValue(values: number[]) {
  return Math.max(1, ...values);
}

export default function Admin() {
  const [adminKey, setAdminKey] = useState("");
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const dailyMax = useMemo(() => maxValue((metrics?.daily || []).flatMap((day) => [day.views, day.guesses, day.solves])), [metrics]);
  const boardMax = useMemo(() => maxValue((metrics?.boards || []).map((board) => board.starts)), [metrics]);

  useEffect(() => {
    const saved = window.localStorage.getItem("dentle_admin_key") || "";
    setAdminKey(saved);
    if (saved) loadMetrics(saved);
  }, []);

  async function loadMetrics(key = adminKey) {
    if (!key) return;
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/metrics", {
        headers: { "x-admin-key": key }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Admin request failed.");
      window.localStorage.setItem("dentle_admin_key", key);
      setMetrics(data);
    } catch (error) {
      setMetrics(null);
      setMessage(error instanceof Error ? error.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }

  async function publishReviewedCases() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ source: "admin-reviewed", cases })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Publish failed.");
      setMessage("Reviewed launch boards are published for today.");
      await loadMetrics();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Publish failed.");
    } finally {
      setLoading(false);
    }
  }

  async function generateAndPublishAi() {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ source: "claude-admin" })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI publish failed.");
      setMessage("Claude boards generated and published for today.");
      await loadMetrics();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI publish failed.");
    } finally {
      setLoading(false);
    }
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
            <h1>Daily boards and growth</h1>
          </div>
          <a className="ghostAction adminHome" href="/">Player site</a>
        </header>

        <section className="adminLogin">
          <input
            value={adminKey}
            onChange={(event) => setAdminKey(event.target.value)}
            placeholder="Admin password"
            type="password"
          />
          <button className="primaryAction" type="button" onClick={() => loadMetrics()} disabled={loading || !adminKey}>
            {loading ? "Loading" : "Open admin"}
          </button>
        </section>

        {message && <div className="adminNotice">{message}</div>}

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
          <>
            <section className="metricGrid">
              <article><span>Views</span><strong>{metrics.totals.views}</strong></article>
              <article><span>Board starts</span><strong>{metrics.totals.starts}</strong></article>
              <article><span>Guesses</span><strong>{metrics.totals.guesses}</strong></article>
              <article><span>Solves</span><strong>{metrics.totals.solves}</strong></article>
              <article><span>Subscribers</span><strong>{metrics.totals.subscribers}</strong></article>
              <article><span>Solve rate</span><strong>{metrics.totals.solveRate}%</strong></article>
            </section>

            <section className="adminGrid">
              <article className="adminPanel widePanel">
                <div className="panelHeader">
                  <h2>Last 7 days</h2>
                  <button className="ghostAction compact" type="button" onClick={() => loadMetrics()} disabled={loading}>Refresh</button>
                </div>
                <div className="dailyChart">
                  {(metrics.daily || []).map((day) => (
                    <div className="dayBars" key={day.day}>
                      <div className="barTrack"><span style={{ height: `${(day.views / dailyMax) * 100}%` }} /></div>
                      <div className="barTrack guesses"><span style={{ height: `${(day.guesses / dailyMax) * 100}%` }} /></div>
                      <div className="barTrack solves"><span style={{ height: `${(day.solves / dailyMax) * 100}%` }} /></div>
                      <small>{day.day.slice(5)}</small>
                    </div>
                  ))}
                </div>
                <div className="chartLegend">
                  <span><i /> views</span>
                  <span><i /> guesses</span>
                  <span><i /> solves</span>
                </div>
              </article>

              <article className="adminPanel">
                <h2>Board activity</h2>
                <div className="boardBars">
                  {(metrics.boards || []).map((board) => (
                    <div key={board.board}>
                      <div>
                        <strong>{board.board}</strong>
                        <span>{board.starts} starts</span>
                      </div>
                      <i style={{ width: `${(board.starts / boardMax) * 100}%` }} />
                    </div>
                  ))}
                </div>
              </article>
            </section>

            <section className="adminGrid">
              <article className="adminPanel">
                <h2>Daily question control</h2>
                <p>Publish reviewed boards now, or let Claude generate today's five boards and save them to Supabase.</p>
                <div className="adminActions">
                  <button className="primaryAction" type="button" onClick={publishReviewedCases} disabled={loading}>Publish reviewed</button>
                  <button className="ghostAction" type="button" onClick={generateAndPublishAi} disabled={loading}>Generate AI today</button>
                </div>
              </article>

              <article className="adminPanel">
                <h2>Subscribers</h2>
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

            <section className="adminPanel">
              <h2>Published days</h2>
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
          </>
        )}
      </main>
    </>
  );
}
