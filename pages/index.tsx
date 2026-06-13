import { useEffect, useMemo, useState } from "react";
import Head from "next/head";
import type { DentalCase } from "../lib/cases";
import { cases } from "../lib/cases";
import { diagnoses, normalizeTerm, scoreTerm } from "../lib/diagnoses";

type Step = "intro" | "board" | "play";
type ApiDiagnosis = {
  name: string;
  aliases: string[];
  category: string;
};
type SubscribeState = "idle" | "saving" | "saved" | "error";

function ToothIcon() {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M10.4 3.8c2.1 0 3.5 1.1 5.6 1.1s3.5-1.1 5.6-1.1c3.9 0 6.5 3.2 6 7.6-.3 2.6-1.4 4.6-2.5 6.5-1 1.8-1.4 3.7-1.8 5.8-.5 2.6-1.3 5.5-3.3 5.5-1.5 0-1.9-2.2-2.4-4.6-.4-1.9-.7-3.4-1.6-3.4s-1.2 1.5-1.6 3.4c-.5 2.4-.9 4.6-2.4 4.6-2 0-2.8-2.9-3.3-5.5-.4-2.1-.8-4-1.8-5.8-1.1-1.9-2.2-3.9-2.5-6.5-.5-4.4 2.1-7.6 6-7.6Z" />
    </svg>
  );
}

function allAnswerTerms() {
  return [
    ...diagnoses.flatMap((diagnosis) => [diagnosis.name, ...diagnosis.aliases]),
    ...cases.flatMap((dentalCase) => [dentalCase.answer, ...dentalCase.aliases, ...dentalCase.differentials])
  ];
}

function getSuggestions(query: string) {
  if (!query.trim()) return [];
  return [...new Set(allAnswerTerms())]
    .map((term) => ({ term, score: scoreTerm(query, term) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term))
    .slice(0, 6)
    .map((item) => item.term);
}

function isCorrectAnswer(query: string, dentalCase: DentalCase) {
  const normalizedQuery = normalizeTerm(query);
  return [dentalCase.answer, ...dentalCase.aliases].map(normalizeTerm).includes(normalizedQuery);
}

function visitorId() {
  if (typeof window === "undefined") return "";
  const existing = window.localStorage.getItem("dentle_visitor_id");
  if (existing) return existing;
  const created = crypto.randomUUID();
  window.localStorage.setItem("dentle_visitor_id", created);
  return created;
}

function trackEvent(eventType: string, dentalCase?: DentalCase, extra: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  fetch("/api/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventType,
      visitorId: visitorId(),
      boardId: dentalCase?.id,
      boardMode: dentalCase?.mode,
      boardCategory: dentalCase?.category,
      ...extra
    })
  }).catch(() => {});
}

