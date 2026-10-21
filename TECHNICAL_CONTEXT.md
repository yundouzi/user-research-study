# Technical Context

## Evidence and scope

This document describes the files currently accessible in this workspace. It does not claim access to other conversations, private repositories, production infrastructure, or participant databases.

No credentials are reproduced here. No participant data is included.

## Current project layout

```text
播客-用户研究/
├─ .gitignore
├─ config.example.js
├─ index.html
├─ RESEARCH_CONTEXT.md
├─ TECHNICAL_CONTEXT.md
├─ DECISIONS_AND_NEXT_STEPS.md
└─ assets/
   ├─ beneath-overview.png
   ├─ beneath-detail.png
   └─ beneath-legacy-cn.html
```

The main application is a single-file, client-side web prototype. `index.html` contains all markup, CSS, application state, episode data, rendering functions, event handlers, timing logic, and export logic. `config.example.js` documents the optional local researcher-view configuration without storing an access value. The two PNG files support Task 1 feedback. The large legacy HTML asset is a local Chinese visualization fallback.

The workspace is a local Git working tree prepared for an initial commit. No GitHub remote is documented in this file.

## Architecture

### Runtime model

- Vanilla HTML, CSS, and JavaScript; no bundler, package manager, or compilation step.
- A single root `<main>` is re-rendered by replacing `innerHTML` for the current study step.
- A `views` object maps step names to HTML-rendering functions.
- Event handling is a mix of event delegation and direct handlers attached after each render.
- State is stored as one JSON object in browser `localStorage`.
- Timers use `setInterval`; page transitions stop the active timer.
- Downloads use `Blob`, `URL.createObjectURL`, and a temporary anchor.

### Main modules inside `index.html`

1. **Embedded data**
   - a 20-episode desktop study set;
   - per-episode metadata and derived statistics;
   - manually embedded theme profiles;
   - a larger phone-condition episode set, of which the first 5/10/15 records are used;
   - Task 1 prompts and fixed Task 2-A prompts.

2. **State and navigation**
   - generated participant ID;
   - current step and trial indices;
   - answers, selected fields, rankings, and event log;
   - persistent back/restart controls;
- locally configured researcher navigation gate and research console.

3. **Study views**
   - introduction/consent;
   - background survey;
   - Task 1 instructions, trials, and feedback;
   - Task 2-A retrieval layouts;
   - Task 2-B phone-scale rating conditions;
   - Task 2-C selection, feedback, and ranking;
   - interview timer and completion/export.

4. **Visualization rendering**
   - conventional list;
   - free association network using SVG edges and fixed card positions;
   - topic-cluster regions;
   - hierarchical tree with SVG connectors;
   - separate phone-size renderers for 5, 10, and 15 items.

5. **Logging and export**
   - events are appended to in-memory state and immediately saved to `localStorage`;
   - CSV and JSON are downloaded in the browser;
   - interruption can be marked from the research console.

## Implemented features

### Confirmed

- Anonymous-looking participant ID generation and “do not enter real name” guidance.
- Consent gating and background form validation.
- Task 1 three-minute timer plus ten-second overtime/grace period.
- External Beneath the Conversation link and local Chinese legacy fallback.
- Screenshot-supported Task 1 feedback cards.
- Four Task 2-A layouts with episode selection, confirmation, abandonment, and timeout.
- Rich hover tooltip containing title, guest, themes, summary, duration, play count, and comment count.
- Free-network edges derived from cosine similarity of embedded theme profiles; strong edges are visually distinguished.
- Fixed, non-drifting positions for all network structures.
- Task 2-B 5/10/15 phone conditions for all four structures.
- Task 2-C title-only initial state, global reveal of up to three fields, selection feedback, and drag-to-rank interaction.
- Participant/researcher views, stage jumping, recent event display, interruption marking, and local CSV/JSON export.
- Persistent back and restart buttons.
- Responsive styling and an iPhone 17 portrait-ratio presentation for Task 2-B.

### Verification already performed in this conversation

- The JavaScript block passed a syntax check.
- Browser inspection reported no console warnings or errors during the tested workflow.
- Desktop network, topic-cluster, and tree nodes were checked for overlap after the latest layout changes.
- Fifteen-item phone network and topic-cluster layouts were checked for overlap and internal overflow.
- The working copy and the copy in the previously used transfer folder had matching hashes at the time of that check.

These checks are useful evidence, not a substitute for automated regression tests.

## Dependencies and browser requirements

### Local dependencies

There are no JavaScript package dependencies. Relative assets must remain beside `index.html` in the existing `assets/` structure.

### External dependency

Assisted Task 1 links to the hosted Beneath the Conversation site. Internet access is required for that hosted version. The local Chinese legacy page is a fallback, not a verified line-by-line translation of the current hosted site.

