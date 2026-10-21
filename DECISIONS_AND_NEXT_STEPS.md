# Decisions and Next Steps

## Evidence and scope

This handoff is derived only from the current conversation, the current workspace files, and the accessible V3.0 research protocol. It does not summarize any inaccessible conversation or external project history.

No credentials or participant records are included.

## Confirmed decisions

### Research flow

- The website is participant-facing; participants complete the forms. Host-only answer/notes fields were removed from participant pages.
- The top-left “Back” and “Restart” controls remain visible throughout the workflow.
- Task 1 contains four trials rather than the original five.
- Task 1 consists of two unassisted and two visualization-assisted trials.
- Segment retrieval is constrained to one episode, S9E3, because searching across several episodes was judged too difficult.
- Participants type the answer and submit it. The host does not provide content hints.
- Task 1 uses a three-minute limit and a ten-second overtime/grace period before automatic advancement.
- Assisted Task 1 opens the Beneath the Conversation site rather than rebuilding the full visualization inside the study page.
- A local Chinese historical visualization is offered as a fallback; it is not presented as an exact translation of the current hosted English interface.
- Task 1 feature ratings use screenshots so participants can identify the feature being rated.

### Task 2-A structure design

- The four structures are a list, free network, topic clusters, and hierarchy tree.
- Structure should be expressed through the arrangement and relationships among content items. Nodes do not need to be circles; outlined cards are preferred for readability.
- The list resembles a podcast recommendation list and shows meaningful episode information.
- The network’s lines represent theme-profile similarity; stronger visual lines indicate higher similarity.
- Highly related episodes should be placed in nearby thematic centers to shorten edges and reduce crossings.
- Topic clusters should visibly group episodes rather than merely distribute them over the canvas.
- The hierarchy should visibly express root → theme → episode relationships.
- Repeated permanent side panels were rejected. Rich details are shown in a hover tooltip where appropriate.
- Desktop node text was increased so secondary text is not smaller than the compact episode-ID label.

### Task 2-B phone conditions

- The condition counts are 5, 10, and 15, not 10, 20, and 40.
- Every condition is composed specifically for an iPhone 17 portrait-ratio frame.
- The phone visualization cannot require internal scrolling, zooming, or dragging.
- The four structures retain their distinct structural grammar while using readable outlined cards.
- The minimum phone text size in the current design pass is 9 px.

### Task 2-C

- Initial rows show only episode ID and title.
- Additional fields appear globally only after the participant chooses them.
- At most three fields may be shown simultaneously.
- Information importance is ranked by drag-and-drop.
- Actual episode choice occurs before confidence/helpful-field questions and before importance ranking.

### Data and operation

- The current prototype saves locally and offers CSV/JSON export.
- Participant and researcher views are separate at the interface level.
- The interview stage is timed but not recorded or transcribed by the website.

## Rejected or superseded alternatives

| Alternative | Status and reason |
| --- | --- |
| Five Task 1 trials | Superseded by four trials to simplify the study and reduce burden. |
| Searching for a segment across S9E1/S9E2/S9E3 | Rejected as too difficult; segment tasks now stay within S9E3. |
| Rebuilding the full visualization inside Task 1 | Rejected for the current prototype; use the external site plus a local historical Chinese fallback. |
| Host/participant shared notes field | Removed because the site is completed by participants. |
| Permanent right-side detail panel for every structure | Rejected as repetitive and cumbersome; use direct labels plus contextual hover detail. |
| Unstructured scattering presented as a “network” | Rejected; network layout must express actual similarity relations. |
| Topic clusters with no visible categorization | Rejected; categories and membership must be visually explicit. |
| Mandatory circular nodes | Rejected; card outlines can carry the same structural role with better legibility. |
| Task 2-B counts of 10/20/40 | Superseded by 5/10/15 because the denser phone layouts forced unreadably small text. |
| Shrinking type to fit more phone nodes | Rejected; item count and layout were changed instead. |
| Scrollable/zoomable/draggable Task 2-B phone canvas | Rejected because the condition must be observed as one complete composition. |
| Showing all Task 2-C metadata initially | Rejected; initial state is title-only so information reveal is an observable choice. |
| Arrow buttons for ranking | Superseded by direct drag-and-drop ordering. |

## Current progress

### Completed

- A runnable, single-file end-to-end prototype covers consent through completion.
- The current local project includes the main HTML, two Task 1 screenshots, and the local Chinese visualization fallback.
- Background survey options include separate weekly/every-two-weeks responses and YouTube.
- Task 1 assistance, answer fields, timing, feedback, and screenshots are implemented.
- Task 2-A has all four structures, fixed readable card layouts, rich hover details, and shortened network edges.
- Task 2-B has all twelve 5/10/15 phone conditions.
- Task 2-C selection, field reveal, feedback, and drag ranking are implemented.
- Researcher navigation, local logs, interruption marking, back/restart, and export are implemented.
- Recent QA found no tested browser console errors and no card overlaps in the final desktop structures or tested high-density phone network/cluster views.
- The last completed application version was copied to the previously specified transfer folder.

