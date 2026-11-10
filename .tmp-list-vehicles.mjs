import 'dotenv/config';
import { database } from './lib/db.mjs';

const db = database();
const r = await db.query(`
  SELECT l.id, l.title, l.details->>'lot' AS lot, l.details->>'condition' AS condition,
         array_agg(p.id ORDER BY p.position) FILTER (WHERE p.id IS NOT NULL) AS photos,
         array_agg(length(p.content) ORDER BY p.position) FILTER (WHERE p.id IS NOT NULL) AS sizes
  FROM listings l
  LEFT JOIN photos p ON p.listing_id = l.id
  WHERE l.vehicle
  GROUP BY l.id
  ORDER BY l.title
`);
console.log(JSON.stringify(r.rows, null, 2));
await db.end();
