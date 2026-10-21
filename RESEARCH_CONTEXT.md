# Research Context

## Evidence and scope

This document is based only on:

- the current Codex conversation;
- the accessible application in `index.html` and its local assets; and
- the accessible research protocol titled `【10.15】用户研究方案 V3.0`.

No other conversations were available or reviewed. No participant records were opened or copied into this document.

Status labels used below:

- **Confirmed**: explicitly decided in the conversation or implemented in the current application.
- **Protocol intention**: documented in V3.0 but not necessarily implemented.
- **Assumption**: a reasonable interpretation that still requires confirmation.
- **Unresolved**: an open research, data, ethics, or implementation question.

## Research purpose

### Confirmed

The study investigates how podcast listeners find, browse, understand, and choose audio content, and whether content analysis and visual information organization can support those activities. The prototype focuses on the podcast 《岩中花述》.

The intended research questions are:

1. How do listeners normally discover and choose podcast content, and where do they encounter difficulty?
2. Does an additional content-analysis or visualization interface help with episode and within-episode retrieval?
3. How do four information structures affect episode retrieval and perceived comprehensibility/crowding?
4. Which information fields do listeners actively request when choosing an episode, and how does that behavior compare with their stated importance ranking?

Expected outputs include user needs and pain points, layout and scale guidance, information-priority recommendations, and requirements for a later podcast visualization product.

## Overall methodology

### Confirmed

- The current prototype is a moderated, exploratory, within-participant study workflow.
- A participant uses a phone for the real podcast platform and a computer for instructions, auxiliary visualization, structured tasks, and ratings.
- Phone activity is intended to be captured through participant-authorized screen recording; the website itself records only activity inside the website.
- The participant-facing flow contains 12 application steps: research information, background survey, Task 1 instructions, Task 1, Task 1 feedback, Task 2-A, Task 2-B, Task 2-C selection, selection feedback, information ranking, interview, and completion.
- The study is not a pure test of geometry alone. Grouping, hierarchy, visible relationships, task material, and interaction affordances can also differ between conditions.
- The prototype describes the study as approximately 60 minutes. The older protocol estimates roughly 56–66 minutes and says the final budget should be based on pilot testing.

### Protocol intention, not yet implemented as experimental control

- Counterbalance structure order, task type, target episode, and material set across participants.
- Avoid asking the same participant to find the same answer twice.
- Treat timeouts as timeouts rather than completed trials at the time limit.
- Conduct an initial pilot with approximately 2–3 people and an exploratory first study with approximately 12–16 participants.

## Study phases and measures

### 1. Introduction and consent

**Confirmed flow**

- Explain purpose, approximate duration, phone/computer use, voluntary participation, withdrawal, and screen-recording precautions.
- Require separate confirmation of study participation and understanding of screen-recording scope before continuing.
- Generate an anonymous-looking participant identifier; the form tells participants not to enter their real name.

**Measures currently stored**

- consent flags;
- consent version label;
- consent timestamp.

**Unresolved**

- final retention period, data controller/contact, access policy, deletion procedure, and approved consent wording;
- the legal/ethical basis and storage location for screen recordings.

### 2. Background survey / pre-interview

**Confirmed variables**

- age band;
- podcast-listening frequency: daily, several times weekly, weekly, every two weeks, less often, or never;
- platforms used, including 小宇宙, 喜马拉雅, Apple Podcasts, Spotify, YouTube, and other;
- usual discovery route;
- familiarity with 《岩中花述》.

The website collects participant responses. Host-only notes were deliberately removed from the participant interface.

### 3. Task 1: real-platform retrieval with and without assistance

**Confirmed design**

- Four trials replaced the original five-trial concept.
- Two trials are unassisted and use only the phone podcast platform.
- Two trials allow the participant to open the Beneath the Conversation visualization on the computer while searching.
- Trial types are episode retrieval and within-episode segment retrieval.
- Each trial has a three-minute limit plus a ten-second visible overtime/grace period, after which the prototype advances automatically.
- Participants type the answer into the website and submit it; the host does not provide extra content clues.
- Both segment-retrieval trials use S9E3. This was chosen because searching across three different episodes was considered too difficult.

**Current task material**

- Unassisted episode retrieval from a clue about Persian-language study, life in Iran, war, and women’s social conditions.
- Unassisted segment retrieval in S9E3 about self-taught painting and the simple happiness created by painting.
- Assisted episode retrieval from a clue about an international film-company executive, marathon running, and women in management.
- Assisted segment retrieval in S9E3 about tree roots growing through rocks and water as an image of vitality.

**Current Task 1 measures**

- trial status: completed, abandoned, or timeout;
- elapsed duration;
- typed answer;
- event timestamps.

**Current post-task measures**

Four 1–7 helpfulness ratings, each accompanied by a screenshot and an “not applicable / not seen” option:

- topic keywords and topic position;
- transcript/text positioning;
- main points/content summary;
- emotion/sentiment information.

**Rationale**

Task 1 approximates a realistic retrieval workflow. The assisted condition tests the overall value of an additional information tool, not visualization in isolation, because the auxiliary system also exposes content, text, and navigation features.

### 4. Task 2-A: retrieval across four information structures

**Confirmed design**

