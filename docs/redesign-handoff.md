# Dentle Website Redesign Handoff

Use this document as the complete product and interface brief for redesigning Dentle. The visual design may change substantially, but the redesign must preserve the functional behavior described here unless a proposed improvement is explicitly identified.

## Copy-Paste Prompt For A Design AI

Redesign a responsive web application called **Dentle**, a daily Wordle-style dental diagnosis game for dental students, residents, hygienists, pre-dental students, and clinicians.

Dentle gives players five different dental boards each day. A player chooses a board, reads a short clinical case, reviews a supporting clinical image, and gets six attempts to enter the correct diagnosis or clinical decision. The first clue is visible immediately. Every incorrect guess reveals one additional clue. Correct and failed games end with the official answer, a short explanation, and three differential diagnoses.

The redesign must include both:

1. The public player experience at `/`
2. The private operational dashboard at `/admin`

The product should feel clinically trustworthy, focused, modern, and enjoyable. It should not feel like a generic quiz template, hospital software, a children's tooth game, or an AI-generated content feed. Clinical accuracy and image relevance are central trust signals.

Preserve all workflows, states, content fields, and controls described below. Improve visual hierarchy, mobile ergonomics, accessibility, information density, and clarity. Use real clinical imagery only when it directly matches the case. If no verified image is available, show a clearly labeled structured clinical-findings panel or educational diagram instead of an unrelated image.

Do not create a marketing landing page before the product. The first screen must be the usable game introduction. Keep the public experience playful and approachable; keep the admin experience compact, operational, and easy to scan.

## Product Summary

**Name:** Dentle

**Primary line:** Guess the dental diagnosis.

**Supporting line:** One case. Six tries. Each miss reveals a better clue.

**Concept:** A daily dental diagnosis game inspired by Wordle-style progressive guessing.

**Primary audience:**

- Dental students preparing for examinations, boards, and clinic
- Dental residents
- Dental hygienists and hygiene students
- Pre-dental students
- Early-career dentists

**Core value:**

- Fast daily clinical reasoning practice
- Progressive clues instead of a conventional multiple-choice quiz
- Dental-specific cases, tests, radiographs, pathology, trauma, and emergencies
- Concise teaching after every board

**Current daily board modes:**

1. Dentle Dx
2. Radiograph
3. Oral Path
4. Treatment Plan
5. Emergency

## Information Architecture

### Public Route: `/`

The public route is a single-page, three-step application. It does not use separate URLs for each step.

1. **How:** Introductory instructions
2. **Board:** Daily board selection
3. **Play:** Active diagnosis game

A persistent header appears above all three steps.

### Admin Route: `/admin`

The admin route is a private dashboard protected by an admin password. It includes analytics, recent player activity, publication controls, subscribers, automation health, publication history, and previews of today's boards.

### Supporting API Behavior

The frontend depends on:

- `/api/today`: Loads the five published boards for the current UTC date
- `/api/diagnoses`: Supplies diagnosis autocomplete suggestions
- `/api/events`: Records anonymous analytics and guess activity
- `/api/subscribe`: Saves reminder email subscriptions
- `/api/admin/metrics`: Loads the admin dashboard
- `/api/admin/daily`: Publishes reviewed or AI-generated boards for a selected date
- `/api/admin/trigger-cron`: Runs the daily publishing workflow manually
- `/api/cron/daily`: Protected external cron endpoint

## Shared Public Header

The header contains:

- Dentle brand link on the left
- A square teal brand mark containing a white tooth
- The word `Dentle`
- A three-part progress control on the right:
  - How
  - Board
  - Play

The active step is visually emphasized. The labels currently indicate progress rather than acting as navigation buttons. Selecting the Dentle brand returns to the How step.

The redesign may make this progress control interactive if back-navigation and game-state behavior remain clear.

## Public Screen 1: How

### Purpose

Explain the game immediately and move the user into board selection.

### Content

- Eyebrow: `DENTLE.ORG`
- H1: `Guess the dental diagnosis.`
- Supporting copy: `One case. Six tries. Each miss reveals a better clue.`

### Instruction Items

**1 — Look**

`Read the short case and inspect the image.`

**2 — Type**

`Start typing. The diagnosis list helps with spelling.`

**3 — Learn**

`After the board, see the answer and why it fits.`

### Primary Action

- Button label: `Next`
- Destination: Board selection

### Current Layout

