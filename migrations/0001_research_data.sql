CREATE TABLE IF NOT EXISTS participants (
  participant_id TEXT PRIMARY KEY,
  study_version INTEGER NOT NULL,
  current_step TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  state_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS answers (
  participant_id TEXT NOT NULL,
  study_version INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  stage TEXT NOT NULL,
  measure TEXT NOT NULL,
  response TEXT,
  duration_ms INTEGER,
  metadata TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (participant_id, question_id, measure),
  FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  participant_id TEXT NOT NULL,
  study_version INTEGER NOT NULL,
  sequence INTEGER NOT NULL,
  step TEXT NOT NULL,
  event_type TEXT NOT NULL,
  target TEXT,
  timestamp TEXT NOT NULL,
  epoch_ms INTEGER NOT NULL,
  payload TEXT,
  FOREIGN KEY (participant_id) REFERENCES participants(participant_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_answers_participant ON answers(participant_id);
CREATE INDEX IF NOT EXISTS idx_events_participant_sequence ON events(participant_id, sequence);
CREATE INDEX IF NOT EXISTS idx_participants_updated_at ON participants(updated_at);
