"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { webcrypto } = require("node:crypto");

const workerPath = path.resolve(__dirname, "..", "_worker.js");
const source = fs.readFileSync(workerPath, "utf8").replace("export default {", "globalThis.__worker = {");
const context = {
  console,
  Response,
  Request,
  Headers,
  URL,
  Date,
  JSON,
  TextEncoder,
  Uint8Array,
  crypto: webcrypto
};
vm.createContext(context);
vm.runInContext(source, context, { filename: "_worker.js" });
const worker = context.__worker;

function mockDatabase() {
  const calls = [];
  const sessions = new Map();
  const participants = new Map();
  const task3Answers = [];
  const task2dAnswers = [];

  function statement(sql) {
    return {
      sql,
      values: [],
      bind(...values) { this.values = values; return this; },
      async first() {
        const normalized = this.sql.replace(/\s+/g, " ");
        if (normalized.includes("FROM anonymous_sessions")) {
          if (normalized.includes("OR participant_id")) {
            return sessions.get(this.values[0]) || [...sessions.values()].find(item => item.participant_id === this.values[1]) || null;
          }
          return sessions.get(this.values[0]) || null;
        }
        if (normalized.includes("FROM participants WHERE participant_id")) {
          return participants.get(this.values[0]) || null;
        }
        return null;
      },
      async all() {
        if (this.sql.includes("WHERE stage = 'Task 3'")) return { results: task3Answers };
        if (this.sql.includes("WHERE stage = 'Task 2-D'")) return { results: task2dAnswers };
        return { results: [] };
      },
      async run() {
        const normalized = this.sql.replace(/\s+/g, " ");
        if (normalized.includes("INSERT INTO anonymous_sessions")) {
          const [session_hash, participant_id, layout_arm, content_arm, created_at, last_seen_at] = this.values;
          if (sessions.has(session_hash) || [...sessions.values()].some(item => item.participant_id === participant_id)) throw new Error("unique");
          sessions.set(session_hash, { session_hash, participant_id, layout_arm, content_arm, created_at, last_seen_at });
        }
        return { success: true };
      }
    };
  }

  return {
    calls,
    sessions,
    participants,
    task3Answers,
    task2dAnswers,
    prepare(sql) {
      const prepared = statement(sql);
      calls.push(prepared);
      return prepared;
    },
    async batch(statements) {
      for (const item of statements) {
        const normalized = item.sql.replace(/\s+/g, " ");
        if (normalized.includes("INSERT INTO participants")) {
          const [participant_id, study_version, current_step, created_at, updated_at, completed_at, state_json, session_hash, last_sync_id] = item.values;
          if (participants.has(participant_id)) throw new Error("unique");
          participants.set(participant_id, { participant_id, study_version, current_step, created_at, updated_at, completed_at, state_json, session_hash, revision: 1, last_sync_id });
        }
        if (normalized.includes("UPDATE participants SET")) {
          const [study_version, current_step, updated_at, completed_at, state_json, last_sync_id, participant_id, session_hash, baseRevision] = item.values;
          const current = participants.get(participant_id);
          if (current && current.session_hash === session_hash && current.revision === baseRevision) {
            participants.set(participant_id, { ...current, study_version, current_step, updated_at, completed_at, state_json, revision: current.revision + 1, last_sync_id });
          }
        }
      }
      return statements.map(() => ({ success: true }));
    }
  };
}

