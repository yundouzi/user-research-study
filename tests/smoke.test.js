"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

function fakeElement() {
  return {
    style: {},
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {},
    setAttribute() {},
    focus() {},
    showModal() {},
    close() {},
    scrollIntoView() {},
    click() {},
    disabled: false,
    innerHTML: "",
    textContent: "",
    value: ""
  };
}

const elements = new Map([
  ["#app", fakeElement()],
  ["#toast", fakeElement()],
  ["#accessDialog", fakeElement()],
  ["#progressBar", fakeElement()],
  ["#stepLabel", fakeElement()],
  ["#backButton", fakeElement()],
  ["#restartButton", fakeElement()],
  ["#researcherButton", fakeElement()],
  ["#accessCancel", fakeElement()],
  ["#accessForm", fakeElement()]
]);

const storage = new Map();
const context = {
  console,
  Date,
  Math,
  crypto: webcrypto,
  JSON,
  Blob,
  FormData,
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  CSS: { escape: value => String(value) },
  localStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: key => storage.delete(key)
  },
  document: {
    querySelector: selector => elements.get(selector) || fakeElement(),
    querySelectorAll: () => [],
    addEventListener() {},
    createElement: () => fakeElement(),
    head: { appendChild() {} }
  },
  setTimeout: () => 1,
  clearTimeout() {},
  setInterval: () => 1,
  clearInterval() {},
  addEventListener() {},
  scrollTo() {},
  confirm: () => true,
  location: { protocol: "file:" },
  navigator: {},
  YZH_STUDY_MATERIALS: { audioSources: ["", "", "", "", ""] }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

