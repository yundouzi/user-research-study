"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");
const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
let clock = 1000000;
const storage = new Map();
const handlers = {};
function element() {
  return { style: {}, classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, setAttribute() {}, focus() {}, showModal() {}, close() {},
    scrollIntoView() {}, click() {}, innerHTML: "", textContent: "", value: "",
    querySelector() { return element(); }, querySelectorAll() { return []; } };
}
const elements = new Map();
const context = {
  console, Date: class extends Date { static now() { return clock; } }, Math, JSON,
  crypto: webcrypto, TextEncoder, Blob, Uint8Array, CSS: { escape: String },
  FormData: class {
    constructor(form) { this.data = form.data || {}; }
    get(key) { const value = this.data[key]; return Array.isArray(value) ? value[0] : value ?? null; }
    getAll(key) { const value = this.data[key]; return value == null ? [] : Array.isArray(value) ? value : [value]; }
    entries() { return Object.entries(this.data)[Symbol.iterator](); }
  },
  URL: { createObjectURL: () => "blob:test", revokeObjectURL() {} },
  localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
  document: {
    querySelector(selector) { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); },
    querySelectorAll: () => [], createElement: element, head: { appendChild() {} },
    addEventListener(type, callback) { (handlers[type] ||= []).push(callback); }
  },
  setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
  addEventListener() {}, scrollTo() {}, confirm: () => true,
  location: { protocol: "file:" }, navigator: {}, YZH_STUDY_MATERIALS: { audioSources: [] }
};
context.window = context;
vm.createContext(context);
vm.runInContext(source, context);
const run = code => vm.runInContext(code, context);
// Rendering and media are outside this recording simulation. Keep real navigation, save,
// submit handlers, completion functions and CSV generation; drive them with a fake clock.
run('render = () => {}; validateScale = () => true;');
function target(id, data = {}) { return { ...element(), id, data, closest: () => null, matches: () => false }; }
function submit(id, data) { for (const cb of handlers.submit) cb({ target: target(id, data), preventDefault() {} }); }
function click(id) { for (const cb of handlers.click) cb({ target: target(id), preventDefault() {} }); }
function rows() { return JSON.parse(run('JSON.stringify(answerRows().slice(1))')); }
function change(name, value) {
  for (const cb of handlers.change) cb({ target: { ...target(""), name, value }, preventDefault() {} });
}
run('goTo("profile")'); clock += 9000;
submit("profileForm", { gender: "female", age: "25", listeningFrequency: "almostDaily", platforms: ["xiaoyuzhou"], podcastTypes: ["society"], listeningScenes: ["commute"], creationExperience: "no", showFamiliarity: "never" });
assert.equal(run('state.answers.profile.durationMs'), 9000);
assert.equal(rows().filter(r => r[3] === "Pre-interview").length, 9);
assert.ok(rows().filter(r => r[3] === "Pre-interview").every(r => r[6] === 9000 && r[8] === ""));
for (let i = 0; i < 8; i++) {
  clock += (i + 1) * 1000;
  const q = run(`TASK_ONE_QUESTIONS[${i}]`);
  submit("needsQuestionForm", { [q.key]: q.type === "checkbox" ? [q.options[0][0]] : q.options[0][0] });
}
const needs = rows().filter(r => r[3] === "Task 1");
assert.deepEqual(needs.map(r => r[6]), [1000, 2000, 3000, 4000, 5000, 6000, 7000, 8000]);
assert.ok(needs.every(r => r[5] && r[8] === ""));
run('state.needsResponses.refindFrequency = "often"');
assert.equal(rows().find(r => r[4] === "refind_frequency")[5], "often", "Export saved per-question answers even before the final task submission");
run('delete state.needsQuestionDurations[3]');
assert.equal(rows().find(r => r[4] === "information_need")[6], "", "Never substitute whole-task duration for an unknown per-question time");
run('state.infoRanking = RANKING_FIELDS.map(f => f.id)'); clock += 4000; click("rankSubmit");
assert.equal(rows().filter(r => r[4] === "information_rank").length, 9);
assert.equal(run('state.answers.infoRanking.durationMs'), 4000);
assert.ok(run('state.answers.infoRanking.completedAt'));
run('state.selectedFields = ["duration", "topic_tags"]; state.selectedEpisode = EPISODES[0].id'); clock += 5000; click("infoRevealSubmit");
assert.equal(run('state.answers.infoReveal.durationMs'), 5000);
assert.deepEqual(JSON.parse(run('JSON.stringify(state.answers.infoReveal.fieldIds)')), ["duration", "topic_tags"]);
// Simulate all five timed content trials, mixing normal/partial/empty completions.
run('state.contentIndex = 0; state.answers.contentTrials = {}; goTo("contentTrial");');
for (let i = 0; i < 5; i++) {
  run('renderContentTrial()');
  const full = i % 3 === 0, partial = i % 3 === 1;
  clock += 10000; if (full || partial) change("contentQ1", "B");
  clock += 10000; if (full) change("contentQ2", "C");
  elements.get("#contentRatingForm") || context.document.querySelector("#contentRatingForm");
  elements.get("#contentRatingForm").data = full ? { contentQ1: "B", contentQ2: "C", contentEase: "5" } : partial ? { contentQ1: "B" } : {};
  if (!full) clock += 100000;
  run(`completeContentTrial(${!full})`);
  const trial = JSON.parse(run(`JSON.stringify(state.answers.contentTrials[${i}])`));
  assert.equal(trial.timedOut, !full);
  assert.equal(trial.trialTotalDurationMs, full ? 20000 : 120000);
  assert.equal(trial.q1DurationMs, full || partial ? 10000 : null);
  assert.equal(trial.q2DurationMs, full ? 20000 : null);
  assert.equal(trial.q1Correct, full || partial ? "B" === run(`CONTENT_TRIALS[${i}].q1.correct`) : null);
  assert.equal(trial.q2Correct, full ? "C" === run(`CONTENT_TRIALS[${i}].q2.correct`) : null);
  assert.equal(trial.q3EaseRating, full ? 5 : null);
  const exported = rows().filter(r => r[2] === trial.trialId);
  assert.ok(exported.every(r => r[8] === !full));
  if (!full) assert.equal(exported.find(r => r[4] === "q2_correct")[5], "");
}
assert.equal(rows().filter(r => r[3] === "Task 2-D").length, 25);
// All 12 structure comparisons preserve actual pairs, flags and per-trial totals.
run('state.structureIndex = 0; state.structureDeadlines = {}; state.answers.structureTrials = {}; goTo("structureTrial")');
for (let i = 0; i < 12; i++) {
  run('renderStructureTrial()');
  const timeout = i % 3 !== 0;
  clock += timeout ? 60000 : 15000;
  run(`completeStructureTrial(${timeout}, ${i % 3 === 2 ? '{}' : i % 3 === 1 ? '{ visualChoice: "A" }' : '{ visualChoice: "A", understandingChoice: "B" }'})`);
  assert.equal(run(`state.answers.structureTrials[${i}].durationMs`), timeout ? 60000 : 15000);
  assert.equal(run(`state.answers.structureTrials[${i}].timedOut`), timeout);
  assert.equal(run(`state.answers.structureTrials[${i}].aType === state.structureComparisons[${i}].a.type`), true);
}
assert.equal(rows().filter(r => r[3] === "Task 3").length, 24);
assert.equal(run('state.step'), "interview");
// Verify persisted clocks survive a storage reload, and characterize existing edge cases.
run('state.step = "needs"; state.needsIndex = 0; state.pageEnteredAt = Date.now(); save({sync:false})');
clock += 6000; run('state = loadState()'); assert.equal(run('pageDuration()'), 6000);
run('state.step = "contentTrial"; state.contentIndex = 0; state.contentDeadlines = {}; state.contentTrialPageStarts = {}; renderContentTrial(); save({sync:false})');
const deadline = run('state.contentDeadlines[0]'); clock += 3000;
run('state = loadState(); renderContentTrial()'); assert.equal(run('state.contentDeadlines[0]'), deadline);