### Not completed

- No cloud deployment or backend exists.
- No protected database, authenticated researcher account, or server-side answer key exists.
- No experimental assignment/counterbalancing engine exists.
- No automated correctness scoring exists.
- No formal test suite, CI pipeline, or deployment configuration exists.
- A local Git repository, GitHub-oriented ignore rules, an example-only researcher configuration, and repository documentation have been prepared. A valid GitHub remote and user approval are still required before any push.
- The older protocol has not been revised to reflect the 5/10/15 Task 2-B decision.

## Assumptions to verify

- The latest implemented interface is the intended source of truth when it conflicts with V3.0.
- The 20 desktop episodes and first 15 phone episodes are approved study materials.
- Play counts, comment counts, dates, summaries, and theme profiles are either verified real values or will be explicitly labeled as simulated.
- The manually embedded theme-profile similarity is acceptable for the study’s “related episode” task.
- A static front end plus a small API/database is preferable to adopting a larger application framework.
- The cloud workflow should preserve an offline/local demo mode for design review.

## Unresolved questions

### Research and materials

1. Which exact episodes and subsets are approved for each module?
2. Which metadata fields have authoritative sources and which are simulated?
3. What are the verified Task 1 answer keys and exact segment timestamps?
4. Are the Task 2-A target answers unique after manual content review?
5. Should Task 2-A be counterbalanced as originally intended, or remain a fixed guided prototype?
6. Should Task 2-B remain 5/10/15 in the formal protocol and analysis plan?
7. What participant eligibility, prior-familiarity, exclusion, and missing-data rules will be used?
8. How will qualitative observations and interview notes be linked without using identifying information?

### Ethics and operations

1. What are the approved consent text, retention period, deletion process, and researcher contact details?
2. Where will phone screen recordings be stored, who can access them, and how are they linked to study IDs?
3. Which organization or account owns the cloud environment and research data?
4. What export, audit, backup, and breach-response requirements apply?

### Technical platform

1. Which cloud host, database, and authentication provider should be used?
2. Is deployment required only for the study team or publicly accessible participants?
3. Is offline resilience required at the study location?
4. Should episode content be managed through files, an admin interface, or an external research-data pipeline?
5. How should existing historical data and future semantic-analysis outputs be versioned?

## Prioritized next steps

### P0 — establish a safe cloud foundation

1. **Reconcile the protocol and implementation.** Publish a new protocol version that confirms 5/10/15, current Task 1 items, timing behavior, and the intended counterbalancing strategy.
2. **Put the project under version control.** Add the current files, create a baseline commit/tag, and define a branching and release convention before refactoring.
3. **Classify and version the research materials.** Move episode metadata, prompts, theme profiles, relations, and answer keys into separate versioned data files. Add source and verification fields.
4. **Define the privacy/security architecture.** Finalize consent, retention, deletion, recording storage, access roles, and an approved data-flow diagram before collecting participant data.
5. **Create server-side sessions and storage.** Store participant/session/trial/event records in a protected database with autosave, idempotency, and recovery.
6. **Implement real researcher authentication and server-side answer handling.** The committed hardcoded access value has been removed, but the local client-side gate remains only a prototype convenience and must not protect research data.

### P1 — restore experimental validity

7. **Implement condition assignment.** Add reproducible, logged counterbalancing for Task 2-A and Task 2-B, including material-set and sequence identifiers.
8. **Add correctness and verification rules.** Keep correct answers on the server and support one or multiple accepted answers where content review requires it.
9. **Fix and version the event schema.** Store module, trial, condition, sequence index, target, and schema version with each event at event time. Correct the CSV module-label issue.
10. **Add missing measures selectively.** If required by the final analysis plan, log hover count, unique nodes inspected, field-combination duration, and scroll extent without collecting unrelated data.
11. **Add state recovery.** Support reconnect/resume and prevent data from different participants being mixed on shared devices.

### P2 — engineering quality and deployment

12. **Split the single HTML file.** Separate styles, application code, data/configuration, and test fixtures while preserving the current visual behavior.
13. **Add automated tests.** Cover timers, timeout/grace behavior, back/restart, condition coverage, field limits, rankings, export, responsiveness, and accessibility.
14. **Create CI and deployment environments.** Maintain separate demo, pilot, and production configurations with no production data in previews.
15. **Run accessibility and cross-browser checks.** Include keyboard-only ranking alternatives, focus states, tooltip access, color contrast, and the supported phone/desktop matrix.
16. **Optimize large assets.** Decide whether the local 19.5 MB legacy visualization should be compressed, separately hosted, or replaced.

### P3 — pilot and research readiness

17. **Run a 2–3 person pilot.** Validate task difficulty, actual duration, recording instructions, field comprehension, and phone readability.
18. **Freeze materials and analysis rules.** Assign a version to every task, episode set, relation set, screenshot, and consent form used in data collection.
19. **Conduct a dry run of the full data lifecycle.** Create a test participant, interrupt and resume, export, verify server records, delete the record, and confirm audit/backup behavior.
20. **Only then begin formal recruitment and data collection.**
