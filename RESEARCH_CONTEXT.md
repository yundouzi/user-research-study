# Research Context

## Evidence and status

This document describes the study implemented from the current project files and the supplied workbook `Podcasts_Indicators_v2.xlsx`. It does not claim access to other conversations, private datasets, or participant records.

## Research objective

The study examines how listeners choose, understand, revisit, and compare podcast content, and which information and visual structures best support those activities.

The research is organized around three levels:

1. discover listener needs and information gaps;
2. validate the value of episode-level and within-episode information;
3. compare ways of organizing multiple episodes.

## Pre-interview form

Before the tasks, the website records:

- automatically generated participant ID;
- gender and age;
- podcast listening frequency;
- commonly used platforms;
- up to three frequently heard podcast types;
- up to three listening scenarios;
- podcast-creation experience;
- familiarity with 《岩中花述》.

No name or contact details are requested. Subjective explanations are marked **（访谈）** and handled orally.

## Task 1 — Listener needs

Eight structured items record:

1. preference for subscribed new episodes, previously heard episodes, or interesting new content;
2. starting point for new-content discovery, including AI recommendation;
3. the information most wanted before choosing an unfamiliar episode;
4. how much information is needed before listening;
5. time needed to decide whether to continue or exit;
6. behavior when an episode does not meet expectations;
7. frequency of trying to re-find a statement or viewpoint;
8. up to two choices for continued listening after a satisfying episode.

## Task 2 — Information value

### T2-E01: direct ranking

Participants rank 13 information types: title, host, duration, topic tags, summary, comment overview, play count, similar podcasts, transcript, topic timeline, timestamped comments, sentiment analysis, and audio-analysis features.

### T2-E02: progressive disclosure

Participants reveal up to three information types and choose one episode. The site records the chosen fields, their interaction sequence, the selected episode, and duration. Reasons are discussed orally.

### T2-C01 to T2-C05: within-episode assistance

Five three-minute trial shells cover transcript, topic timeline, timestamped comments, sentiment analysis, and audio-analysis features. Each feature receives one perceived-helpfulness rating from 1 (no help) to 7 (very helpful). The site also records whether the feature was opened, elapsed time, and whether formal audio was configured.

The repository contains demonstration panels but no licensed research audio.

## Task 3 — Pairwise structure comparison

Participants complete 12 fixed A/B comparisons covering list, network, tree, and category structures at 5, 10, and 15 episodes. Question IDs remain stable. The question order is shuffled reproducibly, while two participant layout arms reverse the displayed left/right position for every fixed question.

For each pair, participants first select which interface looks more visually comfortable, then select which is easier for understanding content and information organization. The site records both choices separately, the canonical pair, the actual displayed A/B pair, layout arm, swap status, duration, and whether the two choices agree.

This pairwise design replaces the earlier plan to give two Likert ratings to each of 12 standalone conditions.

## Task 4 — Oral interview and real-app task

The moderator asks participants to discuss the four structures. No interview text is entered into the participant website.

Participants then open Xiaoyuzhou and find a Lu Yu-hosted episode in 《岩中花述》 that relates to career development and interests them. The website records the selected episode and task duration; the search path is described orally.

## Variables and measures

| Category | Variables / measures |
| --- | --- |
| Profile | ID, gender, age, frequency, platforms, podcast types, listening scenarios, creation experience, familiarity |
| Listener needs | Listening preference, discovery start, wanted information, pre-listening information need, decision time, mismatch action, revisit frequency, continued-listening choices |
| Information ranking | Full order of 13 fields, interaction changes, duration |
| Progressive disclosure | Revealed fields, reveal sequence, selected episode, duration |
| Within-episode assistance | Feature, perceived helpfulness 1–7, feature opened, elapsed time, audio status |
| Structure comparison | Pair ID, A/B structures and counts, visual choice, understanding choice, agreement, duration |
| Real-platform task | Selected episode, duration, moderator-observed search process |
| Operational | Study version, timestamps, page transitions, back/restart use, exports, interruption marker |

## Confirmed decisions

- The supplied workbook supersedes the previous seven-question Task 1 and standalone-condition Task 3 implementation.
- Open-ended subjective answers are oral interview prompts, not text inputs.
- Task 3 uses the 12 pairings listed in the workbook and randomizes question order.
- Visual comfort is asked before understanding in each Task 3 comparison.
- The workbook contains a duplicate `T1-03` identifier. The export preserves the first as `T1-03` and labels the decision-time item `T1-03-duration`, with the source ID noted in metadata.

## Assumptions and unresolved questions

- Episode metadata in the interface remains demonstration material until provenance is verified.
- The five audio trials need licensed, difficulty-matched materials.
- Feature order is currently fixed; a counterbalancing decision is unresolved.
- The helpfulness scale measures perceived help, not objective comprehension accuracy.
- Participant eligibility, sample size, exclusion rules, interview coding, and formal analysis remain unresolved.
- Consent, recording, retention, deletion, and secure cloud storage policies must be finalized before formal collection.
