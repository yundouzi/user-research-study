# Technical Context

## Evidence and scope

This document describes the files and implementation currently accessible in this workspace. It does not claim access to production infrastructure, private datasets, or participant databases. No credentials or participant data are included.

## Project layout

```text
播客-用户研究/
├─ index.html                 # Static document shell
├─ styles.css                 # Responsive visual system and four structures
├─ app.js                     # Study data, state, rendering, logging, export
├─ study-materials.js         # Non-secret formal audio path configuration
├─ config.example.js          # Example local researcher-view configuration
├─ README.md
├─ RESEARCH_CONTEXT.md
├─ TECHNICAL_CONTEXT.md
├─ DECISIONS_AND_NEXT_STEPS.md
└─ assets/
   ├─ beneath-overview.png
   ├─ beneath-detail.png
   └─ beneath-legacy-cn.html
```

The previous single-file prototype was split into HTML, CSS, and JavaScript so the revised study can be maintained without a build system.

## Architecture and dependencies

- Vanilla HTML, CSS, and JavaScript.
- No npm package, bundler, framework, or compilation step.
- `app.js` renders the current stage into one `<main>` element.
- Participant state is serialized to browser `localStorage` under a versioned key.
- Event records include the study step at event time, avoiding the earlier CSV module-label bug.
- CSV and JSON are created in the browser with `Blob` and downloaded locally.
- Formal audio paths are configured in `study-materials.js` and are intentionally separate from researcher access configuration.
- Local researcher access configuration is loaded only when the researcher button is used.

Browser features used include `localStorage`, `<dialog>`, HTML drag-and-drop, CSS Grid, `color-mix()`, Blob downloads, and optional HTML audio playback. A current Chromium, Edge, Firefox, or Safari release is recommended.

## Implemented participant flow

1. Research information and consent.
2. Structured participant-information form covering the eight requested background areas.
3. Seven-question needs survey with a three-choice maximum on the first item.
4. Thirteen-item ranking using drag-and-drop or arrow buttons.
5. Progressive disclosure of up to three fields and episode selection.
6. Content clarity (0–10) and choice confidence (1–7), followed by an oral interview prompt.
7. Real Xiaoyuzhou scenario with structured episode selection, ease rating, duration, and an oral process prompt.
8. Five within-episode trials with three-minute timers, optional formal audio, feature toggles, speed/depth ratings, and oral prompts.
9. Twelve phone-ratio layout conditions covering four structures and 5/10/15 episodes.
10. Understanding and visual-comfort ratings for each condition, plus oral prompts.
11. Four oral structure-interview prompts and a completion button; no open-text responses.
12. Completion screen with CSV/JSON export.

Persistent back and restart controls remain visible. The researcher console supports stage jumps, progress summaries, recent events, interruption marking, and export.

## Four structure renderers

- **List:** ordered podcast rows with episode, guest, title, and theme.
- **Network:** positioned episode cards connected with CSS lines; strong lines connect episodes in the same topic group.
- **Tree:** channel root, theme branches, and episode leaves.
- **Category clusters:** six colored topic regions containing episode cards.

All structures use the same episode subset for a given count. The layout is observational: nodes cannot be dragged or zoomed during Task 3.

## Local setup

Open `index.html` directly, or serve the folder over HTTP:

```powershell
cd "C:\path\to\播客-用户研究"
python -m http.server 8000
```

Then open `http://127.0.0.1:8000/`.

No install or build command is required.

## Audio-material setup

The project does not include formal research audio. To add it:

1. Place five licensed audio files in a local folder such as `assets/audio/`.
2. Edit the five entries in `study-materials.js` in trial order.
3. Verify duration, loudness, start points, permission, and cross-browser playback.

When an entry is empty, the corresponding trial shows a demonstration waveform and still permits timer and questionnaire testing. This mode must not be mistaken for a valid formal trial.

## Researcher-view setup

Copy `config.example.js` to `config.js` and set a local convenience code. `config.js` is Git-ignored. The browser loads it only when researcher access is requested.

This is a convenience gate, not authentication. Any value used by client-side JavaScript can be inspected by the browser user.

## State and event model

State contains:

- study version and participant ID;
- current stage and entry timestamp;
- answers by module;
- structured participant-profile responses;
- information ranking and selected fields;
- selected episode;
- content-trial index, start times, and feature-open state;
- structure-trial index and deterministically shuffled condition order;
- chronological event records.

Participant-facing pages contain no `<textarea>` elements. Subjective explanations are intentionally delegated to moderator-led interview prompts and are not included in the local answer export.

Each event stores event type, target, payload, step, ISO timestamp, and epoch time.

## Verification status

Confirmed during the current implementation pass:

- `app.js` passes a JavaScript syntax check.
- All requested stages and condition counts are present in the source.
- The site remains dependency-free and file-based.

Still required before formal use:

- full browser walkthrough across every branch;
- phone and desktop visual inspection at common viewport sizes;
- actual audio playback checks;
- CSV/JSON schema inspection with completed test data;
- accessibility testing with keyboard and screen reader;
- counterbalancing and analysis review.

## Known limitations and risks

1. No backend, multi-user isolation, autosave API, or protected database.
2. No genuine researcher authentication.
3. No objective comprehension questions or accuracy score; current feature outcomes are perceived help.
4. Audio timer starts from a button press, not from verified playback state.
5. Formal audio files, licenses, and validated timestamps are absent.
6. Embedded episode metadata includes demonstration values whose provenance is not encoded.
7. The Xiaoyuzhou task is self-reported; the website cannot observe the external app.
8. Condition order is deterministically shuffled but not based on an approved Latin-square or randomized assignment service.
9. All data remains on one browser until manually exported.
10. Local state has no migration beyond resetting when the study version changes.
11. The large legacy Chinese visualization file remains in the repository but is not used by the revised flow.
12. No automated test suite or continuous integration exists.

## Cloud migration boundary

A research-ready cloud system should move participant/session creation, condition assignment, answer storage, researcher authorization, material versioning, and audit/export functions to a server. Static assets can remain client-side, but access control and participant data must not rely on browser code or `localStorage`.
