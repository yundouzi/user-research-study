# Research Context

## Evidence and status

This document describes the revised study specified in the current project conversation and implemented in the accessible project files on 2026-11-01. It does not claim access to other conversations, external datasets, private repositories, or participant records.

The revised three-level design below supersedes the earlier retrieval-focused Task 1 / Task 2-A / Task 2-B / Task 2-C flow. The old implementation remains available through Git history, not through the current participant flow.

## Research objective

The study investigates how podcast listeners discover, understand, evaluate, and revisit podcast content, and how episode information should be selected and organized to support those activities.

The project is organized around three questions:

1. **What are users trying to accomplish, and where do existing podcast platforms leave information gaps?**
2. **Which information types materially help users understand an unfamiliar episode or make a listening decision?**
3. **How should multiple podcast episodes be organized visually at different information densities?**

## Pre-task participant form

Before any task, the website records an automatically generated participant ID and structured responses for gender, age, podcast listening frequency, commonly used platforms, frequently heard podcast types, podcast discovery channels, podcast-creation experience, and familiarity with “岩中花述.” No name or contact information is requested.

Open-ended explanations are not typed into the participant website. Questions that require reasons, descriptions, or personal interpretations are marked **（访谈）** and are asked orally by the moderator.

## Three-level methodology

### Level 1 — Discover needs

Participants answer seven questions about:

- their most common reasons for opening a podcast platform (up to three);
- where they begin when looking for new content;
- their greatest uncertainty when considering an unfamiliar episode;
- what they do after 10–15 minutes when an episode does not meet expectations;
- how often they want to re-find a sentence or discussion;
- what they listen to after completing an episode;
- how much information they need before listening.

These items capture retrieval intent, information gaps, listening context, abandonment behavior, and revisit needs.

### Level 2 — Validate information value

Level 2 contains four complementary tasks.

#### Task 2-A: direct information ranking

Participants rank 13 episode-level information types:

1. title;
2. host;
3. duration;
4. topic tags;
5. summary;
6. comment overview;
7. play count;
8. similar podcasts;
9. transcript;
10. topic segmentation/timeline;
11. timestamped comments;
12. sentiment analysis;
13. audio-analysis features.

Ranking is supported by drag-and-drop and accessible up/down controls. The final full order is recorded.

#### Task 2-B: progressive disclosure and episode choice

Participants may reveal up to three information types across a set of unfamiliar episodes, then choose one episode to listen to. The interface records the field selection sequence and final episode choice.

After selection, participants report:

- content clarity from 0 (no idea what the episode will discuss) to 10 (completely clear);
- choice confidence from 1 to 7;
- a verbal interview prompt about which information influenced the decision; no text response is entered in the website.

This task tests revealed preferences and information combinations rather than only stated importance.

#### Task 2-C: real-app scenario and interview

Participants open the Xiaoyuzhou app on their own phone and find an episode in the “岩中花述” channel that is hosted by Lu Yu, relates to career development, and interests them personally.

They select the chosen episode from a structured list and rate task ease from 1 to 7. Their search path is discussed orally as a marked interview prompt. Page duration is recorded. The website itself does not control or record the external app.

#### Task 2-D: within-episode information assistance

Participants complete five trials. Each trial is designed around a three-minute audio segment and one information aid:

1. transcript;
2. topic segmentation/timeline;
3. timestamped comments;
4. sentiment analysis;
5. audio-analysis features.

For each trial, participants can open or close the information aid and rate its help on:

- speed of understanding (1–7);
- depth of understanding (1–7).

The site records whether the aid was opened, elapsed listening time up to three minutes, whether a formal audio source was configured, and the two ratings. A marked interview prompt asks how the participant used the aid; no text response is entered.

The current repository includes demonstration information panels but no licensed research audio. Formal audio files are an unresolved material dependency.

### Level 3 — Determine presentation form

Participants evaluate 12 conditions:

- four structures: list, network, tree, and category clusters;
- three episode counts: 5, 10, and 15.

Conditions are deterministically shuffled from the generated participant ID and stored in state, so order is reproducible for a participant.

Each condition is presented in a phone-ratio frame. Participants rate:

- how easily the layout supports understanding of episode content and relationships (1–7);
- visual comfort (1–7).