const sourcePath = path.resolve(__dirname, "..", "app.js");
const source = fs.readFileSync(sourcePath, "utf8");
const instrumentation = `
const originalAnswers = state.answers;
state.answers = {
  profile: { gender:"female", age:22, listeningFrequency:"weekly1to2", platforms:["xiaoyuzhou"], podcastTypes:["society"], listeningScenes:["commute"], creationExperience:"no", showFamiliarity:"oneOrTwo", durationMs:1000 },
  needs: { listeningPreference:"newInteresting", discoveryStart:["search","friends"], mostWantedInfo:["what","depth"], informationNeed:"summary", decisionTime:"threeToTen", mismatchAction:"seek", refindFrequency:"sometimes", afterListening:"similar", durationMs:1000 },
  infoRanking: {
    order: RANKING_FIELDS.map(item => item.id),
    orderLabels: RANKING_FIELDS.map(item => item.label),
    initialOrder: [...RANKING_FIELDS].reverse().map(item => item.id),
    initialOrderLabels: [...RANKING_FIELDS].reverse().map(item => item.label),
    ranks: RANKING_FIELDS.map((item,index) => ({ fieldId:item.id, rank:index + 1 })),
    durationMs:1000,
    completedAt:"2026-01-01T00:00:00.000Z"
  },
  infoReveal: { fields:["主题标签"], fieldIds:["topic_tags"], episode:"S8E4", durationMs:1000 },
  contentTrials: Object.fromEntries(CONTENT_TRIALS.map((trial,index) => [index,{
    taskId:"T2-D", trialId:trial.id, experimentArm:"A", feature:trial.feature, featureType:trial.featureType,
    featureEnabled:index % 2 === 0, featureOpened:index % 2 === 0, featureMaterialReady:trial.materialReady !== false,
    audioStartTime:"2026-01-01T00:00:00.000Z", q1Answer:"A", q1Correct:true, q2Answer:"A", q2Correct:true,
    q3EaseRating:5, q1DurationMs:500, q2DurationMs:700, trialTotalDurationMs:1000, playbackCount:1,
    playbackSeekEvents:[], featureUsageEvents:[], audioConfigured:true
  }])),
  structureTrials: Object.fromEntries(state.structureComparisons.map((comparison,index) => [index,{
    questionId:comparison.id,
    aType:comparison.a.type,
    aCount:comparison.a.count,
    bType:comparison.b.type,
    bCount:comparison.b.count,
    canonicalAType:comparison.canonicalA.type,
    canonicalACount:comparison.canonicalA.count,
    canonicalBType:comparison.canonicalB.type,
    canonicalBCount:comparison.canonicalB.count,
    sideSwapped:comparison.sideSwapped,
    layoutArm:state.layoutArm,
    visualChoice:"A",
    understandingChoice:"B",
    dimensionsAgree:false,
    durationMs:1000
  }])),
  interview: { completed:true, durationMs:1000 },
  scenario: { episode:"S8E4", durationMs:1000 }
};
const sampleAnswerRows = answerRows();
state.answers = originalAnswers;
globalThis.__qa = {
  steps: [...STEPS],
  fieldCount: INFORMATION_FIELDS.length,
  rankingFieldIds: RANKING_FIELDS.map(item => item.id),
  rankingInitialOrder: [...state.infoRankingInitial],
  rankingRandomizationCheck: (() => {
    const first = rankingInitialOrder("participant-a");
    const repeat = rankingInitialOrder("participant-a");
    const second = rankingInitialOrder("participant-b");
    return { deterministic: first.join(",") === repeat.join(","), participantVariation: first.join(",") !== second.join(",") };
  })(),
  contentTrialCount: CONTENT_TRIALS.length,
  contentTrials: CONTENT_TRIALS.map((trial,index) => ({ id:trial.id, featureType:trial.featureType, q1:trial.q1, q2:trial.q2, materialReady:trial.materialReady !== false, arm0: index % 2 === 0, arm1: index % 2 === 1 })),
  contentPanelMarkup: CONTENT_TRIALS.map(trial => trial.content()),
  contentArm: state.contentArm,
  episodeCount: STRUCTURE_EPISODES.length,
  structureEpisodes: STRUCTURE_EPISODES.map(episode => ({ id:episode.id, category:episode.category, tags:[...episode.tags] })),
  comparisons: [...state.structureComparisons],
  stepMarkup: STEPS.map(step => {
    state.step = step;
    if (step === "contentTrial") state.contentIndex = 0;
    if (step === "structureTrial") state.structureIndex = 0;
    return { step, html: RENDERERS[step]() };
  }),
  needsQuestionMarkup: (() => {
    const originalIndex = state.needsIndex;
    const pages = TASK_ONE_QUESTIONS.map((question, index) => {
      state.needsIndex = index;
      return { key: question.key, type: question.type, html: renderNeeds() };
    });
    state.needsIndex = originalIndex;
    return pages;
  })(),
  structureMarkup: [5, 10, 15].flatMap(count => Object.keys(STRUCTURE_TYPES).map(type => ({ type, count, html: structureHTML(type, count) }))),
  task2bFieldIds: INFORMATION_FIELDS.map(field => field.id),
  task2bEpisodes: TASK2B_EPISODES.map(episode => ({
    id: episode.id,
    title: episode.title,
    host: episode.host,
    guest: episode.guest,
    commentCount: episode.commentOverview.length,
    commentsValid: episode.commentOverview.every(comment => Boolean(comment.username && comment.text))
  })),
  fieldValuesComplete: TASK2B_EPISODES.every(episode => INFORMATION_FIELDS
    .every(field => Boolean(fieldValue(episode, field.id)))),
  commentMarkup: TASK2B_EPISODES.map(episode => revealedFieldHTML(episode, "comments")),
  similarMarkup: TASK2B_EPISODES.map(episode => revealedFieldHTML(episode, "similar_recommendations")),
  comparisonIds: STRUCTURE_COMPARISONS.map(item => item.id),
  comparisonDefinitions: STRUCTURE_COMPARISONS.map(item => item.id + ":" + item.a.type + "-" + item.a.count + "|" + item.b.type + "-" + item.b.count),
  answerHeader: answerRows()[0],
  sampleAnswerRows,
  studyVersion: STUDY_VERSION,
  syncEndpoint: SYNC_ENDPOINT,
  participantId: state.participantId,
  stateContainsSessionToken: Object.hasOwn(state, "sessionToken") || JSON.stringify(state).includes(sessionCredential.token),
  rankingOperationCheck: (() => {
    const originalRanking = [...state.infoRanking];
    const originalSelected = state.rankingSelectedId;
    const originalEventsLength = state.events.length;
    const originalSequence = state.nextEventSequence;
    const [first, second] = RANKING_FIELDS.map(item => item.id);
    state.infoRanking = [];
    placeRankingItem(first, 0, "drag", true);
    placeRankingItem(second, 1, "click", true);
    placeRankingItem(first, 1, "click", true);
    const expectedOrder = second + "," + first;
    const reordered = state.infoRanking.join(",") === expectedOrder;
    const persisted = JSON.parse(localStorage.getItem(STORAGE_KEY)).infoRanking.join(",") === expectedOrder;
    removeRankingItem(first, "drag");
    const removed = state.infoRanking.join(",") === second;
    state.infoRanking = originalRanking;
    state.rankingSelectedId = originalSelected;
    state.events.splice(originalEventsLength);
    state.nextEventSequence = originalSequence;
    save({ sync:false, touch:false });
    return { reordered, persisted, removed };
  })(),
  balanceCheck: (() => {
    const arm0 = balancedComparisons("fixed-participant", 0).sort((a,b) => a.id.localeCompare(b.id));
    const arm1 = balancedComparisons("fixed-participant", 1).sort((a,b) => a.id.localeCompare(b.id));
    return arm0.every((item,index) => item.id === arm1[index].id && item.a.type === arm1[index].b.type && item.a.count === arm1[index].b.count && item.b.type === arm1[index].a.type && item.b.count === arm1[index].a.count);
  })(),
  eventHasStableId: (() => {
    const originalLength = state.events.length;
    log("qa_event", "worker_sync");
    const event = state.events.at(-1);
    state.events.splice(originalLength);
    return Boolean(event.id && event.sequence);
  })()
};`;

