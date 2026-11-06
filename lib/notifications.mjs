import { listingPredicate } from './domain.mjs';
import { transaction } from './db.mjs';

async function queue(db, key, account, ids, message) {
  const channels = [account.email_alerts && 'email',account.push_token && 'push'].filter(Boolean);
  for (const channel of channels) {
    await db.query(`INSERT INTO deliveries(key,account_id,channel,listing_ids,message)
      VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING`,[key + ':' + channel,account.id,channel,ids,message]);
  }
}

export async function queueAlerts(db) {
  await transaction(db,async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('bids.notifications.queue'))");
    const {rows:events} = await client.query(`SELECT e.*,a.id AS account_id,a.email_alerts,a.push_token FROM events e
      JOIN saved s ON s.listing_id=e.listing_id JOIN accounts a ON a.id=s.account_id
      WHERE e.created_at>now()-interval '7 days' AND (a.email_alerts OR a.push_token IS NOT NULL)`);
    for (const event of events) {
      await queue(client,'event:' + event.id + ':' + event.account_id,{...event,id:event.account_id},
        [event.listing_id],event.kind === 'cancelled' ? 'A saved opportunity was cancelled.' : 'A saved opportunity has a new deadline.');
    }
    const {rows:[clock]} = await client.query(`SELECT (now() AT TIME ZONE 'Africa/Addis_Ababa')::date::text AS day,
      extract(hour FROM now() AT TIME ZONE 'Africa/Addis_Ababa') AS hour`);
    if (Number(clock.hour) < 8) return;
    const {rows:accounts} = await client.query(`SELECT *,(expires_at>now()) AS subscribed FROM accounts
      WHERE (email_alerts OR push_token IS NOT NULL) AND EXISTS(SELECT 1 FROM searches WHERE account_id=accounts.id)`);
    for (const account of accounts) {
      const {rows:searches} = await client.query('SELECT filters,created_at FROM searches WHERE account_id=$1',[account.id]);
      const ids = new Set();
      for (const search of searches) {
        const args = [clock.day,search.created_at];
        const where = listingPredicate(search.filters,account.subscribed,args);
        const {rows} = await client.query(`SELECT l.id FROM listings l WHERE l.status='active' AND l.deadline>now()
          AND l.created_at>=greatest($2,(($1::date - interval '1 day' + interval '8 hours') AT TIME ZONE 'Africa/Addis_Ababa'))
          AND l.created_at<(($1::date + interval '8 hours') AT TIME ZONE 'Africa/Addis_Ababa')` + where + ' ORDER BY l.deadline LIMIT 100',args);
        for (const row of rows) ids.add(row.id);
      }
      if (ids.size) await queue(client,'digest:' + clock.day + ':' + account.id,account,[...ids].slice(0,100),'New opportunities match your saved searches.');
    }
  });
}

async function send(delivery) {
  const headers = {'Content-Type':'application/json'};
  const { WEB_URL, RESEND_API_KEY, EMAIL_FROM, EXPO_ACCESS_TOKEN } = process.env;
  const path = delivery.listing_ids.length === 1 ? '/?bid=' + delivery.listing_ids[0] : '/';
  let url, payload;
  if (delivery.channel === 'email') {
    if (!WEB_URL || !RESEND_API_KEY || !EMAIL_FROM) throw new Error('Email credentials missing');
    url = 'https://api.resend.com/emails';
    headers.Authorization = 'Bearer ' + RESEND_API_KEY;
    headers['Idempotency-Key'] = delivery.key;
    payload = {from:EMAIL_FROM,to:[delivery.email],subject:'Bid Ethiopia update',text:delivery.message + '\n' + new URL(path,WEB_URL)};
  } else {
    url = 'https://exp.host/--/api/v2/push/send';
    if (EXPO_ACCESS_TOKEN) headers.Authorization = 'Bearer ' + EXPO_ACCESS_TOKEN;
    payload = {to:delivery.push_token,title:'Bid Ethiopia',body:delivery.message,data:{listingId:delivery.listing_ids.length === 1 ? delivery.listing_ids[0] : null}};
  }
  const response = await fetch(url,{method:'POST',headers,body:JSON.stringify(payload),signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('Delivery HTTP ' + response.status);
  if (delivery.channel === 'email') return {};
  const data = (await response.json()).data;
  if (data?.status !== 'ok' && data?.details?.error !== 'DeviceNotRegistered') throw new Error('Expo rejected the notification');
  return {receipt:data.id,invalid:data?.details?.error === 'DeviceNotRegistered'};
}

export async function deliverAlerts(db, deliver = send) {
  for (let i=0;i<50;i++) {
    const more = await transaction(db,async (client) => {
      const {rows:[job]} = await client.query(`SELECT d.*,a.email,a.email_alerts,a.push_token FROM deliveries d
        JOIN accounts a ON a.id=d.account_id WHERE d.sent_at IS NULL AND d.attempts<8 AND d.next_attempt<=now()
        ORDER BY d.next_attempt FOR UPDATE OF d SKIP LOCKED LIMIT 1`);
      if (!job) return false;
      try {
        const enabled = job.channel === 'email' ? job.email_alerts : job.push_token;
        const result = enabled ? await deliver(job) : {};
        if (result.invalid) await client.query('UPDATE accounts SET push_token=NULL WHERE id=$1 AND push_token=$2',[job.account_id,job.push_token]);
        await client.query('UPDATE deliveries SET sent_at=now(),receipt=$2,last_error=NULL WHERE key=$1',[job.key,result.receipt ?? null]);
      } catch (error) {
        await client.query(`UPDATE deliveries SET attempts=attempts+1,last_error=$2,
          next_attempt=now()+power(2,attempts)*interval '1 minute' WHERE key=$1`,[job.key,error.message.slice(0,300)]);
      }
      return true;
    });
    if (!more) break;
  }
}

export async function checkPushReceipts(db) {
  const {rows} = await db.query(`SELECT key,receipt,account_id FROM deliveries WHERE receipt IS NOT NULL
    AND NOT receipt_checked AND sent_at<now()-interval '15 minutes' AND sent_at>now()-interval '1 day' LIMIT 100`);
  if (!rows.length) return;
  const headers = {'Content-Type':'application/json'};
  if (process.env.EXPO_ACCESS_TOKEN) headers.Authorization = 'Bearer ' + process.env.EXPO_ACCESS_TOKEN;
  const response = await fetch('https://exp.host/--/api/v2/push/getReceipts',{method:'POST',headers,
    body:JSON.stringify({ids:rows.map((row) => row.receipt)}),signal:AbortSignal.timeout(10000)});
  if (!response.ok) throw new Error('Expo receipts HTTP ' + response.status);
  const {data} = await response.json();
  for (const row of rows) {
    const result = data?.[row.receipt];
    if (!result) continue;
    await db.query('UPDATE deliveries SET receipt_checked=true,last_error=$2 WHERE key=$1',
      [row.key,result.status === 'ok' ? null : String(result.details?.error ?? 'Push receipt error').slice(0,300)]);
  }
}