function participantRequest(url, token, body) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Participant ${token}` },
    body: JSON.stringify(body)
  });
}

(async () => {
  const DB = mockDatabase();
  const env = {
    DB,
    RESEARCHER_EXPORT_TOKEN: "test-token",
    ASSETS: { fetch: async () => new Response("site", { headers: { "content-type": "text/plain" } }) }
  };

  const health = await worker.fetch(new Request("https://example.test/api/health"), env);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true, database: true });

  const unauthorizedExport = await worker.fetch(new Request("https://example.test/api/research/answers.csv"), env);
  assert.equal(unauthorizedExport.status, 401, "Aggregate exports must require server-side authorization");

  const token = "10" + "ab".repeat(31);
  const participantId = "P-20261113-0123456789ABCDEF01234567";
  const session = await worker.fetch(participantRequest("https://example.test/api/study/session", token, {
    participantId,
    studyVersion: 8,
    layoutArm: 0,
    contentArm: 1
  }), env);
  assert.equal(session.status, 201, "A cryptographic anonymous session should be created before data writes");
  assert.equal((await session.json()).layoutArm, 0);

  const payload = {
    requestId: "0123456789abcdef0123456789abcdef",
    baseRevision: 0,
    participantId,
    studyVersion: 8,
    currentStep: "needs",
    createdAt: new Date().toISOString(),
    completedAt: null,
    state: { step: "needs" },
    answers: [{ question_id: "T1-01", stage: "Task 1", measure: "choice", response: "A", duration_ms: 1200, metadata: "" }],
    events: [{ id: `${participantId}-1`, sequence: 1, step: "needs", type: "choice", target: "A", timestamp: new Date().toISOString(), epochMs: Date.now(), payload: {} }]
  };
  const synced = await worker.fetch(participantRequest("https://example.test/api/study/sync", token, payload), env);
  assert.equal(synced.status, 200);
  assert.equal((await synced.json()).revision, 1);
  assert.ok(DB.calls.some(call => call.sql.includes("session_hash")), "Participant writes must be bound to the anonymous session hash");
  assert.ok(DB.calls.some(call => call.sql.includes("last_sync_id")), "Writes must use an idempotency key");

  const duplicate = await worker.fetch(participantRequest("https://example.test/api/study/sync", token, payload), env);
  assert.equal(duplicate.status, 200);
  assert.equal((await duplicate.json()).duplicate, true, "A retried request must not duplicate answers or events");

  const stale = await worker.fetch(participantRequest("https://example.test/api/study/sync", token, {
    ...payload,
    requestId: "fedcba9876543210fedcba9876543210",
    baseRevision: 0
  }), env);
  assert.equal(stale.status, 409, "A stale browser state must not overwrite a newer database revision");

  const attackerToken = "20" + "cd".repeat(31);
  const attacker = await worker.fetch(participantRequest("https://example.test/api/study/sync", attackerToken, {
    ...payload,
    requestId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    baseRevision: 1
  }), env);
  assert.equal(attacker.status, 401, "Knowing a participant ID is insufficient to overwrite its record");

  const metadata = JSON.stringify({
    displayAType: "network", displayACount: 10, displayBType: "list", displayBCount: 5,
    canonicalAType: "list", canonicalACount: 5, canonicalBType: "network", canonicalBCount: 10,
    sideSwapped: true, layoutArm: 1
  });
  DB.task3Answers.push(
    { participant_id: participantId, study_version: 8, question_id: "T3-01", measure: "visual_comfort_choice", response: "A", duration_ms: 1400, metadata },
    { participant_id: participantId, study_version: 8, question_id: "T3-01", measure: "understanding_choice", response: "B", duration_ms: 1400, metadata }
  );
  const task3Export = await worker.fetch(new Request("https://example.test/api/research/task3.csv", {
    headers: { authorization: "Bearer test-token" }
  }), env);
  assert.equal(task3Export.status, 200);
  const task3Csv = await task3Export.text();
  assert.match(task3Csv, /visual_comfort_choice/);
  assert.match(task3Csv, /understanding_choice/);
  assert.match(task3Csv, /display_a_type/);
  assert.match(task3Csv, /"network"/);

  const task2dMetadata = JSON.stringify({ experimentArm:"A", featureType:"transcript", featureEnabled:true, featureOpened:true, featureMaterialReady:true, audioStartTime:"2026-01-01T00:00:00.000Z", q1DurationMs:500, q2DurationMs:700, trialTotalDurationMs:90000, playbackCount:2, playbackSeekEvents:[], featureUsageEvents:[{action:"open"}] });
  DB.task2dAnswers.push(
    { participant_id:participantId, study_version:8, question_id:"T2-D02", measure:"q1_answer", response:"A", duration_ms:500, metadata:task2dMetadata },
    { participant_id:participantId, study_version:8, question_id:"T2-D02", measure:"q1_correct", response:"true", duration_ms:500, metadata:task2dMetadata },
    { participant_id:participantId, study_version:8, question_id:"T2-D02", measure:"q2_answer", response:"A", duration_ms:700, metadata:task2dMetadata },
    { participant_id:participantId, study_version:8, question_id:"T2-D02", measure:"q2_correct", response:"true", duration_ms:700, metadata:task2dMetadata },
    { participant_id:participantId, study_version:8, question_id:"T2-D02", measure:"q3_ease_rating", response:"6", duration_ms:90000, metadata:task2dMetadata }
  );
  for (const kind of ["task2d-raw", "task2d-summary"]) {
    const response = await worker.fetch(new Request(`https://example.test/api/research/${kind}.csv`, { headers:{ authorization:"Bearer test-token" } }), env);
    assert.equal(response.status, 200);
    const body = await response.text();
    assert.match(body, /T2-D02/);
    assert.match(body, /transcript/);
  }

  for (const flag of [false, true, undefined]) {
    const rows = [];
    for (const stage of ["Task 2-D", "Task 3"]) {
      for (const answered of ["full", "partial", "empty"]) {
        const question_id = `${stage}-${answered}`;
        const trial = { questionId: question_id };
        if (flag !== undefined) trial.timedOut = flag;
        const meta = stage === "Task 2-D" && flag !== undefined ? { timedOut: flag } : {};
        const state_json = JSON.stringify({ answers: { structureTrials: { 0: trial } } });
        for (const measure of stage === "Task 2-D" ? ["q1_answer", "q1_correct", "q2_answer", "q2_correct", "q3_ease_rating"] : ["visual_comfort_choice", "understanding_choice"]) {
          const response = answered === "empty" || (answered === "partial" && measure.startsWith("q2")) ? "" : "A";
          rows.push({ participant_id: "test", study_version: "v", question_id, stage, measure, response, duration_ms: 60000, metadata: JSON.stringify(meta), state_json });
        }
      }
    }
    rows.push({ participant_id: "test", question_id: "T1-01", stage: "Task 1", metadata: "{}" });
    context.testAnswerRows = rows;
    const csvOutput = await vm.runInContext('exportAnswers({ DB: { prepare: () => ({ all: async () => ({ results: testAnswerRows }) }) } })', context);
    const expectedFlag = flag === undefined ? "unknown" : String(flag);
    const lines = csvOutput.trim().split(/\r?\n/);
    assert.match(lines[0], /"metadata","timed_out"$/);
    for (const line of lines.slice(1, -1)) assert.ok(line.endsWith(',"' + expectedFlag + '"'));
    assert.ok(lines.at(-1).endsWith(',""'), "Untimed questions must have a blank flag");
  }

  const asset = await worker.fetch(new Request("https://example.test/index.html"), env);
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), "site");
  assert.equal(asset.headers.get("x-content-type-options"), "nosniff");

  const migration1 = fs.readFileSync(path.resolve(__dirname, "..", "migrations", "0001_research_data.sql"), "utf8");
  const migration2 = fs.readFileSync(path.resolve(__dirname, "..", "migrations", "0002_anonymous_sessions_and_revisions.sql"), "utf8");
  const migration3 = fs.readFileSync(path.resolve(__dirname, "..", "migrations", "0003_task2d_arm.sql"), "utf8");
  for (const table of ["participants", "answers", "events"]) assert.match(migration1, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  assert.match(migration2, /CREATE TABLE IF NOT EXISTS anonymous_sessions/);
  assert.match(migration2, /revision INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration3, /content_arm INTEGER NOT NULL/);

  console.log("Worker checks passed: anonymous authorization, idempotent retry, stale-write rejection, explicit Task 3 export, static fallback, and migrations.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
