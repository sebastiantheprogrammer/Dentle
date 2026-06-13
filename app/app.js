const STORAGE_KEY = "dental-game-progress-v1";

const state = {
  modeIndex: 0,
  attempts: [],
  solved: false,
  finished: false
};

const els = {
  modeStrip: document.querySelector("#mode-strip"),
  gameKicker: document.querySelector("#game-kicker"),
  gameTitle: document.querySelector("#game-title"),
  difficulty: document.querySelector("#difficulty-pill"),
  caseScene: document.querySelector("#case-scene"),
  prompt: document.querySelector("#case-prompt"),
  guessInput: document.querySelector("#guess-input"),
  suggestionList: document.querySelector("#suggestion-list"),
  submitGuess: document.querySelector("#submit-guess"),
  feedback: document.querySelector("#feedback"),
  attemptTrack: document.querySelector("#attempt-track"),
  clueList: document.querySelector("#clue-list"),
  resultTitle: document.querySelector("#result-title"),
  resultCopy: document.querySelector("#result-copy"),
  differentials: document.querySelector("#differential-list"),
  share: document.querySelector("#share-result"),
  caseGrid: document.querySelector("#case-grid"),
  dailyCount: document.querySelector("#daily-count"),
  streakCount: document.querySelector("#streak-count"),
  statPlayed: document.querySelector("#stat-played"),
  statSolved: document.querySelector("#stat-solved"),
  statRate: document.querySelector("#stat-rate"),
  statStreak: document.querySelector("#stat-streak")
};

function getCase() {
  return window.LAUNCH_CASES[state.modeIndex];
}

