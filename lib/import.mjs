import { clean, egpKey, listingInput } from './domain.mjs';
import { transaction } from './db.mjs';
import { listingEvents, writeListing } from './api.mjs';

export async function ingest(db, notices) {
  if (!Array.isArray(notices) || notices.length > 10000 ||
      notices.some((notice) => !notice || typeof notice !== 'object' || Array.isArray(notice))) {
    throw new Error('Invalid eGP feed envelope');
  }
  return transaction(db,async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('bids.egp.import'))");
    const keys = new Set();
    for (const notice of notices) {
      const key = egpKey(notice.reference,notice.lot,notice.sourceId);
      if (key && keys.has(key)) throw new Error('Duplicate source identity in eGP response');
      keys.add(key);
    }
    let review = 0;
    for (const notice of notices) {
      const key = egpKey(notice.reference,notice.lot,notice.sourceId);
      const old = key ? (await client.query('SELECT * FROM listings WHERE source_key=$1 FOR UPDATE',[key])).rows[0] : null;
      let row;
      try {
        if (!key || !['active','cancelled'].includes(notice.status)) throw new Error('Verify reference, lot and status.');
        row = listingInput({
          ...notice, sector:'public', vehicle:false, access:old?.access ?? 'free',
          status:notice.status === 'cancelled' ? 'cancelled' : old?.status === 'draft' ? 'draft' : 'active',
        });
        if (!['egp.gov.et','production.egp.gov.et'].includes(new URL(row.details.sourceUrl).hostname)) {
          throw new Error('Verify the official notice URL.');
        }
        if (old?.vehicle) {
          row.vehicle = true;
          row.details = {...row.details,...old.details,sourceUrl:row.details.sourceUrl};
        }
      } catch (error) {
        const reviewKey = key ?? 'egp:unidentified:' + JSON.stringify([clean(notice.title),clean(notice.issuer),clean(notice.deadline)]);
        await client.query(`INSERT INTO import_review(source_key,payload,reason) VALUES($1,$2,$3)
          ON CONFLICT(source_key) DO UPDATE SET payload=excluded.payload,reason=excluded.reason,updated_at=now()`,
          [reviewKey,JSON.stringify(notice),error.message]);
        review++;
        continue;
      }
      await writeListing(client,row,old?.id,key);
      await listingEvents(client,old,row);
      await client.query('DELETE FROM import_review WHERE source_key=$1',[key]);
    }
    return {read:notices.length,review};
  });
}

export async function importApprovedFeed(db, env = process.env) {
  if (env.EGP_IMPORT_APPROVED !== 'true') return null;
  const url = new URL(env.EGP_FEED_URL);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Use an approved HTTPS eGP feed.');
  const response = await fetch(url,{
    redirect:'error',
    headers:env.EGP_FEED_TOKEN ? {Authorization:'Bearer ' + env.EGP_FEED_TOKEN} : {},
    signal:AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('eGP feed returned HTTP ' + response.status);
  const data = await response.json();
  return ingest(db,data.notices);
}

