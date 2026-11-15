const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function csv(rows) {
  return rows.map(row => row.map(csvCell).join(",")).join("\n");
}

function constantTimeEqual(expected, supplied) {
  if (!expected || expected.length !== supplied.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ supplied.charCodeAt(index);
  }
  return difference === 0;
}

function researcherAuthorized(request, env) {
  const expected = String(env.RESEARCHER_EXPORT_TOKEN || "");
  const header = request.headers.get("authorization") || "";
  return constantTimeEqual(expected, header.replace(/^Bearer\s+/i, ""));
}

function participantToken(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.replace(/^Participant\s+/i, "");
  return /^[a-f0-9]{64}$/i.test(token) ? token.toLowerCase() : "";
}

function participantIdIsValid(value) {
  return /^P-\d{8}-[A-F0-9]{24}$/.test(String(value || ""));
}

function textValue(value, maxLength = 4000) {
  return String(value ?? "").slice(0, maxLength);
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

async function sha256Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

async function readPayload(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 2_000_000) throw new Error("payload_too_large");
  return request.json();
}

async function findParticipantSession(request, env) {
  const token = participantToken(request);
  if (!token) return null;
  const sessionHash = await sha256Hex(token);
  const session = await env.DB.prepare(`
    SELECT session_hash, participant_id, layout_arm, content_arm
    FROM anonymous_sessions
    WHERE session_hash = ?
  `).bind(sessionHash).first();
  return session ? { ...session, token, sessionHash } : null;
}

