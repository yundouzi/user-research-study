# Decisions and Next Steps

## Confirmed current decisions

- `Podcasts_Indicators_v2.xlsx` is the current question and measurement source.
- Participant-facing open-ended text fields are excluded. Subjective prompts are marked “（访谈）”.
- The pre-interview form collects podcast types and listening scenarios with a maximum of three selections each.
- Task 1 contains eight structured items; continued-listening behavior allows two selections.
- Task 2-A and Task 2-B use the same nine stable information field IDs. Task 2-B keeps the three-field reveal limit, uses sourced episode metadata and completes when the participant selects an episode, without a separate confirmation step. Comment overviews remain intentionally empty until research data is supplied.
- Each of the five within-episode features receives one 1–7 helpfulness rating.
- Task 3 uses 12 A/B comparisons rather than 12 standalone Likert evaluations.
- Each comparison asks visual comfort first and understanding second.
- Task 3 question order is shuffled reproducibly for each participant.
- Task 3 question IDs and canonical pairs remain fixed; two anonymous layout arms reverse A/B positions and the actual displayed pair is recorded.
- Task 4 contains the oral structure interview and the final Xiaoyuzhou search task.
- Answer CSV and event CSV are separate exports; JSON retains the complete local record.
- The duplicate source identifier `T1-03` is disambiguated as `T1-03-duration` for the decision-time item.
- The existing application is adapted rather than recreated for ChatGPT Sites.
- Browser storage remains a local fallback; formal Sites collection uses D1 through a same-origin Worker API.
- Aggregate answer and event CSV exports require a server-side researcher token.
- Participant writes require a separate 256-bit anonymous session token; only its hash is stored server-side.
- Sync uses optimistic revisions, persistent idempotency keys, bounded event batches, and retry backoff.
- The first Sites milestone is a saved, undeployed version. No production URL should be created without later explicit approval.

## Superseded alternatives

- The seven-question Task 1 beginning with “打开播客平台的目的”.
- Content clarity and choice-confidence ratings after progressive disclosure.
- Separate speed-help and depth-help ratings for each within-episode feature.
- Two Likert scales for every standalone Task 3 condition.
- Placing the Xiaoyuzhou scenario before the within-episode and structure tasks.
- The earlier assisted/unassisted retrieval experiment and Beneath the Conversation condition.
- Relying only on `localStorage` and manual per-participant export for formal cloud collection.
- Publishing immediately to obtain a review URL; every Sites deployment URL is production.

## Current progress

- The participant form and Task 1 match the supplied workbook options and selection limits.
- Task 2 ranking, progressive disclosure, five helpfulness trials, timers, and interaction logs are implemented.
- All 12 Task 3 pairings are implemented with side-by-side phone views, randomized order, and counterbalanced A/B positions.
- Task 4 interview and Xiaoyuzhou task are placed at the end.
- Analysis-ready answer CSV, event CSV, and JSON exports are implemented.
- The broken Chinese text in the HTML shell has been corrected.
- Sites hosting metadata, two D1 migrations, authenticated Worker persistence, stable event/request IDs, revision conflict protection, and aggregate CSV exports are implemented.
- A Task 3 aggregate export separates visual-comfort and understanding choices and includes the canonical and actually displayed design combinations.
- The original participant flow and local per-participant exports remain available.
- Automated client and Worker checks are available.

## Prioritized next steps

1. Select, license, edit, and loudness-match the five formal audio segments.
2. Verify every episode title, guest, play count, topic, and auxiliary field against an authoritative source.
3. Decide whether feature order needs counterbalancing and whether a no-feature control is required.
4. Pilot the complete flow with representative participants and check total duration.
5. Inspect the two-phone comparison pages at the actual study display size.
6. In a private Sites version, test keyboard operation, screen-reader labels, back/restart behavior, completed exports, session registration, reload recovery, duplicate retry, and interrupted-network recovery.
7. Finalize participant eligibility, exclusion rules, sample size, missing-data handling, and analysis plan.
8. Finalize consent, recording, retention, deletion, and interview-coding procedures.
9. Set and securely retain the Sites `RESEARCHER_EXPORT_TOKEN`, then test authorization and aggregate exports on a private deployment candidate.
10. Review the saved Sites version and database migration before explicitly approving any production deployment.

## Unresolved questions

- Should the workbook’s duplicate `T1-03` be formally renumbered in the source file?
- Should “其他” responses remain oral-only, or should a moderator have a separate coding form?
- Are the five audio features tested on five different clips or matched variants of the same content?
- Is perceived helpfulness sufficient, or is an objective comprehension measure required?
- Is probabilistic 1:1 layout-arm assignment sufficient, or does the final protocol require exact block allocation?
- Which participant and episode metadata may be retained, and for how long?
- Which researchers may receive the shared export token, and what is the rotation procedure?
- Should the first production Site remain owner-only, use a named allowlist, or later become public for participant recruitment?
