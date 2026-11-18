-- Convert account-related UUID columns to text for Firebase Auth UIDs (idempotent).
SET search_path TO bids;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'bids' AND table_name = 'accounts' AND column_name = 'id' AND data_type = 'uuid'
  ) THEN
    ALTER TABLE saved DROP CONSTRAINT IF EXISTS saved_account_id_fkey;
    ALTER TABLE searches DROP CONSTRAINT IF EXISTS searches_account_id_fkey;
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_account_id_fkey;
    ALTER TABLE deliveries DROP CONSTRAINT IF EXISTS deliveries_account_id_fkey;

    ALTER TABLE saved ALTER COLUMN account_id TYPE text USING account_id::text;
    ALTER TABLE searches ALTER COLUMN account_id TYPE text USING account_id::text;
    ALTER TABLE payments ALTER COLUMN account_id TYPE text USING account_id::text;
    ALTER TABLE deliveries ALTER COLUMN account_id TYPE text USING account_id::text;
    ALTER TABLE audit ALTER COLUMN actor TYPE text USING actor::text;
    ALTER TABLE admins ALTER COLUMN id TYPE text USING id::text;
    ALTER TABLE accounts ALTER COLUMN id TYPE text USING id::text;

    ALTER TABLE saved
      ADD CONSTRAINT saved_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id);
    ALTER TABLE searches
      ADD CONSTRAINT searches_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id);
    ALTER TABLE payments
      ADD CONSTRAINT payments_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id);
    ALTER TABLE deliveries
      ADD CONSTRAINT deliveries_account_id_fkey FOREIGN KEY (account_id) REFERENCES accounts(id);
  END IF;
END $$;