Desktop uses a large white stage with the three instructions in a horizontal row. Tablet and mobile stack the instructions vertically and give each item more height. The mobile design intentionally extends downward rather than leaving a large blank area.

## Public Screen 2: Board Selection

### Purpose

Let the player choose one of the five daily case types.

### Content

- Eyebrow: `Choose a board`
- H1: `What do you want to diagnose?`

### Board Cards

Five selectable cards are populated from the daily data:

- Dentle Dx with its clinical category
- Radiograph with its clinical category
- Oral Path with its clinical category
- Treatment Plan with its clinical category
- Emergency with its clinical category

Each card displays:

- Board mode as the main label
- Case category as the secondary label

The selected card has a stronger border, pale teal background, and focus ring. The first board is selected by default.

Selecting a card:

- Changes the active board
- Resets any previous game state
- Records a `board_select` analytics event

### Actions

- `Back`: Return to the How screen
- `Next`: Open the selected board in Play

### Responsive Behavior

Desktop displays five columns. Tablet and mobile display one card per row. Mobile cards become short, dense selection rows.

## Public Screen 3: Play

### Top Bar

- `Boards` button returns to board selection
- Current board mode
- Difficulty level

The mode and difficulty currently appear as compact labels.

### Main Layout

Desktop uses two columns:

- Left: visual evidence
- Right: case and game interaction

Tablet and mobile stack the image above the game.

### Visual Evidence Panel

The current panel contains:

- Case image
- Accessible image alt text
- Image credit overlay at the bottom
- Fallback panel with a tooth mark and case category if the image fails

Each case includes additional image metadata that is not currently displayed:

- Search query used to find an image
- Description of the clinical role the image should play

### Critical Redesign Requirement

An image must never be decorative or merely related to dentistry. It must show the exact modality, region, lesion, finding, or treatment clue described by the case.

Recommended evidence states:

1. **Verified clinical image**
2. **Educational illustration**
3. **Structured clinical findings**
4. **No image required**

The design should expose image provenance or verification status without distracting from play.

### Case Panel

Displays:

- Category eyebrow
- Case title
- Short clinical vignette

The vignette is visually separated with a teal left rule.

### Attempts

There are exactly six attempt cells.

States:

- Empty: unused
- Coral/red: incorrect guess
- Mint/green: correct guess

A small legend explains all three colors.

### Diagnosis Input

- Placeholder: `Type a diagnosis`
- Disabled when the game is finished
- Pressing Enter submits
- Pressing Escape closes autocomplete

Autocomplete combines:

- A curated local dental diagnosis bank
- Case-specific answers, aliases, and differentials
- Server suggestions from the diagnosis API
- Dental-related Wikidata results when the curated bank has too few matches

Suggestions are ranked for:

- Exact matches
- Prefix matches
- Contained text
- Limited typo tolerance

Autocomplete currently shows up to eight unique terms. On mobile it opens above the input so it remains visible near the keyboard.

### Submit

- Full-width button labeled `Submit`
- Disabled after game completion
- Empty submissions do nothing

### Guess Logic

- The answer is checked against the official answer and accepted aliases
- Matching ignores capitalization, punctuation, repeated spaces, and formatting
- A correct guess ends the game immediately
- An incorrect guess fills the next attempt cell and reveals another clue
- Six incorrect guesses end the game as failed

### Clues

- Every case contains exactly five progressive clues
- Clue 1 is visible before the first guess
- Each wrong guess reveals one additional clue
- Each clue appears in its own bordered block with:
  - `Clue 1`, `Clue 2`, and so on
  - The clue content

### Completion Result

Shown after a correct answer or after six misses.

Displays:

- Eyebrow: `Correct` when solved, otherwise `Answer`
- Official answer
- Short teaching explanation
- Three differential-diagnosis chips

Actions:

- When solved: `Remind me tomorrow`
- Always: `Play again`

`Play again` resets the current board but does not return to board selection.

### Subscription Timing

After a correct answer, the reminder modal opens automatically after six seconds unless:

- The user has previously subscribed in this browser
- The user dismissed the reminder earlier that UTC day

The player can also open it immediately with `Remind me tomorrow`.

## Subscription Modal

### Content

- Eyebrow: `You solved it`
- H2: `Tomorrow's Dentle drops fresh.`
- Copy: `Get one quick reminder when the next dental diagnosis board is live.`
- Email input placeholder: `Email for daily Dentle`
- Primary button: `Notify me`
- Close button

