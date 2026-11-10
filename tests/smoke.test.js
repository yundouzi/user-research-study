"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

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
  scrollTo() {},
  confirm: () => true,
  YZH_STUDY_MATERIALS: { audioSources: ["", "", "", "", ""] }
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

const sourcePath = path.resolve(__dirname, "..", "app.js");
const source = fs.readFileSync(sourcePath, "utf8");
const instrumentation = `
globalThis.__qa = {
  steps: [...STEPS],
  fieldCount: INFORMATION_FIELDS.length,
  contentTrialCount: CONTENT_TRIALS.length,
  episodeCount: STRUCTURE_EPISODES.length,
  conditions: [...state.structureConditions],
  stepMarkup: STEPS.map(step => {
    state.step = step;
    if (step === "contentTrial") state.contentIndex = 0;
    if (step === "structureTrial") state.structureIndex = 0;
    return { step, html: RENDERERS[step]() };
  }),
  structureMarkup: [5, 10, 15].flatMap(count => Object.keys(STRUCTURE_TYPES).map(type => ({ type, count, html: structureHTML(type, count) }))),
  fieldValuesComplete: EPISODES.every(episode => INFORMATION_FIELDS.every(([field]) => Boolean(fieldValue(episode, field))))
};`;

vm.runInContext(`${source}\n${instrumentation}`, context, { filename: "app.js" });
const qa = context.__qa;

assert.equal(qa.steps.length, 12, "Expected 12 study stages");
assert.equal(qa.fieldCount, 13, "Expected 13 information fields");
assert.equal(qa.contentTrialCount, 5, "Expected five within-episode trials");
assert.ok(qa.episodeCount >= 15, "Expected at least 15 structure episodes");
assert.equal(qa.conditions.length, 12, "Expected twelve structure conditions");
assert.equal(new Set(qa.conditions.map(item => `${item.type}-${item.count}`)).size, 12, "Structure conditions must be unique");
assert.ok(qa.stepMarkup.every(item => item.html && !item.html.includes("undefined")), "Every stage must render without undefined content");
assert.ok(qa.stepMarkup.every(item => !item.html.includes("<textarea")), "Participant stages must not contain open-ended text areas");
assert.ok(qa.fieldValuesComplete, "Every reveal field must have a value for every episode");

for (const item of qa.structureMarkup) {
  const className = item.type === "list" ? "phone-list-item" : item.type === "network" ? "phone-node" : item.type === "tree" ? "tree-leaf" : "phone-cluster-item";
  const count = (item.html.match(new RegExp(`class=\\"${className}\\"`, "g")) || []).length;
  assert.equal(count, item.count, `${item.type}-${item.count} should render ${item.count} episode nodes`);
}

console.log("Smoke checks passed: 12 stages, 13 fields, 5 content trials, 12 structure conditions, and no open-ended text areas.");
