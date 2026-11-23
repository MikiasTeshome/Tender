import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { database } from '../lib/db.mjs';

const db = database();
const rows = [];
const add = (key, title, sector, vehicle, issuer, region, language = 'en') => rows.push({
  key, title, sector, vehicle, issuer, region, language,
  summary: language === 'am' ? `${title} ለማቅረብ የሚደረግ የጨረታ ጥሪ።` : `Request for proposals for ${title.toLowerCase()}.`,
});

// Keep one full second API page per category while capping the demo catalog.
for (let i = 1; i <= 18; i++) {
  add(`demo-public-${i}`, i === 1 ? 'Supply of classroom desks' : `Public school supply lot ${i}`, 'public', false, 'Ministry of Education', 'Addis Ababa');
  add(`demo-ngo-${i}`, i === 1 ? 'የትምህርት መሳሪያዎች አቅርቦት' : `የማህበራዊ ፕሮጀክት ጨረታ ${i}`, 'ngo', false, 'Development Organization', 'Addis Ababa', 'am');
  add(`demo-private-${i}`, i === 1 ? 'የግንባታ እቃዎች ግዥ' : `Private construction supply ${i}`, 'private', false, 'Private Enterprise', 'Oromia', i % 2 ? 'am' : 'en');
  add(`demo-vehicle-${i}`, i === 1 ? 'Auction of government vehicles' : `Government vehicle auction ${i}`, 'public', true, 'Public Assets Authority', 'Addis Ababa');
}

for (const [index, row] of rows.filter((item) => item.vehicle).entries()) {
  const year = 2018 + (index % 6);
  row.details = {
    language: 'en', condition: index % 4 === 3 ? 'Damaged' : 'Used', location: index % 2 ? 'Bole Yard, Addis Ababa' : 'Kality Vehicle Yard',
    cpo: `${(25 + index * 2).toLocaleString()} ETB`, reserve: `${(420 + index * 35).toLocaleString()} ETB`, year,
    mileage: `${(48 + index * 17).toLocaleString()} km`, keys: index % 5 === 0 ? '1 key' : '2 keys', starter: index % 4 === 3 ? 'Needs inspection' : 'Starts normally',
    fuel: index % 3 === 0 ? 'Diesel' : 'Petrol', transmission: index % 3 === 1 ? 'Automatic' : 'Manual', plate: 'Valid documents',
    engine: index % 4 === 3 ? 'Requires inspection' : 'Runs and idles', gearbox: index % 4 === 3 ? 'Condition unknown' : 'Shifts normally',
    body: index % 4 === 3 ? 'Panel damage visible' : 'Normal wear for age', interior: 'Used, cleanable interior', tyres: index % 3 === 0 ? 'Mixed condition' : 'Roadworthy',
    contact: 'Vehicle Desk · +251 11 000 0000', visitingHours: 'Mon–Fri, 9:00–16:00 EAT', reference: `VHC-2027-${String(index + 1).padStart(3, '0')}`,
    description: `${row.title}. Inspect the vehicle at the yard before submitting a bid. The reserve and CPO are indicative for this demo listing.`,
    captions: ['Exterior inspection view'],
  };
}

try {
  await db.query("DELETE FROM bids.listings WHERE source_key IN ('demo-en-public-001','demo-en-vehicle-001','demo-am-ngo-001','demo-am-private-001')");
  for (const row of rows) {
    await db.query(`INSERT INTO bids.listings
      (source_key,title,sector,vehicle,access,status,issuer,region,deadline,details)
      VALUES ($1,$2,$3,$4,'free','active',$5,$6,now()+interval '180 days',$7)
      ON CONFLICT (source_key) DO UPDATE SET title=excluded.title, details=excluded.details, updated_at=now()`, [row.key, row.title, row.sector, row.vehicle, row.issuer, row.region,
      JSON.stringify(row.details || {language: row.language, summary: row.summary})]);
  }

  const assets = ['sedan-demo.webp', 'pickup-demo.webp', 'engine-demo.webp', 'interior-demo.webp'];
  const vehicles = (await db.query("SELECT id FROM bids.listings WHERE source_key LIKE 'demo-vehicle-%' ORDER BY source_key LIMIT 7")).rows;
  for (const [index, vehicle] of vehicles.entries()) {
    const file = path.join(new URL('../web/public/', import.meta.url).pathname, assets[index % assets.length]);
    const content = await readFile(file);
    await db.query('DELETE FROM bids.photos WHERE listing_id=$1', [vehicle.id]);
    await db.query('INSERT INTO bids.photos(listing_id,position,mime,content) VALUES($1,0,$2,$3)', [vehicle.id, 'image/webp', content]);
  }
  const counts = await db.query('SELECT count(*)::int AS total, count(*) FILTER (WHERE vehicle)::int AS vehicles FROM bids.listings');
  console.log(counts.rows[0]);
} finally { await db.end(); }
