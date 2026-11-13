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

function authorized(request, env) {
  const expected = String(env.RESEARCHER_EXPORT_TOKEN || "");
  const header = request.headers.get("authorization") || "";
  const supplied = header.replace(/^Bearer\s+/i, "");
  if (!expected || expected.length !== supplied.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected.charCodeAt(index) ^ supplied.charCodeAt(index);
  }
  return difference === 0;
}

function participantIdIsValid(value) {
  return /^P-\d{8}-[A-Z0-9]{4}$/.test(String(value || ""));
}

function textValue(value, maxLength = 4000) {
  return String(value ?? "").slice(0, maxLength);
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.round(number) : null;
}

async function readPayload(request) {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 4_000_000) throw new Error("payload_too_large");
  return request.json();
}

async function syncStudy(request, env) {
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  let payload;
  try {
    payload = await readPayload(request);
  } catch (error) {
    return json({ error: error.message === "payload_too_large" ? "payload_too_large" : "invalid_json" }, 400);
  }

  const participantId = textValue(payload.participantId, 32);
  if (!participantIdIsValid(participantId)) return json({ error: "invalid_participant_id" }, 400);

  const studyVersion = numberValue(payload.studyVersion) || 0;
  const now = new Date().toISOString();
  const stateJson = JSON.stringify(payload.state || {});
  if (stateJson.length > 3_500_000) return json({ error: "state_too_large" }, 413);

  const statements = [
    env.DB.prepare(`
      INSERT INTO participants (
        participant_id, study_version, current_step, created_at, updated_at, completed_at, state_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(participant_id) DO UPDATE SET
        study_version = excluded.study_version,
        current_step = excluded.current_step,
        updated_at = excluded.updated_at,
        completed_at = excluded.completed_at,
        state_json = excluded.state_json
    `).bind(
      participantId,
      studyVersion,
      textValue(payload.currentStep, 80),
      textValue(payload.createdAt || now, 64),
      now,
      payload.completedAt ? textValue(payload.completedAt, 64) : null,
      stateJson
    ),
    env.DB.prepare("DELETE FROM answers WHERE participant_id = ?").bind(participantId)
  ];

  const answers = Array.isArray(payload.answers) ? payload.answers.slice(0, 250) : [];
  for (const answer of answers) {
    statements.push(env.DB.prepare(`
      INSERT INTO answers (
        participant_id, study_version, question_id, stage, measure, response, duration_ms, metadata, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      participantId,
      studyVersion,
      textValue(answer.question_id, 120),
      textValue(answer.stage, 120),
      textValue(answer.measure, 160),
      textValue(answer.response, 12000),
      numberValue(answer.duration_ms),
      textValue(answer.metadata, 12000),
      now
    ));
  }

  const events = Array.isArray(payload.events) ? payload.events.slice(-1500) : [];
  for (const event of events) {
    const sequence = numberValue(event.sequence);
    const eventId = textValue(event.id || `${participantId}-${sequence}`, 96);
    if (!eventId || sequence === null) continue;
    statements.push(env.DB.prepare(`
      INSERT INTO events (
        event_id, participant_id, study_version, sequence, step, event_type, target, timestamp, epoch_ms, payload
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      textValue(JSON.stringify(event.payload || {}), 16000)
    ));
  }

  try {
    await env.DB.batch(statements);
    return json({ ok: true, participantId, syncedAt: now });
  } catch (error) {
    console.error("study_sync_failed", error);
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
  const rows = [header, ...(result.results || []).map(item => header.map(key => item[key]))];
  return csv(rows);
}

async function exportEvents(env) {
  const result = await env.DB.prepare(`
    SELECT participant_id, study_version, step, event_type, target, timestamp, payload
    FROM events
    ORDER BY participant_id, sequence
  `).all();
  const header = ["participant_id", "study_version", "step", "event_type", "target", "timestamp", "payload"];
  const rows = [header, ...(result.results || []).map(item => header.map(key => item[key]))];
  return csv(rows);
}

async function handleResearchExport(request, env, kind) {
  if (!authorized(request, env)) return json({ error: "unauthorized" }, 401);
  if (!env.DB) return json({ error: "database_not_configured" }, 503);
  try {
    const body = kind === "answers" ? await exportAnswers(env) : await exportEvents(env);
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
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({ ok: true, database: Boolean(env.DB) });
    }
    if (request.method === "POST" && url.pathname === "/api/study/sync") {
      return syncStudy(request, env);
    }
    if (request.method === "POST" && url.pathname === "/api/research/authorize") {
      return authorized(request, env) ? json({ ok: true }) : json({ error: "unauthorized" }, 401);
    }
    if (request.method === "GET" && url.pathname === "/api/research/answers.csv") {
      return handleResearchExport(request, env, "answers");
    }
    if (request.method === "GET" && url.pathname === "/api/research/events.csv") {
      return handleResearchExport(request, env, "events");
    }
    if (url.pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    return serveStatic(request, env);
  }
};