function getProgress() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { played: 0, solved: 0, streak: 0, completed: {} };
  }

  try {
    return JSON.parse(stored);
  } catch {
    return { played: 0, solved: 0, streak: 0, completed: {} };
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function normalizeAnswer(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrectGuess(value, gameCase) {
  const normalizedGuess = normalizeAnswer(value);
  const accepted = [gameCase.answer, ...gameCase.aliases].map(normalizeAnswer);
  return accepted.includes(normalizedGuess);
}

function getAnswerBank() {
  const launchTerms = window.LAUNCH_CASES.flatMap((gameCase) => [
    gameCase.answer,
    ...gameCase.aliases,
    ...gameCase.differentials
  ]);
  return [...new Set([...(window.DIAGNOSIS_BANK || []), ...launchTerms])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function scoreSuggestion(query, term) {
  const normalizedQuery = normalizeAnswer(query);
  const normalizedTerm = normalizeAnswer(term);

  if (!normalizedQuery) return 0;
  if (normalizedTerm === normalizedQuery) return 100;
  if (normalizedTerm.startsWith(normalizedQuery)) return 90;
  if (normalizedTerm.includes(normalizedQuery)) return 75;

  const compactQuery = normalizedQuery.replace(/\s/g, "");
  const compactTerm = normalizedTerm.replace(/\s/g, "");
  const termWords = normalizedTerm.split(" ");
  const typoDistance = Math.min(
    editDistance(compactQuery, compactTerm.slice(0, Math.max(compactQuery.length, 1))),
    ...termWords.map((word) => editDistance(compactQuery, word.slice(0, Math.max(compactQuery.length, 1))))
  );

  if (compactQuery.length >= 4 && typoDistance <= 2) return 68;
  if (compactQuery.length >= 6 && typoDistance <= 3) return 62;

  const queryLetters = [...compactQuery];
  const termLetters = compactTerm;
  let cursor = 0;
  let matches = 0;

  queryLetters.forEach((letter) => {
    const foundAt = termLetters.indexOf(letter, cursor);
    if (foundAt >= 0) {
      matches += 1;
      cursor = foundAt + 1;
    }
  });

  const fuzzyScore = Math.round((matches / Math.max(queryLetters.length, 1)) * 60);
  return fuzzyScore >= 38 ? fuzzyScore : 0;
}

function editDistance(left, right) {
  const rows = Array.from({ length: left.length + 1 }, () => []);

  for (let row = 0; row <= left.length; row += 1) rows[row][0] = row;
  for (let col = 0; col <= right.length; col += 1) rows[0][col] = col;

  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      rows[row][col] = Math.min(
        rows[row - 1][col] + 1,
        rows[row][col - 1] + 1,
        rows[row - 1][col - 1] + cost
      );
    }
  }

  return rows[left.length][right.length];
}

function clearSuggestions() {
  els.suggestionList.innerHTML = "";
  els.suggestionList.classList.remove("is-open");
}

function chooseSuggestion(term) {
  els.guessInput.value = term;
  clearSuggestions();
  els.guessInput.focus();
}

function renderSuggestions() {
  const query = els.guessInput.value.trim();
  const suggestions = getAnswerBank()
    .map((term) => ({ term, score: scoreSuggestion(query, term) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.term.localeCompare(b.term))
    .slice(0, 6);

  els.suggestionList.innerHTML = "";

  if (!query || !suggestions.length || state.finished) {
    clearSuggestions();
    return;
  }

  suggestions.forEach(({ term }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "suggestion-item";
    button.textContent = term;
    button.addEventListener("click", () => chooseSuggestion(term));
    els.suggestionList.append(button);
  });

  els.suggestionList.classList.add("is-open");
}

function renderModes() {
  els.modeStrip.innerHTML = "";

  window.LAUNCH_CASES.forEach((gameCase, index) => {
    const button = document.createElement("button");
    button.className = `mode-button${index === state.modeIndex ? " is-active" : ""}`;
    button.type = "button";
    button.innerHTML = `${gameCase.mode}<span>${gameCase.category}</span>`;
    button.addEventListener("click", () => {
      state.modeIndex = index;
      resetBoard();
      render();
    });
    els.modeStrip.append(button);
  });

  els.dailyCount.textContent = window.LAUNCH_CASES.length;
}

function renderAttempts() {
  els.attemptTrack.innerHTML = "";

  for (let index = 0; index < 6; index += 1) {
    const box = document.createElement("div");
    box.className = "attempt-box";
    if (state.attempts[index] === "miss") box.classList.add("is-miss");
    if (state.attempts[index] === "hit") box.classList.add("is-hit");
    els.attemptTrack.append(box);
  }
}

function renderClues() {
  const gameCase = getCase();
  const revealedCount = Math.min(state.attempts.filter((attempt) => attempt === "miss").length + 1, gameCase.clues.length);

  els.clueList.innerHTML = "";
  gameCase.clues.slice(0, revealedCount).forEach((clue, index) => {
    const card = document.createElement("div");
    card.className = "clue-card";
    card.innerHTML = `<strong>Clue ${index + 1}</strong>${clue}`;
    els.clueList.append(card);
  });
}

function renderResult() {
  const gameCase = getCase();

  els.differentials.innerHTML = "";

  if (!state.finished) {
    els.resultTitle.textContent = "Solve to reveal it.";
    els.resultCopy.textContent = "Type a diagnosis. Use the list if you are not sure how to spell it.";
    els.share.disabled = true;
    return;
  }

  gameCase.differentials.forEach((item) => {
    const chip = document.createElement("span");
    chip.textContent = item;
    els.differentials.append(chip);
  });

  els.resultTitle.textContent = state.solved ? gameCase.answer : `Answer: ${gameCase.answer}`;
  els.resultCopy.textContent = gameCase.explanation;
  els.share.disabled = false;
}

function renderCaseCards() {
  els.caseGrid.innerHTML = "";

  window.LAUNCH_CASES.forEach((gameCase) => {
    const article = document.createElement("article");
    article.className = "case-card";
    article.innerHTML = `
      <h3>${gameCase.mode}</h3>
      <p>${gameCase.prompt}</p>
      <div class="case-meta">
        <span>${gameCase.category}</span>
        <span>${gameCase.difficulty}</span>
        <span>${gameCase.publishSlot}</span>
      </div>
    `;
    els.caseGrid.append(article);
  });
}

function renderStats() {
  const progress = getProgress();
  const rate = progress.played ? Math.round((progress.solved / progress.played) * 100) : 0;

  els.streakCount.textContent = progress.streak;
  els.statPlayed.textContent = progress.played;
  els.statSolved.textContent = progress.solved;
  els.statRate.textContent = `${rate}%`;
  els.statStreak.textContent = progress.streak;
}

function renderGame() {
  const gameCase = getCase();
  const sceneClasses = ["case-scene", gameCase.sceneClass].filter(Boolean).join(" ");

  els.gameKicker.textContent = gameCase.mode;
  els.gameTitle.textContent = gameCase.title;
  els.difficulty.textContent = gameCase.difficulty;
  els.caseScene.className = sceneClasses;
  els.prompt.textContent = gameCase.prompt;
  els.guessInput.disabled = state.finished;
  els.submitGuess.disabled = state.finished;

  renderAttempts();
  renderClues();
  renderResult();
}

function render() {
  renderModes();
  renderGame();
  renderCaseCards();
  renderStats();
}

function resetBoard() {
  state.attempts = [];
  state.solved = false;
  state.finished = false;
  els.feedback.textContent = "";
  els.guessInput.value = "";
  clearSuggestions();
}

function markComplete(wasSolved) {
  const gameCase = getCase();
  const progress = getProgress();

  if (!progress.completed[gameCase.id]) {
    progress.played += 1;
    if (wasSolved) {
      progress.solved += 1;
      progress.streak += 1;
    } else {
      progress.streak = 0;
    }
    progress.completed[gameCase.id] = {
      solved: wasSolved,
      attempts: state.attempts.length,
      completedAt: new Date().toISOString()
    };
    saveProgress(progress);
  }
}

function submitGuess() {
  const gameCase = getCase();
  const guess = els.guessInput.value.trim();

  if (!guess || state.finished) return;

  if (isCorrectGuess(guess, gameCase)) {
    state.attempts.push("hit");
    state.solved = true;
    state.finished = true;
    els.feedback.textContent = "Correct.";
    markComplete(true);
  } else {
    state.attempts.push("miss");
    els.feedback.textContent = state.attempts.length >= 6 ? "Board complete." : "Not quite.";
    if (state.attempts.length >= 6) {
      state.finished = true;
      markComplete(false);
    }
  }

  els.guessInput.value = "";
  clearSuggestions();
  render();
}

async function copyResult() {
  const gameCase = getCase();
  const line = state.solved ? `Solved in ${state.attempts.length}/6` : "Missed";
  const board = state.attempts.map((attempt) => (attempt === "hit" ? "G" : "M")).join("");
  const text = `Dental ${gameCase.publishSlot}\n${line}\n${gameCase.mode}: ${gameCase.category}\n${board}\n\ndental.org`;

  try {
    await navigator.clipboard.writeText(text);
    els.feedback.textContent = "Copied.";
  } catch {
    els.feedback.textContent = text;
  }
}

document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-view]").forEach((item) => item.classList.remove("is-active"));
    document.querySelectorAll(".view").forEach((view) => view.classList.remove("is-visible"));
    button.classList.add("is-active");
    document.querySelector(`#${button.dataset.view}-view`).classList.add("is-visible");
  });
});

els.submitGuess.addEventListener("click", submitGuess);
els.guessInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") submitGuess();
  if (event.key === "Escape") clearSuggestions();
});
els.guessInput.addEventListener("input", renderSuggestions);
els.guessInput.addEventListener("focus", renderSuggestions);
document.addEventListener("click", (event) => {
  if (!event.target.closest(".answer-box")) clearSuggestions();
});
els.share.addEventListener("click", copyResult);

render();
