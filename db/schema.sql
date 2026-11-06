CREATE SCHEMA IF NOT EXISTS bids;
SET search_path TO bids;
CREATE TABLE IF NOT EXISTS listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_key text UNIQUE,
  title text NOT NULL,
  sector text NOT NULL CHECK (sector IN ('public','ngo','private')),
  vehicle boolean NOT NULL DEFAULT false,
  access text NOT NULL CHECK (access IN ('free','paid')),
  status text NOT NULL CHECK (status IN ('draft','active','cancelled')),
  issuer text NOT NULL,
  region text NOT NULL,
  deadline timestamptz NOT NULL,
  details jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS listing_deadline ON listings (status,deadline);
CREATE INDEX IF NOT EXISTS listing_search ON listings USING gin (to_tsvector('simple', title));
CREATE TABLE IF NOT EXISTS photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  position int NOT NULL,
  mime text NOT NULL,
  content bytea NOT NULL,
  UNIQUE(listing_id,position)
);
CREATE TABLE IF NOT EXISTS accounts (
  id uuid PRIMARY KEY,
  email text NOT NULL,
  expires_at timestamptz,
  email_alerts boolean NOT NULL DEFAULT false,
  push_token text UNIQUE
);
CREATE TABLE IF NOT EXISTS admins (id uuid PRIMARY KEY);
CREATE TABLE IF NOT EXISTS saved (
  account_id uuid REFERENCES accounts(id),
  listing_id uuid REFERENCES listings(id),
  PRIMARY KEY(account_id,listing_id)
);
CREATE TABLE IF NOT EXISTS searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  label text NOT NULL,
  filters jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS plans (
  months int PRIMARY KEY CHECK (months IN (1,3,6,12)),
  price numeric(12,2) CHECK (price > 0)
);
INSERT INTO plans(months) VALUES (1),(3),(6),(12) ON CONFLICT DO NOTHING;
CREATE TABLE IF NOT EXISTS settings (key text PRIMARY KEY, value text NOT NULL);
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id),
  reference text NOT NULL UNIQUE,
  months int NOT NULL REFERENCES plans(months),
  price numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);
CREATE TABLE IF NOT EXISTS audit (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor uuid,
  action text NOT NULL,
  subject text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES listings(id),
  kind text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS deliveries (
  key text PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES accounts(id),
  channel text NOT NULL,
  listing_ids uuid[] NOT NULL,
  message text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  next_attempt timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  last_error text,
  receipt text,
  receipt_checked boolean NOT NULL DEFAULT false
);
CREATE TABLE IF NOT EXISTS import_review (
  source_key text PRIMARY KEY,
  payload jsonb NOT NULL,
  reason text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON SCHEMA bids FROM PUBLIC;
