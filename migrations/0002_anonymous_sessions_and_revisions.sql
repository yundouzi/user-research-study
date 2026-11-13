ALTER TABLE participants ADD COLUMN session_hash TEXT;
ALTER TABLE participants ADD COLUMN revision INTEGER NOT NULL DEFAULT 0;
ALTER TABLE participants ADD COLUMN last_sync_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_participants_session_hash
  ON participants(session_hash)
  WHERE session_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS anonymous_sessions (
  session_hash TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL UNIQUE,
  layout_arm INTEGER NOT NULL CHECK (layout_arm IN (0, 1)),
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_anonymous_sessions_last_seen
  ON anonymous_sessions(last_seen_at);
