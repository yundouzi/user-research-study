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
  contentArm: state.contentArm,
  episodeCount: STRUCTURE_EPISODES.length,
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
assert.equal(qa.comparisons.length, 12, "Expected twelve structure comparisons");
assert.equal(new Set(qa.comparisons.map(item => item.id)).size, 12, "Structure comparison IDs must be unique");
assert.equal(new Set(qa.comparisonIds).size, 12, "Comparison source definitions must be unique");
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
assert.deepEqual([...qa.answerHeader], ["participant_id", "study_version", "question_id", "stage", "measure", "response", "duration_ms", "metadata"], "Answer CSV must use the analysis-ready schema");
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
assert.equal(qa.contentTrials.filter(item => !item.materialReady).length, 1, "Only the unverified timestamp-comment material should be marked pending");

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
  const className = item.type === "list" ? "phone-list-item" : item.type === "network" ? "phone-node" : item.type === "tree" ? "tree-leaf" : "phone-cluster-item";
  const count = (item.html.match(new RegExp(`class=\\"${className}\\"`, "g")) || []).length;
  assert.equal(count, item.count, `${item.type}-${item.count} should render ${item.count} episode nodes`);
}

console.log("Smoke checks passed: secure participant IDs, balanced Task 3 sides, separate Task 3 measures, 12 stages, and no open-ended text areas.");