export default function Home() {
  const [step, setStep] = useState<Step>("intro");
  const [dailyCases, setDailyCases] = useState<DentalCase[]>(cases);
  const [selectedId, setSelectedId] = useState(cases[0].id);
  const [guess, setGuess] = useState("");
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const [attempts, setAttempts] = useState<("miss" | "hit")[]>([]);
  const [finished, setFinished] = useState(false);
  const [solved, setSolved] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [subscribeState, setSubscribeState] = useState<SubscribeState>("idle");
  const [subscribeError, setSubscribeError] = useState("");
  const selectedCase = dailyCases.find((dentalCase) => dentalCase.id === selectedId) || dailyCases[0] || cases[0];
  const localSuggestions = useMemo(() => getSuggestions(guess), [guess]);
  const suggestions = useMemo(() => [...new Set([...apiSuggestions, ...localSuggestions])].slice(0, 8), [apiSuggestions, localSuggestions]);
  const visibleClues = selectedCase.clues.slice(0, Math.min(attempts.filter((attempt) => attempt === "miss").length + 1, selectedCase.clues.length));

  useEffect(() => {
    const query = guess.trim();

    if (!query || !suggestionsOpen || finished) {
      setApiSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/diagnoses?q=${encodeURIComponent(query)}`, {
          signal: controller.signal
        });
        if (!response.ok) return;
        const data = await response.json();
        const terms = ((data.results || []) as ApiDiagnosis[]).flatMap((diagnosis) => [
          diagnosis.name,
          ...(diagnosis.aliases || [])
        ]);
        setApiSuggestions([...new Set(terms)].slice(0, 8));
      } catch {
        if (!controller.signal.aborted) setApiSuggestions([]);
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [guess, suggestionsOpen, finished]);

  useEffect(() => {
    let cancelled = false;

    async function loadToday() {
      try {
        const response = await fetch("/api/today");
        if (!response.ok) return;
        const data = await response.json();
        if (!cancelled && Array.isArray(data.cases) && data.cases.length) {
          setDailyCases(data.cases);
          setSelectedId(data.cases[0].id);
          resetGame();
        }
      } catch {
        // Keep static fallback cases.
      }
    }

    loadToday();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    trackEvent("page_view");
  }, []);

  function chooseBoard(id: string) {
    const dentalCase = dailyCases.find((item) => item.id === id);
    trackEvent("board_select", dentalCase);
    setSelectedId(id);
    resetGame();
  }

  function resetGame() {
    setGuess("");
    setSuggestionsOpen(false);
    setApiSuggestions([]);
    setAttempts([]);
    setFinished(false);
    setSolved(false);
    setSubscribeOpen(false);
    setSubscribeState("idle");
  }

  function submitGuess() {
    setSuggestionsOpen(false);
    if (!guess.trim() || finished) return;

    if (isCorrectAnswer(guess, selectedCase)) {
      trackEvent("guess_submit", selectedCase, { attemptNumber: attempts.length + 1, isCorrect: true });
      trackEvent("board_solved", selectedCase, { attemptNumber: attempts.length + 1 });
      setAttempts((current) => [...current, "hit"]);
      setFinished(true);
      setSolved(true);
      setGuess("");
      setSuggestionsOpen(false);
      setApiSuggestions([]);
      window.setTimeout(() => {
        const todayKey = new Date().toISOString().slice(0, 10);
        if (window.localStorage.getItem("dentle_subscribed") !== "true" && window.localStorage.getItem(`dentle_subscribe_dismissed_${todayKey}`) !== "true") {
          setSubscribeOpen(true);
          trackEvent("subscribe_prompt_view", selectedCase);
        }
      }, 6000);
      return;
    }

    const nextAttempts = [...attempts, "miss"] as ("miss" | "hit")[];
    trackEvent("guess_submit", selectedCase, { attemptNumber: nextAttempts.length, isCorrect: false });
    setAttempts(nextAttempts);
    setGuess("");
    setSuggestionsOpen(false);
    setApiSuggestions([]);

    if (nextAttempts.length >= 6) {
      trackEvent("board_failed", selectedCase, { attemptNumber: nextAttempts.length });
      setFinished(true);
      setSolved(false);
    }
  }

  async function subscribe() {
    if (!email.trim()) return;
    setSubscribeState("saving");
    setSubscribeError("");

    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          visitorId: visitorId(),
          boardId: selectedCase.id,
          boardMode: selectedCase.mode,
          boardCategory: selectedCase.category
        })
      });
      const data = await response.json();
      if (!response.ok || !data.subscribed) throw new Error(data.error || "Subscription failed");
      window.localStorage.setItem("dentle_subscribed", "true");
      setSubscribeState("saved");
    } catch (error) {
      setSubscribeError(error instanceof Error ? error.message : "Could not subscribe yet.");
      setSubscribeState("error");
    }
  }

  function dismissSubscribe() {
    const todayKey = new Date().toISOString().slice(0, 10);
    window.localStorage.setItem(`dentle_subscribe_dismissed_${todayKey}`, "true");
    setSubscribeOpen(false);
    trackEvent("subscribe_prompt_dismiss", selectedCase);
  }

  function openSubscribe() {
    setSubscribeOpen(true);
    setSubscribeError("");
    trackEvent("subscribe_prompt_view", selectedCase);
  }

  return (
    <>
      <Head>
        <title>Dentle</title>
        <meta name="description" content="A daily dental diagnosis game inspired by Wordle." />
      </Head>
      <main className="screen">
        <header className="appHeader">
          <a className="brand" href="#" aria-label="Dentle home" onClick={(event) => { event.preventDefault(); setStep("intro"); }}>
            <span className="brandMark"><ToothIcon /></span>
            <span>Dentle</span>
          </a>
          <div className="stepPills" aria-label="Progress">
            <span className={step === "intro" ? "active" : ""}>How</span>
            <span className={step === "board" ? "active" : ""}>Board</span>
            <span className={step === "play" ? "active" : ""}>Play</span>
          </div>
        </header>

      {step === "intro" && (
        <section className="stage introStage" aria-labelledby="intro-title">
          <div className="introCopy">
            <p className="eyebrow">Dentle.org</p>
            <h1 id="intro-title">Guess the dental diagnosis.</h1>
            <p>One case. Six tries. Each miss reveals a better clue.</p>
          </div>

          <div className="howCards">
            <article>
              <strong>1</strong>
              <h2>Look</h2>
              <p>Read the short case and inspect the image.</p>
            </article>
            <article>
              <strong>2</strong>
              <h2>Type</h2>
              <p>Start typing. The diagnosis list helps with spelling.</p>
            </article>
            <article>
              <strong>3</strong>
              <h2>Learn</h2>
              <p>After the board, see the answer and why it fits.</p>
            </article>
          </div>

          <button className="primaryAction" type="button" onClick={() => setStep("board")}>Next</button>
        </section>
      )}

      {step === "board" && (
        <section className="stage" aria-labelledby="board-title">
          <div className="stageHeading">
            <p className="eyebrow">Choose a board</p>
            <h1 id="board-title">What do you want to diagnose?</h1>
          </div>

          <div className="boardGrid">
            {dailyCases.map((dentalCase) => (
              <button
                className={`boardCard${dentalCase.id === selectedId ? " selected" : ""}`}
                key={dentalCase.id}
                type="button"
                onClick={() => chooseBoard(dentalCase.id)}
              >
                <h2>{dentalCase.mode}</h2>
                <p>{dentalCase.category}</p>
              </button>
            ))}
          </div>

          <div className="footerActions">
            <button className="ghostAction" type="button" onClick={() => setStep("intro")}>Back</button>
            <button className="primaryAction" type="button" onClick={() => setStep("play")}>Next</button>
          </div>
        </section>
      )}

      {step === "play" && (
        <section className="stage playStage" aria-labelledby="case-title">
          <div className="caseTopbar">
            <button className="ghostAction compact" type="button" onClick={() => setStep("board")}>Boards</button>
            <span>{selectedCase.mode}</span>
            <span>{selectedCase.difficulty}</span>
          </div>

          <div className="caseLayout">
            <article className="imagePanel">
              <img
                src={selectedCase.image.src}
                alt={selectedCase.image.alt}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
              <div className="imageFallback" aria-hidden="true">
                <ToothIcon />
                <span>{selectedCase.category}</span>
              </div>
              <p>{selectedCase.image.credit}</p>
            </article>

            <article className="gamePanel">
              <p className="eyebrow">{selectedCase.category}</p>
              <h1 id="case-title">{selectedCase.title}</h1>
              <p className="prompt">{selectedCase.prompt}</p>

              <div className="attempts" aria-label="Attempts">
                {Array.from({ length: 6 }).map((_, index) => (
                  <span className={attempts[index] || ""} key={index} />
                ))}
              </div>

              <div className="attemptLegend" aria-label="Attempt color key">
                <span><i className="empty" /> unused</span>
                <span><i className="miss" /> wrong</span>
                <span><i className="hit" /> correct</span>
              </div>

              <div className="answerBox">
                <input
                  value={guess}
                  onChange={(event) => {
                    setGuess(event.target.value);
                    setSuggestionsOpen(true);
                  }}
                  onFocus={() => setSuggestionsOpen(true)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") submitGuess();
                    if (event.key === "Escape") setSuggestionsOpen(false);
                  }}
                  disabled={finished}
                  placeholder="Type a diagnosis"
                />
                {!!suggestions.length && suggestionsOpen && !finished && (
                  <div className="suggestions">
                    {suggestions.map((term) => (
                      <button
                        key={term}
                        type="button"
                        onClick={() => {
                          setGuess(term);
                          setSuggestionsOpen(false);
                          setApiSuggestions([]);
                        }}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button className="primaryAction submitAction" type="button" onClick={submitGuess} disabled={finished}>Submit</button>

              <div className="clues">
                {visibleClues.map((clue, index) => (
                  <div className="clue" key={clue}>
                    <strong>Clue {index + 1}</strong>
                    <p>{clue}</p>
                  </div>
                ))}
              </div>

              {finished && (
                <div className="result">
                  <p className="eyebrow">{solved ? "Correct" : "Answer"}</p>
                  <h2>{selectedCase.answer}</h2>
                  <p>{selectedCase.explanation}</p>
                  <div className="chips">
                    {selectedCase.differentials.map((term) => <span key={term}>{term}</span>)}
                  </div>
                  {solved && (
                    <button className="primaryAction resultSubscribe" type="button" onClick={openSubscribe}>
                      Remind me tomorrow
                    </button>
                  )}
                  <button className="ghostAction" type="button" onClick={resetGame}>Play again</button>
                </div>
              )}
            </article>
          </div>
        </section>
      )}
      </main>
      {subscribeOpen && (
        <div className="modalOverlay" role="presentation">
          <section className="subscribeModal" role="dialog" aria-modal="true" aria-labelledby="subscribe-title">
            <button className="modalClose" type="button" onClick={dismissSubscribe} aria-label="Close">x</button>
            <p className="eyebrow">You solved it</p>
            <h2 id="subscribe-title">Tomorrow's Dentle drops fresh.</h2>
            <p>Get one quick reminder when the next dental diagnosis board is live.</p>
            {subscribeState === "saved" ? (
              <div className="subscribeSuccess">You're on the list. See you tomorrow.</div>
            ) : (
              <div className="subscribeForm">
                <input
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Email for daily Dentle"
                  type="email"
                />
                <button className="primaryAction" type="button" onClick={subscribe} disabled={subscribeState === "saving"}>
                  {subscribeState === "saving" ? "Saving" : "Notify me"}
                </button>
              </div>
            )}
            {subscribeState === "error" && <p className="formError">{subscribeError || "Could not subscribe yet."}</p>}
          </section>
        </div>
      )}
    </>
  );
}
