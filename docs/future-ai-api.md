# Future AI And Diagnosis API Plan

## Goal

Dentle should publish a fresh set of dental boards every day without manually editing static files.

The ideal system:

- pulls from a curated dental diagnosis bank
- generates daily board drafts with AI
- validates the answer, aliases, clues, and explanation
- stores the approved case
- publishes it automatically
- keeps API keys private on the server

## Current Status

The project has already moved to Next.js / TypeScript, so we do not need to change languages for launch automation.

Live routes:

```text
GET /api/today
POST /api/admin/generate-case
GET /api/admin/metrics
GET /api/admin/daily
POST /api/admin/daily
GET /api/cron/daily
POST /api/events
POST /api/subscribe
GET /api/diagnoses?q=gingvit
GET /api/images/search?q=dentigerous+cyst+radiograph
```

`/api/today` is the main daily board endpoint. It uses Gemini when `GEMINI_API_KEY` is available, caches the result for the date, and safely falls back to the reviewed launch cases if AI generation fails.

`/api/admin/generate-case` is the single-board test endpoint. It is useful for checking whether the Gemini key and model have working access before relying on daily automation.

Environment variables:

```text
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-3.5-flash
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ADMIN_PASSWORD=...
CRON_SECRET=...
```

Keys must stay server-side only. Keep them in `.env.local`, never in client code, and rotate any key that was pasted into chat or screenshots.

## Supabase Admin And Analytics

Run `supabase/schema.sql` in the Supabase SQL editor before using analytics.

The schema enables RLS and adds narrow public policies:

- anonymous users may insert gameplay events
- anonymous users may insert subscriber emails
- anonymous users may read published daily cases
- admin analytics still require the server-side service role key

The app writes real events only:

- page views
- board selections
- guess submissions
- solves
- failures
- subscribe prompt views/dismissals
- subscriber emails

No fake chart data should be shown. If Supabase env vars or tables are missing, `/admin` shows a setup state instead of fabricated metrics.

Local development admin password fallback: `dentle-admin`. Production must set `ADMIN_PASSWORD`.

The admin page can:

- view real daily usage charts from Supabase
- view board activity
- view recent subscribers
- publish reviewed boards for today
- generate and publish Gemini boards for today when Gemini access/quota works

For hands-off daily automation, schedule `GET /api/cron/daily` once per day with `Authorization: Bearer <CRON_SECRET>`. The route skips generation if that date is already published.

Gemini daily generation now requests all five boards in one API call instead of one call per board. This reduces free-tier quota pressure and makes the daily job less likely to fail halfway through.

Current blocked item: the API call reaches Google, but the configured project can hit provider-side access or quota limits. If the route returns a warning, check the `nextStep` field, rotate any exposed key, and confirm Gemini API access/quota in Google AI Studio.

## Do We Need To Change Languages?

Not yet.

The current Next.js app is good for product testing and launch automation.

For production automation, move to one of these:

### Recommended: Next.js / TypeScript

Best fit if we want:

- website and backend in one project
- scheduled daily jobs
- API routes for diagnosis search
- Gemini or OpenAI calls from the server
- easy deployment on Vercel
- future admin dashboard

### Also Good: Python Backend

Best fit if we want:

- heavier content pipelines
- dental-source scraping/import tools
- offline review scripts
- data science or evaluation tools

## Diagnosis API

There may not be a perfect public "dental diagnosis API" that gives clean game-ready answers. The safer product path is to build our own diagnosis API from curated data.

Initial route now scaffolded:

```text
GET /api/diagnoses?q=gingvit
```

Returns:

```json
[
  {
    "name": "Gingivitis",
    "aliases": ["gum inflammation"],
    "category": "Periodontics"
  }
]
```

Possible future data sources:

- curated in-house dental diagnosis list
- SNOMED CT / clinical terminology mapping
- ICD-10 dental-related codes where useful
- dental school review content
- reviewed case archive

Important: the app should not present itself as diagnosing real patients. It is an education game.

## AI Daily Case Generator

Use AI to generate drafts, not final unreviewed medical education.

Daily pipeline:

1. Pick category and difficulty.
2. Pick answer from diagnosis bank.
3. Ask AI to generate:
   - patient vignette
   - five progressive clues
   - accepted aliases
   - explanation
   - tempting differentials
   - social share hook
4. Validate with rules:
   - answer appears in diagnosis bank
   - no patient identifiers
   - no treatment advice framed as personal medical care
   - explanation is short
   - aliases are not too broad
5. Mark as draft.
6. Human reviewer approves.
7. Scheduled job publishes at midnight.

## Gemini API Shape

Use Gemini from a server route, with structured output so the model returns a strict case JSON object.

Do not call Gemini directly from browser JavaScript.

Single-board endpoint:

```text
POST /api/admin/generate-case
```

Daily endpoint:

```text
GET /api/today
```

The daily route currently generates five boards: Dentle Dx, Radiograph, Oral Path, Treatment Plan, and Emergency.

## Image API

Initial route now scaffolded:

```text
GET /api/images/search?q=dentigerous+cyst+radiograph
```

Recommended source for the first pass: Openverse, because it searches Creative Commons and public-domain media from many providers. For launch, still manually review every image for license, accuracy, and educational fit.

Fallback source: Wikimedia Commons API, especially for diagrams, radiographs, and pathology reference images where licensing is visible.

Default image rule:

- The image is a clue, not decoration.
- It must directly show or explain the tested diagnosis, radiographic sign, lesion, emergency, or treatment decision.
- Generic dental-office, smiling-patient, or random tooth photos should not be used for cases.
- If a real licensed clinical image is unavailable, use a clearly labeled educational diagram or generated synthetic image that matches the case finding.

Request:

```json
{
  "category": "Periodontics",
  "difficulty": "Beginner",
  "answer": "Gingivitis"
}
```

Response:

```json
{
  "prompt": "...",
  "clues": ["...", "..."],
  "answer": "Gingivitis",
  "aliases": ["gingival inflammation"],
  "explanation": "...",
  "differentials": ["Periodontitis", "Necrotizing ulcerative gingivitis"]
}
```

## Database Tables

### diagnoses

- id
- name
- aliases
- category
- source
- reviewed_at

### cases

- id
- publish_date
- mode
- category
- difficulty
- prompt
- clues
- answer_id
- aliases
- explanation
- differentials
- status: draft / approved / published

### case_reviews

- case_id
- reviewer
- notes
- approved
- reviewed_at

## Safety Guardrails

- Always show education disclaimer.
- Prefer reviewed cases over fully automated publishing.
- Keep source citations internally.
- Avoid patient-specific treatment advice.
- Flag uncertain AI outputs for review.
- Use structured output and validation before saving.

## First Backend Milestone

When ready, migrate to Next.js and build:

- `/api/diagnoses`
- `/api/today`
- `/api/admin/generate-case`
- `/api/admin/approve-case`
- scheduled daily publish job
