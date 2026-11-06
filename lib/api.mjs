import { createHash } from 'node:crypto';
import { transaction } from './db.mjs';
import { clean, egpKey, filters, HttpError, listingInput, listingPredicate, listingSelect, preview, terms, uuid } from './domain.mjs';

const ok = (data, status = 200) => Response.json(data, {status, headers: {'Cache-Control':'private, no-store'}});
const missing = () => new HttpError(404, 'This item was not found.');
const one = async (db, sql, args) => (await db.query(sql,args)).rows[0];

async function account(db, request, identify) {
  const token = request.headers.get('authorization')?.match(/^Bearer (\S+)$/i)?.[1];
  if (!token) return null;
  const user = await identify(token);
  if (!user?.id || !user.email || !user.email_confirmed_at) throw new HttpError(401, 'Sign in with a verified email.');
  return one(db, `INSERT INTO accounts(id,email) VALUES ($1,$2) ON CONFLICT(id) DO UPDATE SET email=excluded.email
    RETURNING *, coalesce(expires_at>now(),false) AS subscribed, EXISTS(SELECT 1 FROM admins WHERE id=$1) AS admin`, [user.id,user.email]);
}

export async function identify(token) {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new HttpError(503, 'Account service is being configured.');
  const response = await fetch(new URL('/auth/v1/user', SUPABASE_URL), {
    headers: {apikey: SUPABASE_ANON_KEY, Authorization: 'Bearer ' + token},
    signal: AbortSignal.timeout(8000),
  });
  if ([401,403].includes(response.status)) return null;
  if (!response.ok) throw new HttpError(503, 'Account service is temporarily unavailable.');
  return response.json();
}

function userRequired(user) {
  if (!user) throw new HttpError(401, 'Sign in to continue.');
}

async function audit(db, actor, action, subject) {
  await db.query('INSERT INTO audit(actor,action,subject) VALUES($1,$2,$3)', [actor,action,subject]);
}

export async function listingEvents(db, old, current) {
  if (!old) return;
  const change = current.status === 'cancelled' && old.status !== 'cancelled' ? 'cancelled'
    : current.status === 'active' && new Date(current.deadline) > new Date(old.deadline) ? 'extended' : null;
  if (change) await db.query('INSERT INTO events(listing_id,kind) VALUES($1,$2)', [old.id,change]);
}

export async function writeListing(db, row, id, sourceKey) {
  const args = [row.title,row.sector,row.vehicle,row.access,row.status,row.issuer,row.region,row.deadline,JSON.stringify(row.details)];
  if (id) {
    return one(db, `UPDATE listings SET title=$1,sector=$2,vehicle=$3,access=$4,status=$5,issuer=$6,region=$7,
      deadline=$8,details=$9,updated_at=now(),
      created_at=CASE WHEN status='draft' AND $5='active' THEN now() ELSE created_at END
      WHERE id=$10 RETURNING id`, [...args,id]);
  }
  return one(db, `INSERT INTO listings(title,sector,vehicle,access,status,issuer,region,deadline,details,source_key)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`, [...args,sourceKey]);
}

async function body(request) {
  try {
    const value = JSON.parse((await readBytes(request, 32000)).toString('utf8'));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400,'Invalid request.');
  }
}