### States

**Idle**

Email input and Notify button are available.

**Saving**

Button label changes to `Saving` and is disabled.

**Success**

Shows: `You're on the list. See you tomorrow.`

**Error**

Shows the server error or: `Could not subscribe yet.`

Closing the modal records a dismissal for the current UTC date.

## Daily Case Data Model

Every board contains:

- `id`: Unique board identifier
- `number`: Position in the daily set
- `mode`: One of the five board modes
- `category`: Dental specialty or topic
- `difficulty`: Usually Beginner or Intermediate, with Advanced supported
- `title`: Short memorable case title
- `prompt`: Brief patient vignette
- `clues`: Exactly five progressive clues
- `answer`: Official accepted answer
- `aliases`: Alternative accepted answers and abbreviations
- `explanation`: Brief teaching explanation
- `differentials`: Exactly three tempting alternatives
- `image.src`: Image URL
- `image.alt`: Accessible clinical description
- `image.credit`: Source and licensing credit
- `image.apiQuery`: Search phrase for sourcing an image
- `image.clueRole`: Description of what the image must demonstrate

## Daily Content Behavior

The app requests the current UTC day's published cases from Supabase.

If a published record exists:

- Load its five boards
- Use its publication source

If Supabase is unavailable or nothing is published:

- Use five static reviewed fallback boards
- Continue allowing the game to work

The five static fallback topics are:

1. Symptomatic irreversible pulpitis
2. Dentigerous cyst
3. Pseudomembranous candidiasis
4. Replantation of an avulsed permanent tooth
5. Hypoglycemia

## Anonymous Analytics

The browser creates and stores an anonymous visitor UUID in local storage.

Tracked events:

- Page view
- Board selection
- Guess submission
- Board solved
- Board failed
- Subscription prompt viewed
- Subscription prompt dismissed
- Subscription submitted

Guess events store:

- Board
- Category
- Attempt number
- Correct or incorrect
- Submitted guess text, limited to 120 characters

Analytics failure must never interrupt gameplay.

## Admin Authentication

### Locked State

Displays:

- Password input with placeholder `Admin password`
- Button labeled `Open admin`
- Loading label while checking credentials
- Error notice if authentication fails

### Unlocked State

Displays:

- `Admin unlocked`
- `Switch key` button

The admin key is stored in local storage. `Switch key` removes it and returns to the locked state.

### Disconnected Supabase State

If credentials are valid but Supabase is not configured:

- Heading: `Connect Supabase`
- Explanation that no fake analytics are displayed
- List of missing environment variables

## Admin Header

- Eyebrow: `Dentle Admin`
- H1: `Daily Boards and Growth`
- Link: `Player site`

The admin should feel like an operational dashboard, not a marketing page. Favor restrained density, scanning, clear hierarchy, and efficient actions.

## Admin Notices

A notice area displays confirmations and errors such as:

- Reviewed boards published
- AI boards generated
- Publisher already ran
- Subscriber emails copied
- Publish or connection error

## Admin Summary Metrics

Six top-level metric blocks:

1. Daily views
2. Users
3. Board starts
4. Guesses
5. Solves
6. Subscribers

The metrics endpoint currently covers the last seven UTC days for events. Subscriber totals come from the subscriber table.

## Admin Operations Panel

Displays:

- **Today:** number of boards live or `Fallback active`
- **Daily cron:** `Configured` or `Missing secret`
- **Claude:** `Ready` or `Missing key`
- **Solve rate:** percentage of board starts that became solves
- **Subscribe rate:** subscribers divided by views

## Admin Publish Date

- Native date input
- Defaults to the current UTC date
- `Today` button resets it to the current UTC date

The selected date controls reviewed publishing, AI publishing, and manual publisher execution.

## Admin Last Seven Days Chart

A seven-day grouped vertical bar chart.

Each day contains four bars:

- Views: teal
- Users: dark green
- Guesses: gold
- Solves: coral

Includes:

- Date labels in `MM-DD` format
- Color legend
- Refresh button

The current chart shares one maximum across all series.

## Admin Board Performance

One row for each observed board mode.

Displays:

- Board name
- Solve rate
- Relative bar based on starts
- Starts
- Guesses
- Failed games
- Average attempts among solved games

Rows are sorted by board starts descending.

## Admin Recent Guesses

Displays the latest 20 guess submissions, newest first.

Each row includes:

