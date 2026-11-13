"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const workerPath = path.resolve(__dirname, "..", "_worker.js");
const source = fs.readFileSync(workerPath, "utf8").replace("export default {", "globalThis.__worker = {");
const context = { console, Response, Request, Headers, URL, Date, JSON };
vm.createContext(context);
vm.runInContext(source, context, { filename: "_worker.js" });
const worker = context.__worker;

function mockDatabase() {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) { this.values = values; return this; },
        async all() { return { results: [] }; }
      };
      calls.push(statement);
      return statement;
    },
    async batch(statements) { return statements.map(() => ({ success: true })); }
  };
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

  const unauthorized = await worker.fetch(new Request("https://example.test/api/research/answers.csv"), env);
  assert.equal(unauthorized.status, 401, "Aggregate exports must require server-side authorization");

  const authorized = await worker.fetch(new Request("https://example.test/api/research/answers.csv", {
    headers: { authorization: "Bearer test-token" }
  }), env);
  assert.equal(authorized.status, 200);
  assert.match(await authorized.text(), /participant_id/);

  const payload = {
    participantId: "P-20261113-AB12",
    studyVersion: 6,
    currentStep: "needs",
    createdAt: new Date().toISOString(),
    completedAt: null,
    state: { step: "needs" },
    answers: [{ question_id: "T1-01", stage: "Task 1", measure: "choice", response: "A", duration_ms: 1200, metadata: "" }],
    events: [{ id: "P-20261113-AB12-1", sequence: 1, step: "needs", type: "choice", target: "A", timestamp: new Date().toISOString(), epochMs: Date.now(), payload: {} }]
  };
  const synced = await worker.fetch(new Request("https://example.test/api/study/sync", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  }), env);
  assert.equal(synced.status, 200);
  assert.ok(DB.calls.some(call => call.sql.includes("INSERT INTO participants")));
  assert.ok(DB.calls.some(call => call.sql.includes("INSERT INTO answers")));
  assert.ok(DB.calls.some(call => call.sql.includes("INSERT INTO events")));

  const asset = await worker.fetch(new Request("https://example.test/index.html"), env);
  assert.equal(asset.status, 200);
  assert.equal(await asset.text(), "site");
  assert.equal(asset.headers.get("x-content-type-options"), "nosniff");

  const migration = fs.readFileSync(path.resolve(__dirname, "..", "migrations", "0001_research_data.sql"), "utf8");
  for (const table of ["participants", "answers", "events"]) {
    assert.match(migration, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}`));
  }

  console.log("Worker checks passed: authorized aggregate exports, D1 sync statements, static fallback, and migration tables.");
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
