import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { database } from './lib/db.mjs';

const assets = 'C:\\Users\\PC\\.cursor\\projects\\d-Projects-Tender\\assets';

const vehicles = [
  {
    id: '1f7fb163-a2e4-48f9-baac-2ffd42036184',
    name: 'hilux',
    files: ['hilux-front.jpg', 'hilux-rear.jpg', 'hilux-bed.jpg'],
  },
  {
    id: '8d0813e3-d226-43e4-bcd4-ec2b3d276a84',
    name: 'figo',
    files: ['figo-cover.jpg', 'figo-damage.jpg'],
  },
];

function mimeFor(file) {
  if (file.endsWith('.png')) return 'image/png';
  if (file.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

const db = database();

for (const vehicle of vehicles) {
  const images = [];
  for (const file of vehicle.files) {
    const full = path.join(assets, file);
    const info = await stat(full);
    if (info.size < 10_000) throw new Error(`${file} too small`);
    if (info.size > 2_900_000) throw new Error(`${file} too large (${info.size})`);
    images.push({ buffer: await readFile(full), mime: mimeFor(file), file, size: info.size });
    console.log(`load ${vehicle.name} ${file} ${info.size}`);
  }

  await db.query('DELETE FROM photos WHERE listing_id = $1', [vehicle.id]);
  for (let i = 0; i < images.length; i += 1) {
    await db.query(
      'INSERT INTO photos(listing_id, position, mime, content) VALUES ($1, $2, $3, $4)',
      [vehicle.id, i, images[i].mime, images[i].buffer],
    );
  }
  console.log(`updated ${vehicle.name} → ${images.length} photos`);
}

const check = await db.query(`
  SELECT l.title, count(p.*) AS photos, max(length(p.content)) AS biggest
  FROM listings l JOIN photos p ON p.listing_id = l.id
  WHERE l.vehicle GROUP BY l.title ORDER BY l.title
`);
console.log(check.rows);
await db.end();