async function createParticipantSession(request, env) {
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  const token = participantToken(request);
  if (!token) return json({ error: "invalid_session_token" }, 401);

  let payload;
  try {
    payload = await readPayload(request);
  } catch (error) {
    return json({ error: error.message === "payload_too_large" ? "payload_too_large" : "invalid_json" }, 400);
  }

  const participantId = textValue(payload.participantId, 48);
  const requestedArm = numberValue(payload.layoutArm);
  const requestedContentArm = numberValue(payload.contentArm);
  const expectedArm = parseInt(token.slice(0, 2), 16) % 2;
  const expectedContentArm = parseInt(token.slice(2, 4), 16) % 2;
  if (!participantIdIsValid(participantId)) return json({ error: "invalid_participant_id" }, 400);
  if (![0, 1].includes(requestedArm) || requestedArm !== expectedArm) return json({ error: "invalid_layout_arm" }, 400);
  if (![0, 1].includes(requestedContentArm) || requestedContentArm !== expectedContentArm) return json({ error: "invalid_content_arm" }, 400);

  const sessionHash = await sha256Hex(token);
  const existing = await env.DB.prepare(`
    SELECT session_hash, participant_id, layout_arm, content_arm
    FROM anonymous_sessions
    WHERE session_hash = ?
  `).bind(sessionHash).first();
  if (existing) {
    if (existing.participant_id !== participantId) return json({ error: "session_participant_mismatch" }, 403);
    await env.DB.prepare("UPDATE anonymous_sessions SET last_seen_at = ? WHERE session_hash = ?")
      .bind(new Date().toISOString(), sessionHash).run();
    const participant = await env.DB.prepare("SELECT revision FROM participants WHERE participant_id = ?").bind(participantId).first();
    return json({ ok: true, participantId, layoutArm: existing.layout_arm, contentArm: existing.content_arm, revision: participant?.revision || 0 });
  }

  const now = new Date().toISOString();
  try {
    await env.DB.prepare(`
      INSERT INTO anonymous_sessions (session_hash, participant_id, layout_arm, content_arm, created_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(sessionHash, participantId, expectedArm, expectedContentArm, now, now).run();
    return json({ ok: true, participantId, layoutArm: expectedArm, contentArm: expectedContentArm, revision: 0 }, 201);
  } catch (error) {
    const collision = await env.DB.prepare(`
      SELECT session_hash, participant_id, layout_arm, content_arm FROM anonymous_sessions
      WHERE session_hash = ? OR participant_id = ?
    `).bind(sessionHash, participantId).first();
    if (collision?.session_hash === sessionHash && collision.participant_id === participantId) {
      return json({ ok: true, participantId, layoutArm: collision.layout_arm, contentArm: collision.content_arm, revision: 0 });
    }
    console.error("anonymous_session_create_failed", error);
    return json({ error: "participant_id_collision" }, 409);
  }
}

function guardedAnswerStatement(env, participantId, requestId, studyVersion, answer, now) {
  return env.DB.prepare(`
    INSERT INTO answers (
      participant_id, study_version, question_id, stage, measure, response, duration_ms, metadata, updated_at
    ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE EXISTS (
      SELECT 1 FROM participants WHERE participant_id = ? AND last_sync_id = ?
    )
  `).bind(
    participantId,
    studyVersion,
    textValue(answer.question_id, 120),
    textValue(answer.stage, 120),
    textValue(answer.measure, 160),
    textValue(answer.response, 12000),
    numberValue(answer.duration_ms),
    textValue(answer.metadata, 12000),
    now,
    participantId,
    requestId
  );
}

function guardedEventStatement(env, participantId, requestId, studyVersion, event, now) {
  const sequence = numberValue(event.sequence);
  const eventId = textValue(event.id || `${participantId}-${sequence}`, 120);
  if (!eventId || sequence === null) return null;
  return env.DB.prepare(`
    INSERT INTO events (
      event_id, participant_id, study_version, sequence, step, event_type, target, timestamp, epoch_ms, payload
    ) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    WHERE EXISTS (
      SELECT 1 FROM participants WHERE participant_id = ? AND last_sync_id = ?
    )
    ON CONFLICT(event_id) DO NOTHING
  `).bind(
    eventId,
    participantId,
    studyVersion,
    sequence,
    textValue(event.step, 80),
    textValue(event.type, 120),
    textValue(event.target, 1000),
    textValue(event.timestamp || now, 64),
    numberValue(event.epochMs) || Date.now(),
    textValue(JSON.stringify(event.payload || {}), 16000),
    participantId,
    requestId
  );
}

async function syncStudy(request, env) {
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  const session = await findParticipantSession(request, env);
  if (!session) return json({ error: "unauthorized_participant_session" }, 401);

  let payload;
  try {
    payload = await readPayload(request);
  } catch (error) {
    return json({ error: error.message === "payload_too_large" ? "payload_too_large" : "invalid_json" }, 400);
  }

  const participantId = textValue(payload.participantId, 48);
  const requestId = textValue(payload.requestId, 64);
  const baseRevision = numberValue(payload.baseRevision);
  if (!participantIdIsValid(participantId)) return json({ error: "invalid_participant_id" }, 400);
  if (participantId !== session.participant_id) return json({ error: "session_participant_mismatch" }, 403);
  if (!/^[a-f0-9]{32}$/i.test(requestId) || baseRevision === null || baseRevision < 0) {
    return json({ error: "invalid_sync_version" }, 400);
  }

  const studyVersion = numberValue(payload.studyVersion) || 0;
  const now = new Date().toISOString();
  const stateJson = JSON.stringify(payload.state || {});
  if (stateJson.length > 1_500_000) return json({ error: "state_too_large" }, 413);

  const current = await env.DB.prepare(`
    SELECT revision, last_sync_id, updated_at
    FROM participants WHERE participant_id = ?
  `).bind(participantId).first();

  if (current?.last_sync_id === requestId) {
    return json({ ok: true, participantId, revision: current.revision, syncedAt: current.updated_at, duplicate: true });
  }
  if ((current?.revision || 0) !== baseRevision) {
    return json({ error: "revision_conflict", revision: current?.revision || 0, updatedAt: current?.updated_at || null }, 409);
  }

  const commonValues = [
    studyVersion,
    textValue(payload.currentStep, 80),
    now,
    payload.completedAt ? textValue(payload.completedAt, 64) : null,
    stateJson,
    requestId
  ];
  const statements = [];
  if (current) {
    statements.push(env.DB.prepare(`
      UPDATE participants SET
        study_version = ?, current_step = ?, updated_at = ?, completed_at = ?, state_json = ?,
        revision = revision + 1, last_sync_id = ?
      WHERE participant_id = ? AND session_hash = ? AND revision = ?
    `).bind(...commonValues, participantId, session.sessionHash, baseRevision));
  } else {
    statements.push(env.DB.prepare(`
      INSERT INTO participants (
        participant_id, study_version, current_step, created_at, updated_at, completed_at, state_json,
        session_hash, revision, last_sync_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `).bind(
      participantId,
      studyVersion,
      textValue(payload.currentStep, 80),
      textValue(payload.createdAt || now, 64),
      now,
      payload.completedAt ? textValue(payload.completedAt, 64) : null,
      stateJson,
      session.sessionHash,
      requestId
    ));
  }

  statements.push(env.DB.prepare(`
    DELETE FROM answers WHERE participant_id = ?
    AND EXISTS (SELECT 1 FROM participants WHERE participant_id = ? AND last_sync_id = ?)
  `).bind(participantId, participantId, requestId));

  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 250) : [];
  for (const answer of answers) statements.push(guardedAnswerStatement(env, participantId, requestId, studyVersion, answer, now));

  const events = Array.isArray(payload.events) ? payload.events.slice(0, 500) : [];
  for (const event of events) {
    const statement = guardedEventStatement(env, participantId, requestId, studyVersion, event, now);
    if (statement) statements.push(statement);
  }

  try {
    await env.DB.batch(statements);
    const saved = await env.DB.prepare(`
      SELECT revision, last_sync_id, updated_at FROM participants WHERE participant_id = ?
    `).bind(participantId).first();
    if (saved?.last_sync_id !== requestId) {
      return json({ error: "revision_conflict", revision: saved?.revision || 0, updatedAt: saved?.updated_at || null }, 409);
    }
    await env.DB.prepare("UPDATE anonymous_sessions SET last_seen_at = ? WHERE session_hash = ?")
      .bind(now, session.sessionHash).run();
    return json({ ok: true, participantId, revision: saved.revision, syncedAt: saved.updated_at });
  } catch (error) {
    console.error("study_sync_failed", error);
    const saved = await env.DB.prepare(`
      SELECT revision, last_sync_id, updated_at FROM participants WHERE participant_id = ?
    `).bind(participantId).first();
    if (saved && saved.last_sync_id !== requestId) {
      return json({ error: "revision_conflict", revision: saved.revision, updatedAt: saved.updated_at }, 409);
    }
    return json({ error: "database_write_failed" }, 500);
  }
}

async function exportAnswers(env) {
  const result = await env.DB.prepare(`
    SELECT participant_id, study_version, question_id, stage, measure, response, duration_ms, metadata
    FROM answers
    ORDER BY participant_id, question_id, measure
  `).all();
  const header = ["participant_id", "study_version", "question_id", "stage", "measure", "response", "duration_ms", "metadata"];
  return csv([header, ...(result.results || []).map(item => header.map(key => item[key]))]);
}

async function exportEvents(env) {
  const result = await env.DB.prepare(`
    SELECT participant_id, study_version, step, event_type, target, timestamp, payload
    FROM events
    ORDER BY participant_id, sequence
  `).all();
  const header = ["participant_id", "study_version", "step", "event_type", "target", "timestamp", "payload"];
  return csv([header, ...(result.results || []).map(item => header.map(key => item[key]))]);
}

function metadataObject(value) {
  try { return JSON.parse(value || "{}"); } catch { return {}; }
}

async function exportTask3(env) {
  const result = await env.DB.prepare(`
    SELECT participant_id, study_version, question_id, measure, response, duration_ms, metadata
    FROM answers
    WHERE stage = 'Task 3' AND measure IN ('visual_comfort_choice', 'understanding_choice')
    ORDER BY participant_id, question_id, measure
  `).all();
  const grouped = new Map();
  for (const item of result.results || []) {
    const key = `${item.participant_id}\u0000${item.question_id}`;
    const row = grouped.get(key) || {
      participant_id: item.participant_id,
      study_version: item.study_version,
      question_id: item.question_id,
      visual_comfort_choice: "",
      understanding_choice: "",
      duration_ms: item.duration_ms,
      metadata: metadataObject(item.metadata)
    };
    row[item.measure] = item.response;
    row.duration_ms = Math.max(Number(row.duration_ms) || 0, Number(item.duration_ms) || 0);
    row.metadata = { ...row.metadata, ...metadataObject(item.metadata) };
    grouped.set(key, row);
  }
  const header = [
    "participant_id", "study_version", "question_id", "visual_comfort_choice", "understanding_choice",
    "display_a_type", "display_a_count", "display_b_type", "display_b_count",
    "canonical_a_type", "canonical_a_count", "canonical_b_type", "canonical_b_count",
    "side_swapped", "layout_arm", "duration_ms"
  ];
  const rows = [header];
  for (const row of grouped.values()) {
    const meta = row.metadata;
    rows.push([
      row.participant_id, row.study_version, row.question_id, row.visual_comfort_choice, row.understanding_choice,
      meta.displayAType, meta.displayACount, meta.displayBType, meta.displayBCount,
      meta.canonicalAType, meta.canonicalACount, meta.canonicalBType, meta.canonicalBCount,
      meta.sideSwapped, meta.layoutArm, row.duration_ms
    ]);
  }
  return csv(rows);
}

async function task2DRows(env) {
  const result = await env.DB.prepare(`
    SELECT participant_id, study_version, question_id, measure, response, duration_ms, metadata
    FROM answers
    WHERE stage = 'Task 2-D'
    ORDER BY participant_id, question_id, measure
  `).all();
  const grouped = new Map();
  for (const item of result.results || []) {
    const key = `${item.participant_id}\u0000${item.question_id}`;
    const row = grouped.get(key) || {
      participant_id: item.participant_id, study_version: item.study_version, trial_id: item.question_id,
      q1_answer: "", q1_correct: "", q2_answer: "", q2_correct: "", q3_ease_rating: "", metadata: {}
    };
    if (Object.hasOwn(row, item.measure)) row[item.measure] = item.response;
    row.metadata = { ...row.metadata, ...metadataObject(item.metadata) };
    grouped.set(key, row);
  }
  return [...grouped.values()];
}

async function exportTask2DRaw(env) {
  const records = await task2DRows(env);
  const header = [
    "participant_id", "study_version", "trial_id", "experiment_arm", "feature_type", "feature_enabled", "feature_opened",
    "feature_material_ready", "audio_start_time", "q1_answer", "q1_correct", "q2_answer", "q2_correct", "q3_ease_rating",
    "q1_duration_ms", "q2_duration_ms", "trial_total_duration_ms", "playback_count", "playback_seek_events", "feature_usage_events"
  ];
  return csv([header, ...records.map(row => {
    const meta = row.metadata;
    return [row.participant_id, row.study_version, row.trial_id, meta.experimentArm, meta.featureType, meta.featureEnabled, meta.featureOpened,
      meta.featureMaterialReady, meta.audioStartTime, row.q1_answer, row.q1_correct, row.q2_answer, row.q2_correct, row.q3_ease_rating,
      meta.q1DurationMs, meta.q2DurationMs, meta.trialTotalDurationMs, meta.playbackCount,
      JSON.stringify(meta.playbackSeekEvents || []), JSON.stringify(meta.featureUsageEvents || [])];
  })]);
}

function booleanNumber(value) {
  return String(value).toLowerCase() === "true" || value === 1 ? 1 : 0;
}

function average(values) {
  const numbers = values.map(Number).filter(Number.isFinite);
  return numbers.length ? numbers.reduce((sum, value) => sum + value, 0) / numbers.length : "";
}

async function exportTask2DSummary(env) {
  const records = await task2DRows(env);
  const groups = new Map();
  for (const row of records) {
    const enabled = booleanNumber(row.metadata.featureEnabled);
    const key = `${row.trial_id}\u0000${enabled}`;
    const group = groups.get(key) || { trial_id: row.trial_id, feature_type: row.metadata.featureType, feature_enabled: enabled, rows: [] };
    group.rows.push(row);
    groups.set(key, group);
  }
  const header = ["trial_id", "feature_type", "feature_enabled", "participant_count", "q1_accuracy", "q2_accuracy", "average_q1_duration_ms", "average_q2_duration_ms", "average_trial_total_duration_ms", "average_ease_rating", "feature_open_rate"];
  const rows = [...groups.values()].sort((a, b) => `${a.trial_id}${a.feature_enabled}`.localeCompare(`${b.trial_id}${b.feature_enabled}`)).map(group => {
    const values = group.rows;
    return [group.trial_id, group.feature_type, group.feature_enabled, values.length,
      average(values.map(item => booleanNumber(item.q1_correct))), average(values.map(item => booleanNumber(item.q2_correct))),
      average(values.map(item => item.metadata.q1DurationMs)), average(values.map(item => item.metadata.q2DurationMs)),
      average(values.map(item => item.metadata.trialTotalDurationMs)), average(values.map(item => item.q3_ease_rating)),
      group.feature_enabled ? average(values.map(item => booleanNumber(item.metadata.featureOpened))) : ""];
  });
  return csv([header, ...rows]);
}

async function handleResearchExport(request, env, kind) {
  if (!researcherAuthorized(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  try {
    const body = kind === "answers" ? await exportAnswers(env)
      : kind === "events" ? await exportEvents(env)
      : kind === "task2d-raw" ? await exportTask2DRaw(env)
      : kind === "task2d-summary" ? await exportTask2DSummary(env)
      : await exportTask3(env);
    return new Response(`\ufeff${body}`, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="yzh-study-${kind}.csv"`,
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    console.error("research_export_failed", error);
    return json({ error: "database_read_failed" }, 500);
  }
}

async function serveStatic(request, env) {
  if (!env.ASSETS?.fetch) return new Response("Not found", { status: 404 });
  const response = await env.ASSETS.fetch(request);
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") return json({ ok: true, database: Boolean(env.DB) });
    if (request.method === "POST" && url.pathname === "/api/study/session") return createParticipantSession(request, env);
    if (request.method === "POST" && url.pathname === "/api/study/sync") return syncStudy(request, env);
    if (request.method === "POST" && url.pathname === "/api/research/authorize") {
      return researcherAuthorized(request, env) ? json({ ok: true }) : json({ error: "unauthorized" }, 401);
    }
    if (request.method === "GET" && url.pathname === "/api/research/answers.csv") return handleResearchExport(request, env, "answers");
    if (request.method === "GET" && url.pathname === "/api/research/events.csv") return handleResearchExport(request, env, "events");
    if (request.method === "GET" && url.pathname === "/api/research/task2d-raw.csv") return handleResearchExport(request, env, "task2d-raw");
    if (request.method === "GET" && url.pathname === "/api/research/task2d-summary.csv") return handleResearchExport(request, env, "task2d-summary");
    if (request.method === "GET" && url.pathname === "/api/research/task3.csv") return handleResearchExport(request, env, "task3");
    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    return serveStatic(request, env);
  }
};