A marked interview prompt asks what the participant noticed first after each condition. The final oral interview asks which structure is fastest to understand, best for relationships, most scalable, and most visually comfortable. The website only records that the interview stage was completed.

## Study phases

1. Study information and consent.
2. Structured participant-information form.
3. Level 1 needs questionnaire.
4. Task 2-A information ranking.
5. Task 2-B progressive disclosure and episode choice.
6. Task 2-C real-app scenario.
7. Task 2-D instructions and five within-episode trials.
8. Level 3 instructions and twelve structure conditions.
9. Oral structure interview prompts.
10. Completion and local export.

## Variables and measures

| Category | Variables / measures |
| --- | --- |
| Participant profile | Participant ID, gender, age, listening frequency, platforms, podcast types, discovery channels, creation experience, show familiarity |
| Background needs | Platform goal selection, discovery start, uncertainty, mismatch response, revisit frequency, post-listening behavior, pre-listening information need |
| Stated information value | Full rank order of 13 information types; ranking changes and duration |
| Revealed information value | Selected fields and order, field combination, selected episode, clarity, confidence, duration |
| Real-platform behavior | Chosen episode, ease rating, task duration, moderator-observed think-aloud behavior outside the website |
| Within-episode assistance | Feature type, audio/material status, feature opened, elapsed time, speed-help rating, depth-help rating |
| Presentation structure | Structure type, episode count, condition order, understanding rating, comfort rating, duration |
| Oral interview topics | Search path, information-choice reasons, feature use, structure preferences and improvement suggestions; not entered in the participant website |
| Operational | Participant ID, study version, timestamps, page transitions, restart/back behavior, exports, interruption marker |

## Rationale

- Level 1 establishes actual needs before exposing participants to proposed features.
- Direct ranking captures explicit priorities, while progressive disclosure captures behavioral trade-offs.
- The real-app task grounds the study in an existing platform and reveals natural search strategies.
- Within-episode trials separate five assistance concepts and rate both speed and depth, which may not move together.
- The 4 × 3 structure design separates structural grammar from information density.
- Using the same two structure ratings across all 12 conditions enables within-participant comparison.
- Final interviews help explain why numerical ratings differ.

## Confirmed decisions

- The current participant flow uses the three-level framework described above.
- A structured participant-information form appears before every task.
- Subjective explanations are marked as oral interview prompts and have no participant text boxes.
- Level 1 contains seven needs questions; the first allows up to three choices.
- Episode-level information ranking includes all 13 specified information types.
- Progressive disclosure permits at most three additional information types.
- The real-app task is completed in Xiaoyuzhou on the participant’s phone.
- The five within-episode features are transcript, topic timeline, timestamped comments, sentiment analysis, and audio-analysis features.
- Each within-episode trial is capped at three minutes and uses speed/depth ratings.
- Level 3 uses 4 structures × 3 counts (5/10/15) for 12 conditions.
- Level 3 ratings are content/relationship understanding and visual comfort.
- A final qualitative interview covers the four structures.

## Assumptions in the prototype

- The episode set and metadata embedded in the interface are demonstration materials until their provenance is verified.
- A 1–7 response scale is appropriate for the two within-episode and two structure ratings.
- “Content understanding” in Task 3 includes both individual episode cues and visible relationships between episodes.
- Deterministic shuffling is acceptable; a formal counterbalancing plan has not yet been approved.
- Participants can access Xiaoyuzhou and the “岩中花述” channel on a personal phone.
- Three minutes is counted from the participant pressing the start button, not from verified audio playback.

## Unresolved research questions

- Which exact five audio segments will be used, and are they equivalent in difficulty, topic familiarity, speaking style, and emotional intensity?
- Will each participant hear five different segments or matched variants of one segment?
- Is a control condition without supplemental information required for the within-episode trials?
- Should feature and audio order be randomized, counterbalanced, or fixed?
- What constitutes an objective comprehension outcome, if the study intends to claim improved understanding rather than perceived help?
- Which episode metadata values are verified and which are simulated?
- What participant eligibility, prior familiarity, exclusion, missing-data, and timeout rules will be used?
- What is the target sample size and analysis plan?
- What consent, retention, deletion, and screen-recording policy will govern formal data collection?