async function readBytes(request, limit) {
  if (Number(request.headers.get('content-length')) > limit) throw new HttpError(413,'Request is too large.');
  const reader = request.body?.getReader();
  if (!reader) return Buffer.alloc(0);
  let length = 0;
  const chunks = [];
  while (true) {
    const {done,value} = await reader.read();
    if (done) break;
    length += value.length;
    if (length > limit) {
      await reader.cancel();
      throw new HttpError(413,'Request is too large.');
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}

async function form(request) {
  let data;
  try {
    const type = request.headers.get('content-type') ?? '';
    if (!type.startsWith('multipart/form-data')) throw new Error();
    const content = await readBytes(request,16_000_000);
    data = await new Response(content,{headers:{'Content-Type':type}}).formData();
  } catch (error) {
    if (error instanceof HttpError) throw error;
    throw new HttpError(400,'Invalid upload.');
  }
  const fields = Object.fromEntries(data);
  fields.vehicle = fields.vehicle === 'true';
  const images = [];
  for (const file of data.getAll('images').filter((item) => item instanceof Blob && item.size)) {
    if (file.size > 3_000_000 || images.length >= 5) throw new HttpError(400,'Upload up to five photos of 3 MB each.');
    const content = Buffer.from(await file.arrayBuffer());
    const mime = content[0] === 255 && content[1] === 216 && content[2] === 255 ? 'image/jpeg'
      : content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png'
      : content.toString('ascii',0,4) === 'RIFF' && content.toString('ascii',8,12) === 'WEBP' ? 'image/webp' : null;
    if (!mime) throw new HttpError(400,'Use JPEG, PNG, or WebP photos.');
    images.push({mime,content});
  }
  if (images.length && fields.authorized !== 'on') throw new HttpError(400,'Confirm the issuer authorized the photos.');
  return {fields, images};
}

async function adminListing(db, user, request, id) {
  const {fields,images} = await form(request);
  const listing = listingInput(fields);
  return transaction(db, async (client) => {
    if (fields.reviewKey) await client.query("SELECT pg_advisory_xact_lock(hashtext('bids.egp.import'))");
    const review = fields.reviewKey ? await one(client,'SELECT source_key FROM import_review WHERE source_key=$1 FOR UPDATE',[clean(fields.reviewKey,500)]) : null;
    if (fields.reviewKey && !review) throw new HttpError(409,'This notice has already been reviewed.');
    const old = id ? await one(client,'SELECT * FROM listings WHERE id=$1 FOR UPDATE',[uuid(id)]) :
      review ? await one(client,'SELECT * FROM listings WHERE source_key=$1 FOR UPDATE',[review.source_key]) : null;
    if (id && !old) throw missing();
    const count = old ? Number((await one(client,'SELECT count(*) FROM photos WHERE listing_id=$1',[old.id])).count) : 0;
    if (listing.vehicle && !images.length && !count) throw new HttpError(400,'Add at least one authorized photo.');
    const duplicateKey = [listing.issuer,listing.details.reference || listing.details.sourceUrl || listing.title,listing.details.lot]
      .map((part) => part.trim().toLowerCase()).join('\n');
    const publicKey = listing.sector === 'public' ? egpKey(listing.details.reference,listing.details.lot) : null;
    const sourceKey = review?.source_key ?? publicKey ?? 'manual:' + createHash('sha256').update(duplicateKey).digest('hex');
    const result = await writeListing(client,listing,old?.id,sourceKey);
    if (images.length) {
      await client.query('DELETE FROM photos WHERE listing_id=$1',[result.id]);
      for (const [index,image] of images.entries()) {
        await client.query('INSERT INTO photos(listing_id,position,mime,content) VALUES($1,$2,$3,$4)', [result.id,index,image.mime,image.content]);
      }
    }
    if (fields.reviewKey) await client.query('DELETE FROM import_review WHERE source_key=$1',[clean(fields.reviewKey,500)]);
    await listingEvents(client, old, listing);
    await audit(client,user.id,id ? 'listing.update' : 'listing.create',result.id);
    return ok(result,id ? 200 : 201);
  });
}

async function reviewPayment(db, user, id, decision) {
  if (!['approved','rejected'].includes(decision)) throw new HttpError(400,'Choose a decision.');
  return transaction(db, async (client) => {
    const payment = await one(client,'SELECT * FROM payments WHERE id=$1 FOR UPDATE',[uuid(id)]);
    if (!payment) throw missing();
    if (payment.status !== 'pending') throw new HttpError(409,'Payment already reviewed.');
    if (decision === 'approved') {
      await client.query(`UPDATE accounts SET expires_at=((greatest(now(),expires_at) AT TIME ZONE 'Africa/Addis_Ababa')
        + make_interval(months=>$2::int)) AT TIME ZONE 'Africa/Addis_Ababa' WHERE id=$1`, [payment.account_id,payment.months]);
    }
    await client.query('UPDATE payments SET status=$2,reviewed_at=now() WHERE id=$1',[id,decision]);
    await audit(client,user.id,'payment.' + decision,id);
    return ok({status:decision});
  });
}

export async function handle(db, request, path, authenticate = identify) {
  try {
    const [resource,id,action] = path;
    const method = request.method;
    const url = new URL(request.url);
    if (path.length > 3) throw missing();
    const user = await account(db,request,authenticate);
    const entitled = !!(user?.subscribed || user?.admin);
    if (resource === 'listings' && method === 'GET' && !action) {
      if (id) {
        const row = await one(db,listingSelect + " WHERE l.id=$1 AND l.status!='draft'", [uuid(id)]);
        if (!row) throw missing();
        return ok(preview(row,entitled));
      }
      const page = Math.min(10000,Math.max(1,Number.parseInt(url.searchParams.get('page'),10) || 1));
      const args = [(page-1)*24];
      const where = listingPredicate(filters(Object.fromEntries(url.searchParams)),entitled,args);
      const {rows} = await db.query(listingSelect + " WHERE l.status='active' AND l.deadline>now()" + where +
        ' ORDER BY l.deadline,l.id LIMIT 25 OFFSET $1',args);
      return ok({items:rows.slice(0,24).map((row) => preview(row,entitled)), next: rows.length > 24 ? page+1 : null});
    }
    if (resource === 'photos' && id && !action && method === 'GET') {
      const row = await one(db,`SELECT p.*,l.access,l.status,l.vehicle FROM photos p JOIN listings l ON l.id=p.listing_id WHERE p.id=$1`,[uuid(id)]);
      if (!row || row.status === 'draft' && !user?.admin ||
        row.access === 'paid' && !entitled && !(row.vehicle && row.position === 0)) throw missing();
      return new Response(row.content,{headers:{'Content-Type':row.mime,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
    }
    if (resource === 'plans' && !id && method === 'GET') {
      const {rows} = await db.query('SELECT months,price FROM plans ORDER BY months');
      const instructions = (await one(db,"SELECT value FROM settings WHERE key='payment_instructions'"))?.value;
      return ok({plans:rows,instructions:instructions ?? ''});
    }
    userRequired(user);
    if (resource === 'me' && !id && method === 'GET') {
      return ok({email:user.email, subscribed:user.subscribed, admin:user.admin, expiresAt:user.expires_at,
        emailAlerts:user.email_alerts, pushEnabled:!!user.push_token});
    }
    if (resource === 'preferences' && !id && method === 'PUT') {
      const input = await body(request);
      await transaction(db,async (client) => {
        if (typeof input.emailAlerts === 'boolean') await client.query('UPDATE accounts SET email_alerts=$2 WHERE id=$1',[user.id,input.emailAlerts]);
        if (Object.hasOwn(input,'pushToken')) {
          const token = input.pushToken;
          if (token !== null && (typeof token !== 'string' || !/^(?:ExponentPushToken|ExpoPushToken)\[[\w-]{1,150}\]$/.test(token))) throw new HttpError(400,'Invalid push token.');
          if (token) {
            await client.query('SELECT pg_advisory_xact_lock(hashtext($1))',[token]);
            await client.query('UPDATE accounts SET push_token=NULL WHERE push_token=$1 AND id!=$2',[token,user.id]);
          }
          await client.query('UPDATE accounts SET push_token=$2 WHERE id=$1',[user.id,token]);
        }
      });
      return ok({});
    }
    if (resource === 'saved' && !action) {
      if (!id && method === 'GET') {
        const {rows} = await db.query(listingSelect + " JOIN saved s ON l.id=s.listing_id WHERE s.account_id=$1 AND l.status!='draft' ORDER BY l.deadline,l.id",[user.id]);
        return ok(rows.map((row) => preview(row,entitled)));
      }
      if (id && method === 'PUT') {
        const result = await db.query(`INSERT INTO saved(account_id,listing_id) SELECT $1,id FROM listings WHERE id=$2 AND status!='draft' ON CONFLICT DO NOTHING`,[user.id,uuid(id)]);
        if (!result.rowCount && !await one(db,'SELECT 1 FROM saved WHERE account_id=$1 AND listing_id=$2',[user.id,id])) throw missing();
        return ok({});
      }
      if (id && method === 'DELETE') {
        await db.query('DELETE FROM saved WHERE account_id=$1 AND listing_id=$2',[user.id,uuid(id)]);
        return ok({});
      }
    }
    if (resource === 'searches' && !action) {
      if (!id && method === 'GET') return ok((await db.query('SELECT id,label,filters FROM searches WHERE account_id=$1 ORDER BY created_at DESC',[user.id])).rows);
      if (!id && method === 'POST') {
        const input = await body(request);
        const label = clean(input.label,100);
        if (!label) throw new HttpError(400,'Enter a search name.');
        await db.query('INSERT INTO searches(account_id,label,filters) VALUES($1,$2,$3)',[user.id,label,JSON.stringify(filters(input.filters ?? {}))]);
        return ok({},201);
      }
      if (id && method === 'DELETE') {
        await db.query('DELETE FROM searches WHERE account_id=$1 AND id=$2',[user.id,uuid(id)]);
        return ok({});
      }
    }
    if (resource === 'payments' && !id) {
      if (method === 'GET') return ok((await db.query('SELECT id,reference,months,price,status,created_at FROM payments WHERE account_id=$1 ORDER BY created_at DESC',[user.id])).rows);
      if (method === 'POST') {
        const input = await body(request);
        const reference = clean(input.reference,100).normalize('NFKC').replace(/\s+/g,'').toUpperCase();
        const months = Number(input.months);
        if (!/^[A-Z0-9._/-]{4,100}$/.test(reference) || !terms.includes(months)) throw new HttpError(400,'Enter a valid plan and transaction reference.');
        const row = await one(db,`INSERT INTO payments(account_id,reference,months,price) SELECT $1,$2,months,price
          FROM plans WHERE months=$3 AND price IS NOT NULL AND EXISTS(SELECT 1 FROM settings WHERE key='payment_instructions' AND value!='') RETURNING id`,[user.id,reference,months]);
        if (!row) throw new HttpError(409,'This plan is unavailable.');
        return ok(row,201);
      }
    }
    if (resource !== 'admin') throw missing();
    if (!user.admin) throw new HttpError(403,'Staff access required.');
    if (id === 'listings' && method === 'GET') {
      const {rows} = await db.query(listingSelect + (action ? ' WHERE l.id=$1' : ' ORDER BY l.updated_at DESC LIMIT 250'),action ? [uuid(action)] : []);
      return ok(rows.map((row) => ({...preview(row,true), workflowStatus:row.status})));
    }
    if (id === 'listings' && (!action && method === 'POST' || action && method === 'PUT')) return await adminListing(db,user,request,action);
    if (id === 'payments' && !action && method === 'GET') {
      return ok((await db.query("SELECT p.*,a.email FROM payments p JOIN accounts a ON p.account_id=a.id ORDER BY (p.status='pending') DESC,p.created_at DESC LIMIT 250")).rows);
    }
    if (id === 'payments' && action && method === 'PUT') return await reviewPayment(db,user,action,(await body(request)).status);
    if (id === 'review' && !action && method === 'GET') return ok((await db.query('SELECT * FROM import_review ORDER BY updated_at DESC LIMIT 250')).rows);
    if (id === 'audit' && !action && method === 'GET') return ok((await db.query('SELECT * FROM audit ORDER BY id DESC LIMIT 100')).rows);
    if (id === 'plans' && !action && method === 'PUT') {
      const input = await body(request);
      const instructions = clean(input.instructions,6000);
      const prices = terms.map((term) => clean(input.prices?.[term],30));
      if (prices.some((price) => price && (!/^\d{1,10}(\.\d{1,2})?$/.test(price) || Number(price) <= 0)) ||
          prices.some(Boolean) && !instructions) throw new HttpError(400,'Enter valid ETB prices and payment instructions.');
      await transaction(db,async (client) => {
        for (const [index,term] of terms.entries()) await client.query('UPDATE plans SET price=$2 WHERE months=$1',[term,prices[index] || null]);
        await client.query("INSERT INTO settings VALUES('payment_instructions',$1) ON CONFLICT(key) DO UPDATE SET value=excluded.value",[instructions]);
        await audit(client,user.id,'plans.update','plans');
      });
      return ok({});
    }
    throw missing();
  } catch (error) {
    if (error instanceof HttpError) return ok({error:error.message},error.status);
    if (error.code === '23505') return ok({error:'This listing or payment reference is already recorded.'},409);
    console.error('API error',error.code ?? error.name);
    return ok({error:'The service is temporarily unavailable.'},503);
  }
}


