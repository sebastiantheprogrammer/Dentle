# MVP Brief

## Product

Dental is a daily dental diagnosis game. Players read a dental case, guess the diagnosis, and unlock more clues after incorrect guesses.

## Core Screen

Mobile-first game screen:

- top nav: logo, stats, archive
- daily prompt: "What's the Dental Diagnosis?"
- initial vignette
- answer input
- submit button
- revealed clue stack
- attempt count
- post-game summary

## Game Rules

- 6 attempts per puzzle.
- 1 initial vignette.
- 5 additional clues revealed after wrong guesses.
- Correct answer ends the puzzle immediately.
- Synonyms count as correct.
- Missed answer shows the correct diagnosis and explanation.

## Guess Matching

Each case should include accepted answers and aliases.

Example:

```json
{
  "answer": "Symptomatic irreversible pulpitis",
  "aliases": [
    "irreversible pulpitis",
    "sip",
    "symptomatic irreversible pulpitis with normal apical tissues"
  ]
}
```

Matching should normalize:

- capitalization
- punctuation
- extra spaces
- common abbreviations
- simple misspellings later, but not required for v1

## MVP Pages

- `/` daily puzzle
- `/archive` previous puzzles
- `/stats` or modal stats
- `/about` short creator/about/disclaimer

## Local Data Model

Start with static JSON content to ship quickly.

```json
{
  "id": "2026-07-01-endo-001",
  "number": 1,
  "publishDate": "2026-07-01",
  "category": "Endodontics",
  "difficulty": "Beginner",
  "prompt": "A 34-year-old patient reports lingering pain to cold on a mandibular molar with a deep restoration.",
  "clues": [
    "Cold test causes severe pain lasting 45 seconds.",
    "Percussion is normal.",
    "PA radiograph shows no periapical radiolucency.",
    "The tooth has deep recurrent caries under an existing composite.",
    "The most likely diagnosis is pulpal, not apical."
  ],
  "answer": "Symptomatic irreversible pulpitis",
  "aliases": ["irreversible pulpitis", "sip"],
  "explanation": "Lingering thermal pain without apical findings points toward symptomatic irreversible pulpitis.",
  "differentials": ["Reversible pulpitis", "Symptomatic apical periodontitis", "Cracked tooth syndrome"],
  "sources": []
}
```

## Stats

Store in localStorage for v1:

- games played
- wins
- current streak
- max streak
- guess distribution
- last completed puzzle ID

## Share Text

```text
Dental #1
Solved in 3/6
Category: Endodontics

⬜⬜🟩

dental.org
```

If avoiding emoji-only clues for accessibility, use:

```text
Dental #1
Solved in 3/6
Category: Endodontics

Guess 1: miss
Guess 2: miss
Guess 3: solved

dental.org
```

## Visual Direction

The app should feel educational, clinical, and fun without becoming childish.

Suggested UI feel:

- clean white/off-white background
- dental teal plus warm coral or gold accent
- strong readable type
- compact cards for clues
- subtle category color chips
- tooth/radiograph iconography
- mobile-first, thumb-friendly

Avoid:

- overly medical blue-only palette
- cartoon tooth mascot as the main identity
- cluttered quiz-app look
- stock dental-office imagery

## Launch Checklist

- Confirm `Dental` as the name and `dental.org` as the domain.
- Build 30 reviewed launch cases.
- Create social account.
- Recruit 5 to 10 dental student testers.
- Add disclaimer.
- Build daily puzzle MVP.
- Publish daily for 30 days without missing a day.