- Twenty episodes are shown in each condition.
- Four structures are used once each:
  - A: conventional list;
  - B: free association network;
  - C: topic-cluster network;
  - D: hierarchical tree.
- Each task has a 60-second limit.
- Participants select an episode card and submit or abandon the task.
- Cards expose episode ID, guest, theme grouping, and play count; richer episode details appear in a hover tooltip.
- The network uses theme-profile similarity. Each episode is connected to its strongest neighbor, with an optional second very-high-similarity neighbor. Stronger edges receive a distinct visual treatment.
- Related episodes are spatially grouped to shorten edges and reduce crossings.

**Current fixed prompts**

- A: find an episode by a specified guest.
- B: find an episode about Iranian society, war experience, and a female journalist’s identity.
- C: find the episode most related to a specified starting episode.
- D: find an episode about competitive sport, Olympic experience, and retirement transition.

**Current measures**

- selected episode;
- status: completed, abandoned, or timeout;
- elapsed duration;
- episode-selection events.

**Important limitation**

The current application always pairs each structure with one fixed task and uses the fixed A→B→C→D order. Structure, task type, target, order, and material are therefore confounded. The V3.0 protocol intended counterbalancing and rotation, but that logic is not implemented.

### 5. Task 2-B: perceived comprehensibility and crowding

**Confirmed current decision**

- The current study uses 12 conditions: four structures × 5, 10, and 15 episodes.
- This 5/10/15 decision supersedes the older protocol’s 10/20/40 proposal because the denser phone views produced text that was too small to read.
- Every condition is presented inside a fixed iPhone 17 portrait-ratio frame.
- Participants do not scroll, zoom, or drag the phone visualization.
- The suggested observation time is 30 seconds; at zero the participant is prompted to complete the ratings rather than being automatically advanced.
- Structures are shown in fixed blocks A, B, C, D, with counts ascending within each block.

**Measures**

- ease of understanding, 1 (completely difficult) to 7 (very easy);
- perceived crowding, 1 (not crowded) to 7 (very crowded);
- condition code;
- viewing/rating duration.

**Rationale**

Task 2-B measures subjective perception under increasing information density. It does not measure retrieval efficiency and should not be interpreted as objective readability.

### 6. Task 2-C: information choice and episode selection

**Confirmed design**

- Participants first make a realistic episode choice, then report confidence/helpful information, then rank information fields. This order reduces priming from the ranking task.
- The scenario asks for an interesting, unheard episode, preferably related to personal life and growth.
- The list contains 20 episodes.
- Initially, every row shows only episode ID and title.
- Participants can reveal at most three fields across the entire list: theme, guest, summary, comments, duration, and popularity.
- Participants can change fields and episode choice before confirming.
- After choosing, they rate confidence, select up to three helpful information types, and explain the decision.
- Finally, they drag seven items into an importance order: title, guest, theme, summary, comments, duration, and popularity.

**Measures**

- field additions/removals and sequence;
- active field combination;
- selected episode;
- decision duration;
- confidence rating;
- helpful fields;
- free-text reason;
- final importance ranking.

**Interpretive boundary**

Showing a field does not prove that it was read. The title is always visible and cannot be compared directly with actively revealed fields as though both represented the same behavior.

### 7. Semi-structured interview

**Confirmed implementation**

- The website shows only the interview stage and start/end timing controls.
- It does not record audio or create an automated transcript.

**Protocol topics**

- normal discovery and selection behavior;
- difficult tasks and reasons;
- helpful or confusing structures;
- scale/crowding reactions;
- information-field choices and missing information;
- barriers in current podcast platforms;
- visualization features worth retaining.

## Independent, controlled, and outcome variables

| Category | Variables |
| --- | --- |
| Manipulated or condition variables | Task 1 assistance; retrieval type; Task 2 structure; Task 2-B episode count; Task 2-C revealed information fields |
| Participant/background variables | Age band; listening frequency; platforms; discovery route; familiarity with the focal podcast |
| Behavioral outcomes | Completion/abandonment/timeout; duration; selected episode; typed answer; field-selection sequence; episode choice; ranking |
| Subjective outcomes | Feature helpfulness; comprehensibility; crowding; choice confidence; helpful information; explanation |
| Intended controls | Same focal podcast; fixed content fields within a comparison; fixed starting layouts; no host hints; no phone-view zoom/drag; consistent time limits |

## Analysis boundaries

### Confirmed or strongly supported

- Task 1 can be summarized with status, duration, typed answer, helpfulness ratings, and qualitative observations, while acknowledging material/order differences.
- Task 2-A can be described using duration and selections, but the current fixed task–structure pairing prevents a clean causal estimate of structure.
- Task 2-B should be analyzed as subjective ratings by structure and count, potentially with individual trajectories.
- Task 2-C supports analysis of first/changed/final fields, field combinations, episode choice, confidence, helpful fields, reasons, and final rankings.
- Interview data should be thematically synthesized around search barriers, structure interpretation, crowding, and information needs.

### Unresolved

- final participant sample and exclusion rules;
- handling prior familiarity with target episodes;
- authoritative answer keys and segment timestamps;
- whether ratings and timings will be treated descriptively or with inferential statistics;
- how missing trials, timeouts, and accidental navigation will be handled;
- whether the 5/10/15 Task 2-B design should be incorporated into a formally revised protocol version.
