import { readFile } from 'node:fs/promises';
import { database, transaction } from '../lib/db.mjs';

const db = database();
try {
  await transaction(db, async (client) => {
    await client.query(await readFile(new URL('./schema.sql', import.meta.url), 'utf8'));
    if (process.env.ADMIN_USER_ID) {
      await client.query('INSERT INTO admins(id) VALUES($1) ON CONFLICT DO NOTHING', [process.env.ADMIN_USER_ID]);
    }
  });
} finally {
  await db.end();
}