// Completed trials remain unchanged when revisited or submitted again.
const originalStructure = run('JSON.stringify(state.answers.structureTrials[0])');
run('state.step = "structureTrial"; state.structureIndex = 1; state.structureDrafts = {}; goBack(); bindStructureTrialTimer(); completeStructureTrial(true, {})');
assert.equal(run('JSON.stringify(state.answers.structureTrials[0])'), originalStructure);
const originalContent = run('JSON.stringify(state.answers.contentTrials[0])');
run('state.step = "contentTrial"; state.contentIndex = 0; bindContentTrialTimer(); completeContentTrial(true)');
assert.equal(run('JSON.stringify(state.answers.contentTrials[0])'), originalContent);
// An expired new content trial uses true even when the manual submit beats the callback.
run('state.step = "contentTrial"; state.contentIndex = 2; delete state.answers.contentTrials[2]; state.contentTrialPageStarts[2] = Date.now() - 120500; state.contentDeadlines[2] = Date.now() - 500;');
elements.get("#contentRatingForm").data = {};
run('completeContentTrial(false)');
assert.equal(run('state.answers.contentTrials[2].timedOut'), true);
assert.equal(run('state.answers.contentTrials[2].trialTotalDurationMs'), 120000);
assert.equal(run('state.answers.contentTrials[2].wallDurationMs'), 120500);
assert.ok(rows().filter(r => r[2] === "T2-D03").every(r => r[8] === true && (r[5] === "" || r[5] == null)));
run('state.step = "structureTrial"; state.structureIndex = 2; delete state.answers.structureTrials[2]; state.structureDeadlines[2] = Date.now() - 1000; completeStructureTrial(false, {})');
assert.equal(run('state.answers.structureTrials[2].timedOut'), true);
// Draft inputs survive storage reload and restore both radio selection and rating.
run('state.step = "contentTrial"; state.contentIndex = 1; delete state.answers.contentTrials[1]; state.contentDrafts = {};');
change("contentQ1", "B"); run('setScale("contentEase", 6); save({sync:false}); state = loadState()');
assert.equal(run('state.contentDrafts[1].contentQ1'), "B");
assert.equal(run('state.contentDrafts[1].contentEase'), "6");
const draftInputs = [{ name: "contentQ1", type: "radio", value: "B", checked: false }, { name: "contentEase", type: "hidden", value: "" }];
elements.get("#contentRatingForm").querySelectorAll = () => draftInputs;
run('restoreFormDraft("#contentRatingForm", state.contentDrafts[1])');
assert.equal(draftInputs[0].checked, true);
assert.equal(draftInputs[1].value, "6");
// Researcher pauses exclude review time, and preview cannot complete or overwrite trials.
run('state.step = "contentTrial"; state.contentIndex = 1; state.pageEnteredAt = Date.now(); state.contentTrialPageStarts[1] = Date.now(); state.contentDeadlines[1] = Date.now()+120000; state.contentQuestionTimes[1] = { shownAt: Date.now(), q1AnsweredAt: Date.now()+1000 }; beginResearchReview();');
const before = run('state.contentDeadlines[1]');
clock += 30000;
const jump = target("");
jump.closest = selector => selector === "[data-research-jump]" ? { dataset: { researchJump: "structureTrial" } } : null;
for (const callback of handlers.click) callback({ target: jump, preventDefault() {} });
const answersBeforePreview = run('JSON.stringify(state.answers)');
run('completeStructureTrial(true, {}); completeContentTrial(true)');
assert.equal(run('JSON.stringify(state.answers)'), answersBeforePreview);
run('endResearchReview()');
assert.equal(run('state.step'), "contentTrial");
assert.equal(run('state.contentIndex'), 1);
assert.equal(run('state.contentDeadlines[1]'), before + 30000);
assert.equal(run('pageDuration()'), 0);
assert.equal(run('state.contentQuestionTimes[1].q1AnsweredAt - state.contentQuestionTimes[1].shownAt'), 1000);
console.log("Recording regression checks passed: completed trials immutable, expired manual submission flagged, drafts restored, researcher preview isolated and pause excluded.");
// Participant navigation pauses only the unfinished trial's effective timer.
run('state.step = "contentTrial"; state.contentIndex = 3; delete state.answers.contentTrials[3]; state.contentTrialPageStarts[3] = Date.now(); state.contentDeadlines[3] = Date.now()+120000; state.contentQuestionTimes[3] = { shownAt: Date.now() };');
const contentDeadlineBeforeLeave = run('state.contentDeadlines[3]');
run('goBack()'); clock += 45000;
run('goTo("contentTrial"); state.contentIndex = 3; renderContentTrial()');
assert.equal(run('state.contentDeadlines[3]'), contentDeadlineBeforeLeave + 45000);
run('state.step = "structureTrial"; state.structureIndex = 4; delete state.answers.structureTrials[4]; state.structureDeadlines[4] = Date.now()+60000;');
const structureDeadlineBeforeLeave = run('state.structureDeadlines[4]');
run('goBack()'); clock += 20000;
run('state.structureIndex = 4; renderStructureTrial()');
assert.equal(run('state.structureDeadlines[4]'), structureDeadlineBeforeLeave + 20000);
// Profile draft restoration includes checkbox arrays and free input.
context.document.querySelector("#profileForm").data = { gender: "female", age: "26", platforms: ["xiaoyuzhou", "apple"], podcastTypes: ["society"], listeningScenes: ["commute"] };
run('state.step = "profile"');
for (const callback of handlers.input) callback({ target: { name: "age" } });
run('save({sync:false}); state = loadState()');
assert.equal(run('state.profileDraft.age'), "26");
assert.deepEqual(JSON.parse(run('JSON.stringify(state.profileDraft.platforms)')), ["xiaoyuzhou", "apple"]);
// Complete timestamp and ever-viewed information remain distinct from the final set.
run('endResearchReview(); state.researchPreview = false; goTo("infoReveal"); state.selectedFields = ["duration"]; state.viewedInformationFields = ["duration", "transcript"]; state.selectedEpisode = EPISODES[0].id');
click("infoRevealSubmit");
assert.ok(run('state.answers.infoReveal.completedAt'));
const revealMeta = JSON.parse(rows().find(r => r[2] === "T2-E02")[7]);
assert.deepEqual(revealMeta.selectedFieldIds, ["duration"]);
assert.deepEqual(revealMeta.viewedFieldIds, ["duration", "transcript"]);
console.log("Navigation regression checks passed: unfinished trial timers pause/resume, profile drafts persist, and reveal completion timestamp/view history export correctly.");

run('beginResearchReview(); state.researchPreview = true; renderResearcher()');
assert.equal(run('Boolean(state.researchPreview)'), false, "Returning to researcher controls must exit preview mode");
click("returnParticipant");
assert.equal(run('Boolean(state.researchReview)'), false);
console.log("Researcher return controls remain usable after preview.");
