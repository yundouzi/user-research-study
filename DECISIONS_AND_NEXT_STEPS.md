# Decisions and Next Steps

## Evidence and scope

This handoff reflects the revised study described in the current conversation and the current workspace files as of 2026-11-01. It does not summarize inaccessible conversations or external project history.

## Confirmed current decisions

### Research design

- The revised study follows three levels: discover needs, validate information value, and determine presentation form.
- A structured participant-information form appears after consent and before all tasks.
- It collects the generated participant ID, gender, age, listening frequency, platforms, podcast types, discovery channels, creation experience, and “岩中花述” familiarity.
- Open-ended subjective answers are not typed into the site; they are labeled “（访谈）” and handled orally.
- The earlier retrieval-focused flow is superseded in the current interface.
- Level 1 contains seven participant questions about discovery, uncertainty, abandonment, revisit, and information needs.
- The first Level 1 question permits up to three selections.
- Level 2 includes both direct ranking and progressive disclosure because they measure stated and revealed information preferences differently.
- Thirteen information types are included in ranking.
- Progressive disclosure permits up to three information types before episode selection.
- Participants rate content clarity from 0–10 and selection confidence from 1–7.
- A real Xiaoyuzhou phone task asks participants to find an interesting career-related “岩中花述” episode and describe their process.
- Five within-episode trials cover transcript, topic timeline, timestamped comments, sentiment analysis, and audio-analysis features.
- Within-episode help is rated separately for speed and depth on 1–7 scales.
- Task 3 compares list, network, tree, and category layouts at 5, 10, and 15 episodes.
- Each of the twelve Task 3 conditions receives understanding and visual-comfort ratings.
- A final interview asks participants to compare the four structures.

### Interaction and operation

- Back and restart controls remain visible throughout the participant flow.
- Ranking supports both drag-and-drop and arrow buttons.
- Structure conditions are stored in a reproducible participant-specific order.
- Formal audio files are not fabricated; the prototype exposes an explicit materials configuration and demonstration mode.
- Participant progress and events remain local until CSV/JSON export.
- CSV/JSON exports contain structured task responses but not moderator interview notes.
- The researcher view remains a local prototype tool and is not treated as secure authentication.

## Superseded decisions

The following decisions belong to the previous prototype and are no longer part of the current participant flow:

- four assisted/unassisted retrieval trials;
- the Beneath the Conversation site as a Task 1 condition;
- separate Task 2-A retrieval tasks using the four structures;
- structure evaluation as “ease of understanding” and “crowding” only;
- the earlier title-only Task 2-C flow with a seven-field ranking;
- the previous sequence of Task 1 feedback, Task 2-A, Task 2-B, and Task 2-C.

The related assets remain in the repository for provenance and may be removed later if no longer needed.

## Current progress

### Completed in the revised prototype

- New three-level participant flow.
- Pre-task participant-information form and validation.
- Removal of participant-facing open-text fields; subjective prompts are marked for interview.
- All seven Level 1 questions and validation.
- Thirteen-item information ranking.
- Progressive disclosure, episode choice, clarity/confidence ratings, and explanation.
- Real-app task instructions, process capture, ease rating, and timing.
- Five three-minute within-episode trial shells with feature-specific panels.
- Audio-source configuration file and visible demonstration mode.
- Twelve structure conditions using four distinct layouts and three counts.
- Participant-specific stored condition order.
- Two ratings per structure condition and final qualitative interview.
- Versioned local state, event logging, CSV/JSON export, stage navigation, and researcher console.
- Separation of HTML, CSS, JavaScript, and non-secret study-material configuration.

### Not completed

- Formal audio selection, editing, licensing, loudness matching, and integration.
- Objective comprehension questions or accuracy measures.
- Approved randomization/counterbalancing strategy.
- Verified metadata provenance and material equivalence review.
- Browser-based end-to-end visual QA for every condition.
- Pilot study with representative users.
- Backend, secure researcher accounts, database, or cloud deployment.
- Formal ethics, consent, retention, and deletion documentation.
- Statistical analysis plan and sample-size justification.

## Prioritized next steps

1. **Finalize the five audio trials.** Select licensed segments, define start/end points, normalize loudness, and populate `study-materials.js`.
2. **Decide the experimental comparison.** Confirm whether five different audio segments are acceptable or whether feature conditions require matched content/control variants.
3. **Add objective outcomes if needed.** If the claim concerns improved understanding, add comprehension questions and accuracy scoring rather than relying only on perceived help.
4. **Verify research materials.** Label every episode field as sourced, derived, or simulated and record a material version.
5. **Approve condition order.** Replace deterministic shuffle with the intended Latin square or assignment plan if required.
6. **Run a complete pilot.** Test all 12 structure conditions, the five timers, back/restart behavior, data export, phone legibility, and total study duration.
7. **Refine the protocol.** Define eligibility, prior familiarity, exclusions, missing data, timeouts, moderator behavior, and interview coding.
8. **Prepare formal data handling.** Add consent text, retention/deletion rules, recording policy, secure storage, and access roles.
9. **Build the cloud data layer.** Use server-side sessions, authenticated researcher access, material/condition versioning, and protected exports.
10. **Add automated checks.** Cover validation, condition completeness, timer behavior, state migration, and export schema.

## Assumptions requiring confirmation

- The new scheme fully replaces the prior retrieval experiment rather than becoming an additional branch.
- The 13 information types should all appear in the direct ranking task.
- A maximum of three revealed fields remains appropriate.
- The Task 3 layout should remain a phone-ratio presentation.
- A 1–7 rating scale is intended wherever the new outline says “1–7.”
- Participants have Xiaoyuzhou installed or can access it during the moderated session.
- Think-aloud observations will be captured by the moderator outside the website.

## Unresolved questions

1. What are the exact five audio files and their legal/ethical use status?
2. Are the five audio segments matched for difficulty and topic familiarity?
3. Should each feature be compared with a no-feature control?
4. Should audio and feature order be randomized or counterbalanced?
5. Does “content understanding” in Task 3 need an objective retrieval question as well as a rating?
6. Which episode metadata are authoritative, and which are demonstration values?
7. What is the final participant population and target sample size?
8. What is the planned quantitative and qualitative analysis?
9. Will screen/audio recording occur, and how will it be stored and deleted?
10. Should the obsolete Beneath the Conversation assets be retained in the Git repository?
