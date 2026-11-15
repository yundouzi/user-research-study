ALTER TABLE anonymous_sessions ADD COLUMN content_arm INTEGER NOT NULL DEFAULT 0 CHECK (content_arm IN (0, 1));