### Browser features used

- `localStorage`;
- `Blob` and object URLs;
- HTML drag-and-drop;
- `MutationObserver`;
- SVG;
- CSS Grid, `aspect-ratio`, `backdrop-filter`, and `color-mix()`.

A current Chromium, Edge, Firefox, or Safari release is recommended. Cloud deployment should include cross-browser testing because some visual CSS features may degrade differently.

## Local setup

### Simplest use

Open `index.html` directly in a modern browser. Relative local assets should load when the folder structure is preserved.

Participant-facing use requires no configuration. To enable the researcher view for local prototype use, copy `config.example.js` to the Git-ignored `config.js` and set a local convenience code. Do not use a real password or a credential reused elsewhere. This browser-visible setting is not authentication.

### Recommended local server

Serving over HTTP better approximates cloud deployment and avoids browser-specific `file://` restrictions.

```powershell
cd "C:\path\to\播客-用户研究"
python -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

No install or build command is required.

## Static cloud deployment

The current prototype can be uploaded to any static host as a folder containing `index.html` and `assets/`. However, static hosting alone does **not** make the system suitable for real participant data. It preserves the current browser-local storage and client-side access model.

A research-ready cloud deployment should separate:

- static participant UI;
- authenticated researcher console;
- server-side condition assignment and answer keys;
- a protected event/response API;
- an encrypted database;
- separately governed screen-recording storage;
- retention, deletion, audit, and export workflows.

## Current data model

The local state contains:

- participant identifier;
- current step and trial indices;
- event array;
- answer object;
- selected Task 2-C fields;
- ranking order.

Each event currently records type, target, payload, ISO timestamp, and epoch milliseconds. The richer logical schema proposed in the older protocol—participants, episodes, semantic relations, assignments, trial tables, Task 2-C sessions, and normalized interaction events—has not been implemented as a database.

## Known issues and migration risks

### Confirmed implementation limitations

1. **No backend or multi-user isolation.** All progress and answers are stored in one browser-local record. Restarting deletes it, and multiple participants on one browser require careful export/reset handling.
2. **Researcher access is client-side only.** The access value is no longer committed and may be supplied through a Git-ignored local configuration, but any value loaded by the browser remains inspectable. This is not authentication and must not protect cloud research data.
3. **No secure answer-key separation.** Task prompts and all episode data are shipped in the same client file. Correct-answer evaluation is not server-side.
4. **No automatic correctness scoring.** Task 1 stores typed answers; Task 2-A stores a selected episode and status, but the prototype does not calculate correctness.
5. **Incomplete behavioral measures.** Hover detail is available but hover count and unique nodes inspected are not logged, despite being proposed in the protocol.
6. **Fixed experimental order.** Task 2-A and Task 2-B do not implement assignment, randomization, or counterbalancing.
7. **CSV context bug.** Export constructs the `module` column from the current global step at export time rather than storing the module with each event. Historical rows may therefore receive the wrong module label.
8. **Event schema is loosely typed.** Different event payloads have different shapes and are not versioned.
9. **Material provenance is not encoded.** Episode records do not carry explicit source, verification, real/simulated status, or data-version metadata.
10. **Local state has no migration/version strategy.** Schema changes can leave stale browser state incompatible with new code.
11. **The local Chinese fallback is large.** The single HTML asset is roughly 19.5 MB and may affect repository size and deployment transfer time.
12. **No automated test suite or CI.** Current verification has been manual and browser-assisted.
13. **All code is in one file.** This is convenient for a prototype but makes review, testing, data updates, and cloud security boundaries difficult.

### Source-of-truth mismatch

The V3.0 protocol describes Task 2-B as 10/20/40 items. The current application and the latest confirmed conversation decision use 5/10/15. Documentation, analysis plans, condition codes, and future data schemas must be reconciled before data collection.

### Assumptions requiring validation

- Episode titles, guests, durations, themes, summaries, play counts, comment counts, and dates are suitable for formal research use.
- Embedded theme profiles are the intended final similarity source.
- The first 5/10/15 phone records create comparable nested material sets.
- The hosted and local visualization variants expose sufficiently comparable assistance for Task 1.

## Recommended cloud-oriented refactor boundaries

1. Move episode data, prompts, condition definitions, and theme relations into versioned JSON or database tables.
2. Introduce a small routing/state layer instead of rebuilding the entire application from one `views` object.
3. Define a versioned event schema with participant/session/trial/module fields captured at event time.
4. Put researcher authorization, answer keys, correctness evaluation, and condition assignment on the server.
5. Add autosave with retry/idempotency and a visible connection state.
6. Add tests for timers, back/restart behavior, condition coverage, exports, field limits, ranking, and responsive layouts.
7. Preserve a clearly labeled local/demo mode for design review without participant data.
