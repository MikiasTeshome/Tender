import pg from 'pg';

let pool;
export function database() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  return pool ??= new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    options: '-c search_path=bids -c timezone=UTC',
    connectionTimeoutMillis: 8000,
  });
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
