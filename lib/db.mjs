import pg from 'pg';

let pool;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  if (pool) return pool;
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 8000,
  });
  // Neon’s pooled endpoint rejects startup `options`; apply the session
  // settings after the connection is established instead.
  pool.on('connect', (client) => {
    client.query("SET search_path TO bids; SET timezone TO 'UTC'").catch(() => {});
  });
  return pool;
}

export async function transaction(db, operation) {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const result = await operation(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