- Guess text or `No guess text` for historical events
- Board mode
- Attempt number
- Correct or Miss status
- Localized date and time

Includes a Refresh button.

Correct status uses teal. Miss status uses a dark red.

## Admin Daily Question Control

Explanatory copy:

`Publish reviewed boards, generate a selected date with Claude, or run the same daily publisher used by cron.`

Actions:

- `Publish reviewed`: Publishes the five static reviewed fallback boards for the selected date
- `Generate AI date`: Generates five new boards with Claude and publishes them
- `Run publisher`: Runs the same idempotent publishing workflow used by cron

All actions:

- Use the selected date
- Require the admin key
- Show loading/disabled state
- Refresh metrics after success

## Admin Subscribers

Displays up to 12 latest subscribers:

- Email address
- Subscription date

Action:

- `Copy emails`: Copies all currently loaded subscriber emails as a comma-separated string

Empty state:

- `No subscribers yet.`

## Admin Cron And Automation Status

Explains that:

- Claude generates five boards
- Supabase stores and publishes them
- The selected date can be used for backfills or manual tests

Status indicators:

- Cron secret configured or missing
- Claude API key configured or missing

## Admin External Cron

Current operational configuration:

- Name: Dentle Daily
- Provider: cron-job.org
- Endpoint: `/api/cron/daily`
- Scheduled externally for 12:00 PM
- Protected by a cron secret sent as a Bearer token or `x-cron-key`

The panel displays:

- Endpoint
- Secret status: Ready or Missing

Do not expose the secret value.

## Admin Published Days

Publication history list.

Each record displays:

- Publish date
- Source, such as `claude-admin`, `admin-reviewed`, or cron source
- Number of boards

The admin API currently loads up to 14 recent published records, though the live database may contain fewer.

Includes a Refresh button.

## Admin Today's Board Preview

Only shown when a record exists for the current UTC date.

Five preview items display:

- Board mode
- Case title
- Official answer

This preview is informational and does not currently edit individual boards.

## AI Content Pipeline

Claude generates exactly five boards:

- Dentle Dx
- Radiograph
- Oral Path
- Treatment Plan
- Emergency

Generation rules:

- Prompt under 28 words
- Exactly five progressive clues
- Specific board-review-style answer
- Accepted aliases and abbreviations
- Explanation under 35 words
- Exactly three differentials
- No identifying patient information
- No patient-specific treatment advice

The current image pipeline searches Openverse using:

- Requested image search phrase
- Answer
- Board mode
- Category
- Dental keywords

The redesign should anticipate a future human-review and image-verification workflow. Useful future admin states include:

- Draft
- Awaiting image
- Image match confidence
- Awaiting clinical review
- Approved
- Rejected
- Scheduled
- Published
- Reported by players

## Clinical Trust Requirements

The current product's most important weakness is the possibility of a mismatch between the case text and image.

The redesign should make these concepts clear:

- Image modality, tooth, region, and findings
- Whether the image is required to answer the case
- Image source and license
- Verification status
- Reviewer identity or reviewer role
- Date reviewed
- Ability for players to report a questionable case

Recommended replacement when no verified image exists:

- Tooth number or region
- Image modality
- Pulp testing
- Percussion and palpation
- Probing depths
- Mobility
- Radiographic findings
- Relevant negatives

Do not use generic dental-office photography as case evidence.

## Current Visual Language

### Colors

- Ink: `#13211e`
- Muted text: `#5a6864`
- Border: `#d8e1dd`
- Page background: `#fbfaf6`
- Surface: `#ffffff`
- Primary teal: `#067f73`
- Dark green: `#0f2d2a`
- Mint success: `#bde9dc`
- Coral error/miss: `#e86f58`
- Gold chart accent: `#d8a027`

### Typography

- Current family: Inter/system sans-serif
- Headlines use very heavy weights
- Intro headlines are oversized and tightly line-spaced
- Eyebrows are uppercase teal labels
- Letter spacing should remain zero except small uppercase metadata labels

### Shape And Depth

- Most corners use an 8px radius
- Thin pale-gray/green borders
- White surfaces on warm off-white background
- Soft elevated shadow
- Primary buttons are teal
- Secondary buttons are white with borders

### Design Character

Keep:

- High legibility
- Warm clinical neutrality
- Teal brand recognition
- Strong headings
- Clear success and failure colors

Improve:

