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
  needs: { listeningPreference:"newInteresting", discoveryStart:"search", mostWantedInfo:"what", informationNeed:"summary", decisionTime:"threeToTen", mismatchAction:"seek", refindFrequency:"sometimes", afterListening:["similar"], durationMs:1000 },
  infoRanking: { order: INFORMATION_FIELDS.map(item => item[0]), durationMs:1000 },
  infoReveal: { fields:["主题标签"], episode:"S8E4", durationMs:1000 },
  contentTrials: Object.fromEntries(CONTENT_TRIALS.map((trial,index) => [index,{ feature:trial.feature, help:5, featureOpened:true, elapsedMs:1000, audioConfigured:false }])),
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
  contentTrialCount: CONTENT_TRIALS.length,
  episodeCount: STRUCTURE_EPISODES.length,
  comparisons: [...state.structureComparisons],
  stepMarkup: STEPS.map(step => {
    state.step = step;
    if (step === "contentTrial") state.contentIndex = 0;
    if (step === "structureTrial") state.structureIndex = 0;
    return { step, html: RENDERERS[step]() };
  }),
  structureMarkup: [5, 10, 15].flatMap(count => Object.keys(STRUCTURE_TYPES).map(type => ({ type, count, html: structureHTML(type, count) }))),
  fieldValuesComplete: EPISODES.every(episode => INFORMATION_FIELDS.every(([field]) => Boolean(fieldValue(episode, field)))),
  comparisonIds: STRUCTURE_COMPARISONS.map(item => item.id),
  answerHeader: answerRows()[0],
  sampleAnswerRows,
  studyVersion: STUDY_VERSION,
  syncEndpoint: SYNC_ENDPOINT,
  participantId: state.participantId,
  stateContainsSessionToken: Object.hasOwn(state, "sessionToken") || JSON.stringify(state).includes(sessionCredential.token),
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
assert.equal(qa.fieldCount, 13, "Expected 13 information fields");
assert.equal(qa.contentTrialCount, 5, "Expected five within-episode trials");
assert.ok(qa.episodeCount >= 15, "Expected at least 15 structure episodes");
assert.equal(qa.comparisons.length, 12, "Expected twelve structure comparisons");
assert.equal(new Set(qa.comparisons.map(item => item.id)).size, 12, "Structure comparison IDs must be unique");
assert.equal(new Set(qa.comparisonIds).size, 12, "Comparison source definitions must be unique");
assert.ok(qa.stepMarkup.every(item => item.html && !item.html.includes("undefined")), "Every stage must render without undefined content");
assert.ok(qa.stepMarkup.every(item => !item.html.includes("<textarea")), "Participant stages must not contain open-ended text areas");
assert.ok(qa.fieldValuesComplete, "Every reveal field must have a value for every episode");
assert.deepEqual([...qa.answerHeader], ["participant_id", "study_version", "question_id", "stage", "measure", "response", "duration_ms", "metadata"], "Answer CSV must use the analysis-ready schema");
assert.equal(qa.sampleAnswerRows.length, 51, "Completed study export should contain one header and 50 answer rows");
assert.ok(qa.sampleAnswerRows.slice(1).every(row => row[2] && row[4] && !row.includes(undefined)), "Every exported answer row must have a question ID, measure, and defined values");
assert.equal(qa.studyVersion, 7, "Anonymous-session data schema should use study version 7");
assert.equal(qa.syncEndpoint, "/api/study/sync", "Client should target the same-origin Sites sync API");
assert.ok(qa.eventHasStableId, "Behavior events need stable IDs for idempotent database writes");
assert.match(qa.participantId, /^P-\d{8}-[A-F0-9]{24}$/, "Participant IDs need a high-entropy suffix");
assert.equal(qa.stateContainsSessionToken, false, "The anonymous session token must not enter the synced/exported study state");
assert.ok(qa.balanceCheck, "Each stable Task 3 question must reverse A/B positions between layout arms");

const task3Rows = qa.sampleAnswerRows.slice(1).filter(row => row[3] === "Task 3");
assert.equal(task3Rows.length, 24, "Task 3 must export visual comfort and understanding as separate rows");
for (const row of task3Rows) {
  const metadata = JSON.parse(row[7]);
  assert.ok(metadata.displayAType && metadata.displayBType, "Task 3 metadata must contain the actual displayed designs");
  assert.ok(metadata.canonicalAType && metadata.canonicalBType, "Task 3 metadata must preserve the fixed canonical pair");
  assert.ok([true, false].includes(metadata.sideSwapped), "Task 3 metadata must record whether sides were swapped");
}

for (const item of qa.structureMarkup) {
  const className = item.type === "list" ? "phone-list-item" : item.type === "network" ? "phone-node" : item.type === "tree" ? "tree-leaf" : "phone-cluster-item";
  const count = (item.html.match(new RegExp(`class=\\"${className}\\"`, "g")) || []).length;
  assert.equal(count, item.count, `${item.type}-${item.count} should render ${item.count} episode nodes`);
}

console.log("Smoke checks passed: secure participant IDs, balanced Task 3 sides, separate Task 3 measures, 12 stages, and no open-ended text areas.");
