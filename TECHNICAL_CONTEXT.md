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
- `migrations/0002_anonymous_sessions_and_revisions.sql`: hashed anonymous sessions, optimistic revisions, and idempotency keys.
- `.env.example`: required runtime key name without a credential value.
- `tests/smoke.test.js`: dependency-free rendering and client schema checks.
- `tests/worker.test.js`: dependency-free Worker route, authorization, persistence, and migration checks.

The site uses vanilla HTML, CSS, and JavaScript. It has no package manager, framework, compilation step, or third-party runtime dependency.

## Participant flow

The 12 stages are consent, profile, Task 1, information ranking, progressive disclosure, within-episode introduction, five within-episode trials, Task 3 introduction, 12 pairwise comparisons, oral structure interview, Xiaoyuzhou scenario, and completion/export.

State is stored under the versioned local key `yzhStudyV7State`. The 256-bit anonymous session token is stored separately under `yzhStudyV7AnonymousSession` and is never included in the study state or exports. Changing the study version resets incompatible older local state.

## Data model and persistence

State includes participant ID, current step, entry time, structured answers, information ranking, selected reveal fields, content-trial timers, feature-open state, balanced and shuffled structure comparisons, chronological events, stable event IDs, and sync metadata.

The browser remains the first-write fallback. On HTTP(S), the client first registers a high-entropy anonymous session at `/api/study/session`. The Worker stores only the token hash and binds it to one participant ID. Sync requests use a persistent idempotency key and optimistic `baseRevision`; stale requests receive HTTP 409 and cannot overwrite newer state. Failed requests retain the exact pending payload and retry with backoff. A `pagehide` keepalive request reuses that payload.

Only unsynced events (maximum 500 per request) are uploaded, while the participant snapshot retains only the latest 100 events. The normalized `events` table remains the complete server log. Event IDs and sync request IDs make retries safe.

The D1 tables are:

- `participants`: versioned full snapshot, current stage, and timestamps.
- `answers`: one normalized row per participant/question/measure.
- `events`: append-only interaction events with stable sequence IDs.
- `anonymous_sessions`: participant/session binding, layout arm, token hash, and timestamps; raw tokens are not stored.

The answer CSV uses the columns:

`participant_id, study_version, question_id, stage, measure, response, duration_ms, metadata`

Multi-select values are separated by semicolons. Pair metadata and feature metadata are JSON strings in the `metadata` column. Task 3 also has a dedicated aggregate CSV with separate visual-comfort and understanding columns plus canonical and actually displayed combinations. A separate event CSV retains detailed interaction logs. JSON export retains the local study state but not the anonymous session token.

## Four structure renderers

- **List:** ordered episode rows.
- **Network:** positioned cards and theme-similarity edges.
- **Tree:** channel root, topic branches, and episode leaves.
- **Category:** topic regions containing episode cards.

Each Task 3 page renders two phone-ratio interfaces side by side and asks for A/B choices. The 12 IDs and canonical pairs are fixed. Layout arm 0 and layout arm 1 place each question's two designs on opposite sides; question order remains reproducibly shuffled.

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

Automated smoke checks cover stage rendering, absence of open-ended text areas, the nine-field Task 2-A ranking, participant-specific initial order, drag/click placement operations, local refresh recovery, per-field CSV ranks, the 13-option Task 2-B field map, five content trials, 12 stable comparisons, opposite A/B layout arms, actual-combination metadata, high-entropy participant IDs, token exclusion, all four structures at 5/10/15 nodes, and answer schema. Worker checks cover anonymous authorization, unauthorized overwrite rejection, idempotent retries, stale-write rejection, explicit Task 3 export, static fallback, and both migrations.

## Known limitations

1. Formal audio and verified metadata provenance are absent.
2. The audio timer starts from a button, not verified playback state.
3. The Xiaoyuzhou task is self-reported and cannot be observed by the website.
4. Task 2 helpfulness is subjective and does not establish comprehension accuracy.
5. Task 3 uses two deterministic layout arms derived from a cryptographically random session token. This balances left/right position probabilistically; exact equal group sizes still depend on recruitment count.
6. Local state resets rather than migrates when the study version changes.
7. The Worker uses a shared researcher export token; token rotation and researcher access procedures remain operational responsibilities.
8. D1 migrations affect stored data independently of source-version rollback and must be reviewed before deployment.
9. Browser visual, keyboard, screen-reader, multi-account, reload, and interrupted-network pilot testing is still required in a real private Sites environment.

## Sites deployment boundary

The project contains the Worker, D1 binding, migration, dual persistence, and aggregate export path required for formal collection. Before deployment, the Site owner must set `RESEARCHER_EXPORT_TOKEN` as a hosted secret, review the consent and retention policy, verify the saved version, and explicitly approve production deployment. Saving a version does not publish it.