vm.runInContext(`${source}\n${instrumentation}`, context, { filename: "app.js" });
const qa = context.__qa;

assert.equal(qa.steps.length, 12, "Expected 12 study stages");
assert.equal(qa.fieldCount, 9, "Task 2-B should use the same nine information fields as Task 2-A");
assert.deepEqual(qa.task2bFieldIds, qa.rankingFieldIds, "Task 2-A and Task 2-B must share the same stable field IDs");
assert.equal(qa.rankingFieldIds.length, 9, "Task 2-A should contain exactly nine ranking fields");
assert.equal(new Set(qa.rankingFieldIds).size, 9, "Task 2-A field IDs must be unique");
assert.deepEqual(new Set(qa.rankingInitialOrder), new Set(qa.rankingFieldIds), "Initial ranking order must contain all nine stable field IDs exactly once");
assert.ok(qa.rankingRandomizationCheck.deterministic && qa.rankingRandomizationCheck.participantVariation, "Initial order should be reproducible per participant and vary between participants");
assert.equal(qa.contentTrialCount, 5, "Expected five within-episode trials");
const audioPath = path.resolve(__dirname, "..", "assets", "audio", "s8e6.m4a");
assert.ok(fs.existsSync(audioPath) && fs.statSync(audioPath).size > 20_000_000, "Task 2-D must include the real S8E6 audio asset");
assert.ok(qa.episodeCount >= 15, "Expected at least 15 structure episodes");
assert.deepEqual(Array.from(qa.structureEpisodes, episode => episode.id), ["S4E5","S8E4","S8E8","S9E2","S7E7","S8E6","S8E7","S9E3","S5E8","S7E9","S8E1","S8E2","S8E3","S8E5","S9E1"], "Task 3 must preserve the prototype's fixed nested episode order");
assert.ok(qa.structureEpisodes.every(episode => episode.category && episode.tags.length === 4), "Task 3 episodes need the prototype category and four topic tags");
assert.equal(qa.comparisons.length, 12, "Expected twelve structure comparisons");
assert.equal(new Set(qa.comparisons.map(item => item.id)).size, 12, "Structure comparison IDs must be unique");
assert.equal(new Set(qa.comparisonIds).size, 12, "Comparison source definitions must be unique");
assert.deepEqual(Array.from(qa.comparisonIds), ["T3-01","T3-02","T3-03","T3-04","T3-05","T3-06","T3-07","T3-08","T3-09","T3-10","T3-11","T3-12"], "Task 3 question IDs and source order must remain unchanged");
assert.deepEqual(Array.from(qa.comparisonDefinitions), [
  "T3-01:list-5|network-10","T3-02:network-10|tree-15","T3-03:tree-15|cluster-5","T3-04:cluster-5|list-10",
  "T3-05:list-10|network-15","T3-06:network-15|tree-5","T3-07:tree-5|cluster-10","T3-08:cluster-10|list-15",
  "T3-09:list-15|network-5","T3-10:network-5|tree-10","T3-11:tree-10|cluster-15","T3-12:cluster-15|list-5"
], "Task 3 fixed pair definitions must remain unchanged");
assert.ok(qa.stepMarkup.every(item => item.html && !item.html.includes("undefined")), "Every stage must render without undefined content");
assert.ok(qa.stepMarkup.every(item => !item.html.includes("<textarea")), "Participant stages must not contain open-ended text areas");
const profileMarkup = qa.stepMarkup.find(item => item.step === "profile").html;
const needsMarkup = qa.needsQuestionMarkup.map(item => item.html).join("\n");
const scenarioMarkup = qa.stepMarkup.find(item => item.step === "scenario").html;
assert.ok(!profileMarkup.includes("请先完成以下表单"), "Profile page should not show the removed explanatory copy");
assert.ok(profileMarkup.includes('placeholder="请输入年龄"') && !profileMarkup.includes("请输入周岁"), "Age should use only the requested input placeholder");
assert.ok(profileMarkup.includes("platformOtherField") && profileMarkup.includes("podcastTypeOtherField"), "Profile other options need conditional text inputs");
assert.ok(needsMarkup.includes("discoveryStartOtherField") && needsMarkup.includes("mostWantedInfoOtherField"), "Task 1 other options need conditional text inputs");
assert.equal(qa.needsQuestionMarkup.length, 8, "Task 1 should render eight separate question pages");
assert.ok(qa.needsQuestionMarkup.every(item => (item.html.match(/class=\"card question-card\"/g) || []).length === 1), "Each Task 1 page should contain exactly one question card");
assert.ok(qa.needsQuestionMarkup[0].html.includes("task-one-choice-list") && !qa.needsQuestionMarkup[0].html.includes("two-columns"), "Task 1 question 1 choices should each occupy one row");
assert.ok(qa.needsQuestionMarkup[1].html.includes('type="checkbox"') && qa.needsQuestionMarkup[1].html.includes('data-choice-limit="2"'), "Task 1 question 2 should allow up to two choices");
assert.ok(qa.needsQuestionMarkup[2].html.includes('type="checkbox"') && qa.needsQuestionMarkup[2].html.includes('data-choice-limit="2"'), "Task 1 question 3 should allow up to two choices");
assert.ok(qa.needsQuestionMarkup[7].html.includes('type="radio"') && !qa.needsQuestionMarkup[7].html.includes('type="checkbox"'), "Task 1 question 8 should be single choice");
assert.ok(scenarioMarkup.includes("scenarioEpisodeOtherField"), "Scenario other option needs a conditional text input");
const rankingMarkup = qa.stepMarkup.find(item => item.step === "infoRank").html;
assert.ok(rankingMarkup.includes("ranking-chip-box") && rankingMarkup.includes("ranking-axis"), "Task 2-A should render a chip pool and continuous ranking axis");
assert.ok(rankingMarkup.includes("已排列 0/9 项"), "Task 2-A should show live completion count");
assert.ok(rankingMarkup.includes("disabled"), "Task 2-A submit should be disabled until all nine fields are ranked");
assert.ok(qa.rankingOperationCheck.reordered, "Click placement should reorder ranked fields");
assert.ok(qa.rankingOperationCheck.persisted, "Ranking changes should persist to localStorage for refresh recovery");
assert.ok(qa.rankingOperationCheck.removed, "Drag-style removal should return a field to the unranked pool");
assert.ok(qa.stepMarkup.every(item => !item.html.includes("其他（访谈）")), "Other options should not be labelled as interview prompts");
const revealMarkup = qa.stepMarkup.find(item => item.step === "infoReveal").html;
assert.ok(!revealMarkup.includes("第三步：确认你的选择") && !revealMarkup.includes("revealForm"), "Task 2-B should not include a third confirmation step");
assert.ok(revealMarkup.includes('id="infoRevealSubmit"') && revealMarkup.includes("提交并继续") && revealMarkup.includes("disabled"), "Task 2-B should require an explicit submit after selecting an episode");
assert.ok(!revealMarkup.includes("本期嘉宾：") && !revealMarkup.includes("鲁豫对话"), "Task 2-B cards should show clean titles without duplicated host and guest text");
assert.ok(qa.task2bEpisodes.every(episode => episode.host && episode.guest && episode.commentCount >= 1 && episode.commentCount <= 2 && episode.commentsValid), "Each Task 2-B episode should have one or two valid matched comments");
assert.ok(qa.commentMarkup.every(markup => markup.includes("comment-username") && markup.includes("comment-text")), "Task 2-B comments should render usernames and text on separate lines");
assert.ok(qa.similarMarkup.every(markup => (markup.match(/<span>/g) || []).length === 3), "Each similar podcast recommendation should render on its own line");
assert.ok(qa.fieldValuesComplete, "Every sourced Task 2-B field must have a value for every episode");
assert.deepEqual([...qa.answerHeader], ["participant_id", "study_version", "question_id", "stage", "measure", "response", "duration_ms", "metadata", "timed_out"], "Answer CSV must use the analysis-ready schema");
assert.equal(qa.sampleAnswerRows.length, 80, "Completed study export should contain one header and 79 answer rows");
assert.ok(qa.sampleAnswerRows.slice(1).every(row => row[2] && row[4] && !row.includes(undefined)), "Every exported answer row must have a question ID, measure, and defined values");
assert.equal(qa.studyVersion, 8, "Task 2-D redesign should use study version 8");
assert.equal(qa.syncEndpoint, "/api/study/sync", "Client should target the same-origin Sites sync API");
assert.ok(qa.eventHasStableId, "Behavior events need stable IDs for idempotent database writes");
assert.match(qa.participantId, /^P-\d{8}-[A-F0-9]{24}$/, "Participant IDs need a high-entropy suffix");
assert.equal(qa.stateContainsSessionToken, false, "The anonymous session token must not enter the synced/exported study state");
assert.ok(qa.balanceCheck, "Each stable Task 3 question must reverse A/B positions between layout arms");
assert.equal(Array.from(qa.contentTrials, item => item.featureType).join(","), "topic_keyword_timeline,transcript,timestamp_comment,sentiment_analysis,audio_features", "Task 2-D should use the five requested features in order");
assert.ok(qa.contentTrials.every(item => item.id && item.q1.options.length === 4 && item.q2.options.length === 4), "Every Task 2-D trial needs stable IDs and two four-option questions");
assert.ok(qa.contentTrials.every(item => item.arm0 !== item.arm1), "Task 2-D content arms must be complementary");
assert.equal(qa.contentTrials.filter(item => !item.materialReady).length, 0, "All five Task 2-D materials should now be ready");
const contentMarkup = qa.stepMarkup.find(item => item.step === "contentTrial").html;
assert.ok(contentMarkup.includes("回答问题") && contentMarkup.includes("contentQ1") && contentMarkup.includes("contentQ2"), "Task 2-D questions should be visible before playback finishes");
assert.ok(contentMarkup.includes('id="contentTrialTimer"') && contentMarkup.includes("本题限时 2 分钟"), "Every Task 2-D trial should expose its two-minute timer");
assert.ok(!contentMarkup.includes('id="contentSubmit" type="submit" disabled'), "Task 2-D submission must not require complete audio playback");
assert.ok(qa.contentPanelMarkup[0].includes("keyword-timeline") && !qa.contentPanelMarkup[0].includes("topic-segment"), "The first auxiliary panel should use a keyword timeline instead of colored topic blocks");
assert.equal((qa.contentPanelMarkup[2].match(/class="timestamp-comment"/g) || []).length, 5, "Timestamp comments should use the five verified supplied comments");
assert.equal((qa.contentPanelMarkup[2].match(/class="comment-number"/g) || []).length, 5, "Timestamp comment cards should be numbered");
assert.ok([1,2,3,4,5].every(number => qa.contentPanelMarkup[2].includes(`>${number}</button>`)), "Timestamp timeline points should share the comment numbers");
assert.ok(qa.contentPanelMarkup[3].includes("sentiment-zero-line") && !qa.contentPanelMarkup[3].includes("linear-gradient"), "Sentiment visualization should use a positive/negative zero axis without gradients");
assert.ok(qa.contentPanelMarkup[4].includes('data-audio-metric="loudness"') && qa.contentPanelMarkup[4].includes('data-audio-metric="pitch"'), "Audio features should provide loudness and pitch switching");

const rankingRows = qa.sampleAnswerRows.slice(1).filter(row => row[4] === "information_rank");
assert.equal(rankingRows.length, 9, "Task 2-A CSV should contain one explicit rank row per stable field ID");
assert.deepEqual(rankingRows.map(row => row[2]), qa.rankingFieldIds.map(id => `T2-E01-${id}`), "Task 2-A rank rows should use stable field IDs");
assert.equal(Array.from(rankingRows, row => row[5]).join(","), "1,2,3,4,5,6,7,8,9", "Task 2-A CSV should export ranks 1 through 9");
const revealRow = qa.sampleAnswerRows.slice(1).find(row => row[2] === "T2-E02");
assert.deepEqual(JSON.parse(revealRow[7]).selectedFieldIds, ["topic_tags"], "Task 2-B export should include stable field IDs shared with Task 2-A");

const task3Rows = qa.sampleAnswerRows.slice(1).filter(row => row[3] === "Task 3");
assert.equal(task3Rows.length, 24, "Task 3 must export visual comfort and understanding as separate rows");
for (const row of task3Rows) {
  const metadata = JSON.parse(row[7]);
  assert.ok(metadata.displayAType && metadata.displayBType, "Task 3 metadata must contain the actual displayed designs");
  assert.ok(metadata.canonicalAType && metadata.canonicalBType, "Task 3 metadata must preserve the fixed canonical pair");
  assert.ok([true, false].includes(metadata.sideSwapped), "Task 3 metadata must record whether sides were swapped");
}

const task2DRows = qa.sampleAnswerRows.slice(1).filter(row => row[3] === "Task 2-D");
assert.equal(task2DRows.length, 25, "Task 2-D must export five measures for each of five trials");
assert.deepEqual([...new Set(task2DRows.map(row => row[4]))].sort(), ["q1_answer","q1_correct","q2_answer","q2_correct","q3_ease_rating"].sort());
for (const row of task2DRows) {
  const metadata = JSON.parse(row[7]);
  assert.ok(metadata.trialId && metadata.featureType && metadata.audioStartTime, "Task 2-D metadata must preserve trial, feature, and audio timing");
  assert.ok(Array.isArray(metadata.playbackSeekEvents) && Array.isArray(metadata.featureUsageEvents), "Task 2-D metadata must preserve playback and feature usage events");
}

for (const item of qa.structureMarkup) {
  const count = (item.html.match(/data-t3-episode=/g) || []).length;
  assert.equal(count, item.count, `${item.type}-${item.count} should render ${item.count} episode nodes`);
  assert.ok(item.html.includes(`density-${item.count}`), `${item.type}-${item.count} should preserve the assigned density condition`);
  if (item.type === "network") {
    assert.ok(item.html.includes("t3-edge") && item.html.includes("t3-network-legend"), "Network views need similarity edges and an internal topic legend");
    assert.equal((item.html.match(/class="t3-edge"/g) || []).length, ({5:6,10:10,15:20})[item.count], `network-${item.count} should preserve the prototype edge set`);
  }
  if (item.type === "tree") assert.ok(item.html.includes("data-t3-tree-toggle") && item.html.includes("t3-root-node"), "Tree views need expandable topic branches");
  if (item.type === "cluster") assert.ok(item.html.includes("data-t3-filter") && item.html.includes("t3-category-card"), "Category views need topic filters and grouped cards");
}

console.log("Smoke checks passed: secure participant IDs, balanced Task 3 sides, separate Task 3 measures, 12 stages, and no open-ended text areas.");

// Exercise deadline persistence, partial timeout answers and final-trial progression.
vm.runInContext(`
  state.step = "structureTrial";
  state.structureIndex = 0;
  state.structureDeadlines = {};
  state.structureDrafts = { 0: { visualChoice: "A" } };
  renderStructureTrial();
  globalThis.firstDeadline = state.structureDeadlines[0];
  renderStructureTrial();
  globalThis.sameDeadline = state.structureDeadlines[0] === firstDeadline;
  state.structureDeadlines[0] = Date.now() - 1;
  bindStructureTrialTimer();
  globalThis.timeoutAnswer = state.answers.structureTrials[0];
  globalThis.nextIndex = state.structureIndex;
  globalThis.nextRemaining = state.structureDeadlines[1] - Date.now();
  state.structureIndex = state.structureComparisons.length - 1;
  renderStructureTrial();
  completeStructureTrial(false, { visualChoice: "B", understandingChoice: "A" });
  globalThis.finalStep = state.step;
`, context);
assert.equal(context.sameDeadline, true, "Re-render must not reset the deadline");
assert.equal(context.timeoutAnswer.timedOut, true);
assert.equal(context.timeoutAnswer.visualChoice, "A");
assert.equal(context.timeoutAnswer.understandingChoice, null);
assert.equal(context.timeoutAnswer.dimensionsAgree, null);
assert.equal(context.nextIndex, 1);
assert.ok(context.nextRemaining > 59000 && context.nextRemaining <= 60000);
assert.equal(context.finalStep, "interview");
console.log("Task 3 timer checks passed: persistent deadlines, partial timeout answers, fresh next timer and final progression.");

for (const scenario of [
  { timedOut: false, q1: "A", q2: "B" },
  { timedOut: true, q1: "A", q2: "" },
  { timedOut: true, q1: "", q2: "" },
  { q1: "", q2: "" }
]) {
  context.timeoutScenario = scenario;
  vm.runInContext(`
    state.answers.contentTrials = { 0: {
      trialId: "T2-D01", ...timeoutScenario,
      q1Answer: timeoutScenario.q1, q2Answer: timeoutScenario.q2,
      q1Correct: timeoutScenario.q1 ? true : false,
      q2Correct: timeoutScenario.q2 ? true : false
    } };
    state.answers.structureTrials = { 0: {
      questionId: "T3-01", ...timeoutScenario,
      visualChoice: timeoutScenario.q1, understandingChoice: timeoutScenario.q2
    } };
    globalThis.exportedTimeoutRows = answerRows().slice(1);
  `, context);
  const expected = typeof scenario.timedOut === "boolean" ? scenario.timedOut : "unknown";
  const rows = context.exportedTimeoutRows;
  assert.equal(rows.filter(r => r[3] === "Task 2-D").length, 5);
  assert.equal(rows.filter(r => r[3] === "Task 3").length, 2);
  for (const row of rows) {
    assert.equal(row[8], ["Task 2-D", "Task 3"].includes(row[3]) ? expected : "");
    if (row[4] === "q1_correct" && !scenario.q1) assert.equal(row[5], "");
    if (row[4] === "q2_correct" && !scenario.q2) assert.equal(row[5], "");
  }
}
console.log("Answer timeout export checks passed: normal, partial timeout, unanswered timeout and unknown history.");

vm.runInContext(`
  globalThis.dictionaryStateBefore = JSON.stringify(state);
  globalThis.dictionaryRows = dataDictionaryRows();
  globalThis.dictionaryVersion = STUDY_VERSION;
  globalThis.dictionaryStateUnchanged = dictionaryStateBefore === JSON.stringify(state);
  globalThis.dictionaryNeeds = TASK_ONE_QUESTIONS;
  globalThis.dictionaryProfiles = PROFILE_OPTIONS;
  globalThis.dictionaryTrials = CONTENT_TRIALS;
  globalThis.dictionaryComparisons = STRUCTURE_COMPARISONS;
  globalThis.dictionaryAnswers = answerRows();
  globalThis.dictionaryResearcherMarkup = (() => { renderResearcher(); return app.innerHTML; })();
`, context);
const dictionary = context.dictionaryRows.slice(1);
const lookup = (id, measure, column = "response") => dictionary.filter(row => row[2] === id && row[4] === measure && row[5] === column);
assert.equal(context.dictionaryStateUnchanged, true, "Dictionary generation must not alter participant data");
assert.ok(context.dictionaryResearcherMarkup.includes('id="researchExportDictionary"'));
assert.ok(!source.slice(source.indexOf("function renderComplete()"), source.indexOf("function renderComplete()") + 1600).includes('id="researchExportDictionary"'), "New export belongs only in researcher view");
assert.ok(dictionary.every(row => row[0] === context.dictionaryVersion && row[1] && row[6] && row[8]), "Every entry needs version, revision and Chinese labels");
assert.throws(() => vm.runInContext('dataDictionaryRows(-1)', context), /study_version/, "Do not mislabel unsupported historical versions");
for (const row of context.dictionaryAnswers.slice(1)) assert.ok(lookup(row[2], row[4]).length, `Dictionary missing ${row[2]} / ${row[4]}`);
const needsIds = ["T1-01", "T1-02", "T1-03", "T1-07", "T1-03-duration", "T1-04", "T1-05", "T1-06"];
const needsMeasures = ["listening_preference", "discovery_start", "most_wanted_information", "information_need", "decision_time", "mismatch_action", "refind_frequency", "after_listening"];
context.dictionaryNeeds.forEach((q, index) => {
  const entries = lookup(needsIds[index], needsMeasures[index]);
  assert.equal(entries.length, q.options.length);
  for (const [code, label] of q.options) assert.ok(entries.some(row => row[6] === q.title && row[7] === code && row[8] === label));
});
for (const [key, id, measure] of [
  ["gender", "P1-02", "gender"], ["listeningFrequency", "P1-04", "listening_frequency"],
  ["platforms", "P1-05", "platforms"], ["podcastTypes", "P1-06", "podcast_types"],
  ["listeningScenes", "P1-06.5", "listening_scenes"], ["creationExperience", "P1-08", "creation_experience"],
  ["showFamiliarity", "P1-09", "show_familiarity"]
]) {
  const entries = lookup(id, measure);
  assert.equal(entries.length, context.dictionaryProfiles[key].length);
  for (const [code, label] of context.dictionaryProfiles[key]) assert.ok(entries.some(row => row[7] === code && row[8] === label));
}
for (const trial of context.dictionaryTrials) {
  for (const key of ["q1", "q2"]) {
    const entries = lookup(trial.id, key + "_answer");
    assert.equal(entries.length, trial[key].options.length);
    for (const [code, label] of trial[key].options) assert.ok(entries.some(row => row[6] === trial[key].text && row[7] === code && row[8] === label && row[10].includes(trial[key].correct)));
    assert.equal(lookup(trial.id, key + "_correct").length, 3);
  }
  assert.equal(lookup(trial.id, "q3_ease_rating").length, 7);
}
for (const comparison of context.dictionaryComparisons) {
  assert.equal(lookup(comparison.id, "visual_comfort_choice").length, 2);
  const entries = lookup(comparison.id, "understanding_choice");
  assert.equal(entries.length, 2);
  assert.ok(entries.every(row => row[6] === "哪一个界面更容易找到喜欢的播客？"));
  for (const type of ["list", "network", "tree", "cluster"]) assert.ok(lookup(comparison.id, "*", "metadata.displayAType").some(row => row[7] === type));
}
const dictionaryKeys = dictionary.map(row => JSON.stringify([row[0], row[2], row[4], row[5], row[7]]));
assert.equal(new Set(dictionaryKeys).size, dictionaryKeys.length, "Dictionary keys must be unique");
console.log("Data dictionary checks passed: version scope, all exported measures, exact questionnaire options, trial questions, scales and A/B mappings.");
vm.runInContext(`
  globalThis.dictionaryDownload = null;
  const savedDownload = download;
  const savedToken = researcherSessionToken;
  download = (name, text, mime) => { globalThis.dictionaryDownload = { name, text, mime }; };
  researcherSessionToken = "";
  exportDataDictionary();
  globalThis.dictionaryBlocked = dictionaryDownload === null;
  researcherSessionToken = "test-authorized";
  exportDataDictionary();
  download = savedDownload;
  researcherSessionToken = savedToken;
`, context);
assert.equal(context.dictionaryBlocked, true, "Dictionary export must respect researcher access");
assert.equal(context.dictionaryDownload.name, `study-${context.dictionaryVersion}-data-dictionary.csv`);
assert.ok(context.dictionaryDownload.text.startsWith('"study_version","dictionary_revision","question_id"'));
assert.ok(context.dictionaryDownload.text.includes('"male","男"'));
assert.equal(context.dictionaryDownload.mime, "text/csv;charset=utf-8");
console.log("Dictionary CSV download checks passed: researcher access, versioned filename and UTF-8 Chinese labels.");

(async () => {
  context.TextEncoder = TextEncoder;
  context.testAccessConfig = {
    researcherAccessCodeHash: require("node:crypto").createHash("sha256").update("test-access").digest("hex")
  };
  assert.equal(await vm.runInContext('matchesResearcherCode("test-access", testAccessConfig)', context), true);
  assert.equal(await vm.runInContext('matchesResearcherCode("wrong-access", testAccessConfig)', context), false);
  assert.equal(await vm.runInContext('matchesResearcherCode("", testAccessConfig)', context), false);
  assert.equal(await vm.runInContext('matchesResearcherCode("local", { researcherAccessCode: "local" })', context), true);
  assert.equal(await vm.runInContext('matchesResearcherCode("local", {})', context), false);
  const previousLocation = context.location;
  context.location = { protocol: "https:", hostname: "yundouzi.github.io" };
  assert.equal(vm.runInContext('canUseServerAPI()', context), false, "Pages must never offer nonexistent aggregate APIs");
  context.location = previousLocation;
  const pagesConfig = fs.readFileSync(path.resolve(__dirname, "..", "pages-config.js"), "utf8");
  assert.match(pagesConfig, /researcherAccessCodeHash: "[a-f0-9]{64}"/);
  assert.ok(!/researcherAccessCode\s*:/.test(pagesConfig), "Never publish the plaintext code");
  const workflow = fs.readFileSync(path.resolve(__dirname, "..", ".github/workflows/pages.yml"), "utf8");
  assert.ok(workflow.includes("cp pages-config.js _site/config.js"));
  const previousConfig = context.YZH_STUDY_CONFIG;
  const appendChild = context.document.head.appendChild;
  delete context.YZH_STUDY_CONFIG;
  context.document.head.appendChild = script => script.onerror();
  assert.equal(await vm.runInContext('loadLocalConfig()', context), false);
  let loads = 0;
  context.document.head.appendChild = script => {
    loads += 1;
    setTimeout(() => { context.YZH_STUDY_CONFIG = context.testAccessConfig; script.onload(); }, 0);
  };
  const retry = vm.runInContext('loadLocalConfig()', context);
  const concurrent = vm.runInContext('loadLocalConfig()', context);
  assert.equal(retry, concurrent, "Concurrent attempts must share the pending load");
  assert.equal(await retry, true, "A failed first load must be retryable");
  assert.equal(loads, 1);
  assert.equal(await vm.runInContext('matchesResearcherCode("test-access")', context), true);
  context.document.head.appendChild = appendChild;
  context.YZH_STUDY_CONFIG = previousConfig;
  assert.ok(fs.readFileSync(path.resolve(__dirname, "..", "index.html"), "utf8").includes('app.js?v=lite-study-1'));
  console.log("Researcher access checks passed: valid/invalid/empty code, local compatibility, Pages API isolation and hashed deployment config.");
})().catch(error => { console.error(error); process.exitCode = 1; });