- Clinical credibility
- Image verification signals
- Public screen hierarchy
- Admin density and navigation
- Empty, loading, offline, and error states
- Keyboard and screen-reader behavior
- Mobile game ergonomics

Avoid:

- Blue hospital-dashboard clichés
- Cartoon dentistry
- Excessive pill-shaped controls
- Large decorative gradients
- Generic stock imagery
- Nested cards
- A marketing hero before the game
- Making every section look like an isolated floating card

## Responsive Requirements

### Desktop

- Public content max width is approximately 1180px
- Admin max width is approximately 1220px
- Intro instructions use three columns
- Board selection uses five columns
- Play uses image and case columns
- Admin uses six metric columns and asymmetric two-column panel grids

### Tablet: 980px And Below

- Intro, board cards, play columns, status blocks, and board previews stack
- Image panel becomes approximately 320px tall
- Intro instruction cards become taller with larger internal spacing
- Admin metrics use two columns
- Admin content panels generally stack

### Mobile: 640px And Below

- Outer gutters become 8px
- Header remains a compact horizontal row
- Brand mark and brand text shrink
- Progress labels divide the remaining width equally
- Stage fills most of the viewport height
- Intro instruction cards stack vertically
- Board cards become compact rows
- Back and Next share the available width
- Autocomplete opens above the input
- Subscription form becomes one column
- Admin header, login, action groups, and panel headers stack vertically
- Admin lists become single-column records

No text or controls should overlap, overflow, or become unreadable at narrow widths.

## Accessibility Requirements

- Preserve semantic headings and regions
- Keep descriptive image alt text
- Make progress state understandable without color alone
- Add visible keyboard focus states
- Maintain strong text and control contrast
- Keep touch targets at least 44px high
- Announce result, error, and successful subscription states
- Trap focus inside the modal and restore it when closed
- Allow Escape to close autocomplete and the modal
- Replace the text `x` close control with an accessible close icon
- Add text or pattern cues to attempt colors
- Ensure charts have text summaries or accessible data tables

## Important Existing Behaviors To Preserve

- The game works with a static fallback if Supabase is unavailable
- Analytics failures never block gameplay
- The first clue is visible immediately
- Every miss reveals one clue
- There are six attempts and five clues
- Official aliases count as correct
- Autocomplete is assistance, not multiple choice
- All five daily boards are independently playable
- Player and admin routes remain separate
- Admin secrets never appear in the client UI
- Daily publishing is date-selectable and idempotent through the cron workflow
- Historical guess rows without guess text remain understandable
- Current date handling uses UTC dates

## Known Product Gaps Worth Designing For

These are not fully implemented yet, but the redesign should leave room for them:

- Case archive
- Player statistics and streaks
- Shareable result grid
- Sources and further reading
- Explicit diagnosis-first then treatment-plan flow
- Differential diagnosis interaction
- Clinician review queue
- Image verification and confidence scoring
- Player case-reporting
- Reviewer profiles and approval history
- Faculty authoring tools
- School/cohort dashboards
- Premium practice library and specialty packs

## Suggested Redesign Deliverables

Ask the design AI to return:

1. Product sitemap and user flows
2. Desktop and mobile wireframes for all public states
3. Desktop and mobile wireframes for all admin states
4. Visual design system with color, type, spacing, borders, icons, and states
5. Component inventory
6. Clinical image verification pattern
7. Loading, empty, offline, success, error, and permission states
8. Accessible interaction notes
9. Responsive behavior for every major component
10. A prioritized list of UX changes, separated into required and optional improvements

## Source Code Map

The current implemented application is primarily located in:

- `pages/index.tsx`: Complete public player experience
- `pages/admin.tsx`: Complete admin dashboard
- `styles/globals.css`: Shared public and admin visual styling
- `lib/cases.ts`: Static reviewed fallback cases and case schema
- `lib/diagnoses.ts`: Curated diagnosis bank and autocomplete scoring
- `lib/ai.ts`: Claude generation and Openverse image matching
- `lib/adminMetrics.ts`: Dashboard metric calculations
- `lib/dailyPublisher.ts`: Shared daily publishing workflow
- `lib/supabaseRest.ts`: Supabase server access and admin validation
- `pages/api/*`: Player, analytics, subscription, admin, and cron APIs
- `supabase/schema.sql`: Database tables, indexes, and row-level security

The root-level `index.html`, `app/app.js`, `app/styles.css`, and `data/*.js` belong to an older prototype and are not the current Next.js product surface.
