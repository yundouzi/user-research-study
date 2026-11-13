# Technical Context

## Scope

This document describes the local application and its ChatGPT Sites compatibility layer. It includes no credentials or participant records.

## Architecture

- `index.html`: static document shell and fixed navigation.
- `styles.css`: responsive visual system and four podcast structures.
- `app.js`: study content, state, rendering, validation, logging, local persistence, Sites synchronization, and export.
- `study-materials.js`: five optional non-secret audio paths.
- `config.example.js`: example local researcher-view configuration.
- `index.js`: Sites-recognized Worker entry point that re-exports `_worker.js`.
- `_worker.js`: Sites-compatible Worker API, D1 persistence, protected aggregate exports, and static-asset fallback.
- `.openai/hosting.json`: Sites project linkage and logical storage bindings. `project_id` is added only by Sites.
- `migrations/0001_research_data.sql`: D1 schema for participants, normalized answers, and events.
- `.env.example`: required runtime key name without a credential value.
- `tests/smoke.test.js`: dependency-free rendering and client schema checks.
- `tests/worker.test.js`: dependency-free Worker route, authorization, persistence, and migration checks.

The site uses vanilla HTML, CSS, and JavaScript. It has no package manager, framework, compilation step, or third-party runtime dependency.

## Participant flow

The 12 stages are consent, profile, Task 1, information ranking, progressive disclosure, within-episode introduction, five within-episode trials, Task 3 introduction, 12 pairwise comparisons, oral structure interview, Xiaoyuzhou scenario, and completion/export.

State is stored under the versioned local key `yzhStudyV6State`. Changing the study version resets incompatible older local state.

## Data model and persistence

State includes participant ID, current step, entry time, structured answers, information ranking, selected reveal fields, content-trial timers, feature-open state, shuffled structure comparisons, chronological events, stable event IDs, and sync metadata.

The browser remains the first-write fallback. On HTTP(S), the client debounces writes to `/api/study/sync`; the Worker upserts the participant snapshot, replaces normalized answers for that participant, and inserts events idempotently by event ID. A `pagehide` beacon attempts a final sync.

The D1 tables are:

- `participants`: versioned full snapshot, current stage, and timestamps.
- `answers`: one normalized row per participant/question/measure.
- `events`: append-only interaction events with stable sequence IDs.

The answer CSV uses the columns:

`participant_id, study_version, question_id, stage, measure, response, duration_ms, metadata`

Multi-select values are separated by semicolons. Pair metadata and feature metadata are JSON strings in the `metadata` column. A separate event CSV retains detailed interaction logs. JSON export retains the complete local state.

## Four structure renderers

- **List:** ordered episode rows.
- **Network:** positioned cards and theme-similarity edges.
- **Tree:** channel root, topic branches, and episode leaves.
- **Category:** topic regions containing episode cards.

Each Task 3 page renders two phone-ratio interfaces side by side and asks for A/B choices.

## Local setup

Open `index.html` directly or run a static server:

```powershell
python -m http.server 8000
```

Then open `http://127.0.0.1:8000/`. A plain static server returns 404 for `/api/*`; the client treats this as local-only mode and keeps the experiment functional.

## Audio and researcher configuration

Formal audio is not included. Add five licensed sources to `study-materials.js`. Empty entries activate demonstration mode.

For the local researcher view, copy `config.example.js` to Git-ignored `config.js`. This remains a local convenience gate. In Sites, set `RESEARCHER_EXPORT_TOKEN` as a secret environment value; aggregate export authorization is enforced by the Worker.

## Verification

Automated smoke checks cover stage rendering, absence of open-ended text areas, 13 information fields, five content trials, 12 unique randomized comparisons, all four structures at 5/10/15 nodes, the answer CSV schema, stable event IDs, protected aggregate export, D1 write statements, static fallback, and migration tables.

## Known limitations

1. Formal audio and verified metadata provenance are absent.
2. The audio timer starts from a button, not verified playback state.
3. The Xiaoyuzhou task is self-reported and cannot be observed by the website.
4. Task 2 helpfulness is subjective and does not establish comprehension accuracy.
5. Task 3 order is reproducibly shuffled but not assigned through an approved Latin-square service.
6. Local state resets rather than migrates when the study version changes.
7. The Worker uses a shared researcher export token; token rotation and researcher access procedures remain operational responsibilities.
8. D1 migrations affect stored data independently of source-version rollback and must be reviewed before deployment.
9. Browser visual, keyboard, screen-reader, multi-account, reload, and interrupted-network pilot testing is still required.

## Sites deployment boundary

The project contains the Worker, D1 binding, migration, dual persistence, and aggregate export path required for formal collection. Before deployment, the Site owner must set `RESEARCHER_EXPORT_TOKEN` as a hosted secret, review the consent and retention policy, verify the saved version, and explicitly approve production deployment. Saving a version does not publish it.
