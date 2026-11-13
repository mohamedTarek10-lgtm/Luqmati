-- Additive migration for the performance/scaling work.
-- Run with:  npm run db:push
-- (or apply this file directly). It only adds a column and two tables; no
-- existing data is touched.

ALTER TABLE meals ADD COLUMN IF NOT EXISTS image_key text;

CREATE TABLE IF NOT EXISTS usage_daily (
  scope text NOT NULL,
  day text NOT NULL,
  used integer NOT NULL DEFAULT 0,
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, day)
);

CREATE TABLE IF NOT EXISTS analysis_cache (
  hash text PRIMARY KEY,
  payload jsonb NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);
