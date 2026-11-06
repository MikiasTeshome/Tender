import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';
import { handle } from '../lib/api.mjs';
import { ingest, importApprovedFeed } from '../lib/import.mjs';
import { deliverAlerts, queueAlerts } from '../lib/notifications.mjs';

const staff = '11111111-1111-1111-1111-111111111111';
const supplier = '22222222-2222-2222-2222-222222222222';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVuoAAAAASUVORK5CYII=','base64');
const future = (days) => new Date(Date.now()+86400000*days).toISOString();

async function setup(t) {
  const pg = new PGlite();
  await pg.exec(await readFile(new URL('../db/schema.sql',import.meta.url),'utf8'));
  await pg.query('INSERT INTO admins(id) VALUES($1)',[staff]);
  t.after(() => pg.close());
  const query = async (sql,args) => {
    const result = await pg.query(sql,args);
    return {...result,rowCount:result.affectedRows || result.rows.length};
  };
  const db = {query,connect:async () => ({query,release(){}})};
  const identify = (id) => ({id,email:id === staff ? 'staff@example.com' : 'supplier@example.com',email_confirmed_at:future(-1)});
  async function api(path,{method='GET',body,user,status=200}={}) {
    const headers = new Headers(user ? {Authorization:'Bearer ' + user} : {});
    if (body && !(body instanceof FormData)) headers.set('Content-Type','application/json');
    const request = new Request('http://localhost/api/' + path,{method,headers,body:body instanceof FormData ? body : body && JSON.stringify(body)});
    const response = await handle(db,request,path.split('?')[0].split('/'),identify);
    assert.equal(response.status,status,await response.clone().text());
    return response.headers.get('content-type')?.startsWith('image/') ? response : response.json();
  }
  return {db,api};
}

function form(overrides = {},photoCount = 0,authorized = true) {
  const data = new FormData();
  for (const [key,value] of Object.entries({
    title:'Office supply notice',issuer:'Example institution',sector:'ngo',region:'Addis Ababa',access:'free',
    status:'active',sourceUrl:'https://example.org/bids/1',deadline:future(10),...overrides,
  })) data.set(key,value);
  for (let i=0;i<photoCount;i++) data.append('images',new Blob([png],{type:'image/png'}),'vehicle.png');
  if (photoCount && authorized) data.set('authorized','on');
  return data;
}

test('four sections, vehicle validation, separate lots, subscription privacy and expiry',async (t) => {
  const {db,api} = await setup(t);
  const create = (body,status=201,user=staff) => api('admin/listings',{method:'POST',body,user,status});
  const base = {vehicle:'true',title:'Used fleet car',sector:'private',access:'paid',location:'Depot A',condition:'used',make:'Toyota',
    model:'Corolla',issuer:'Example Fleet Ltd',instructions:'Submit through the company office',inspection:'Visit Depot A',lot:'1'};
  await create(form(base),400);
  await create(form(base,1,false),400);
  await create(form(base,1),403,supplier);
  const {id} = await create(form(base,2));
  await create(form(base,2),409);
  const {id:second} = await create(form({...base,condition:'damaged',lot:'2'},1));
  assert.notEqual(second,id);
  await create(form({sector:'public'}));
  await create(form({sector:'ngo',sourceUrl:'https://example.org/bids/2'}));
  const catalog = async (query,options) => (await api('listings?' + query,options)).items;
  for (const [sector,count] of [['public',1],['ngo',1],['private',2],['vehicle',2]]) {
    assert.equal((await catalog('section=' + sector)).length,count);
  }
  const locked = await api('listings/' + id);
  assert.deepEqual(Object.keys(locked).sort(),['id','title','sector','access','vehicle','deadline','status','locked','condition','cover'].sort());
  assert.equal(locked.condition,'used');
  assert.equal((await catalog('section=vehicle&condition=damaged'))[0].id,second);
  assert.equal((await catalog('q=Fleet+Ltd')).length,0);
  assert.equal((await catalog('make=Toyota')).length,0);
  await api('photos/' + locked.cover);
  const full = await api('listings/' + id,{user:staff});
  assert.equal(full.details.inspection,'Visit Depot A');
  await api('photos/' + full.photos[1],{status:404});
  await api('saved/' + id,{method:'PUT',user:supplier});
  await api('searches',{method:'POST',user:supplier,status:201,body:{label:'Vehicle search',filters:{section:'vehicle'}}});
  assert.equal((await api('searches',{user:supplier}))[0].filters.section,'vehicle');
  await db.query("UPDATE accounts SET expires_at=now()+interval '1 day' WHERE id=$1",[supplier]);
  assert.equal((await catalog('section=vehicle&make=Toyota&model=Corolla',{user:supplier})).length,2);
  assert.equal((await api('listings/' + id,{user:supplier})).details.instructions,base.instructions);
  await api('photos/' + full.photos[1],{user:supplier});
  await db.query("UPDATE accounts SET expires_at=now()-interval '1 day' WHERE id=$1",[supplier]);
  await api('photos/' + full.photos[1],{user:supplier,status:404});
  assert.equal((await api('listings/' + id,{user:supplier})).locked,true);
  await api('admin/listings/' + id,{method:'PUT',user:staff,body:form({...base,status:'cancelled'})});
  assert.equal((await catalog('section=vehicle')).length,1);
  assert.equal((await api('saved',{user:supplier}))[0].status,'cancelled');
  await db.query('UPDATE listings SET deadline=$2 WHERE id=$1',[second,future(-1)]);
  assert.equal((await catalog('section=vehicle')).length,0);
  assert.equal((await api('listings/' + second)).status,'expired');
});

test('payments preserve submitted price and grant each of four terms exactly once',async (t) => {
  const {db,api} = await setup(t);
  const settings = {prices:{1:'100',3:'250',6:'450',12:'800'},instructions:'Use the staff-configured payment channel'};
  await api('admin/plans',{method:'PUT',user:staff,body:settings});
  const submit = (months,reference,status=201) => api('payments',{method:'POST',user:supplier,body:{months,reference},status});
  const review = (id,decision,status=200) => api('admin/payments/' + id,{method:'PUT',user:staff,body:{status:decision},status});
  for (const months of [1,3,6,12]) {
    const before = (await api('me',{user:supplier})).expiresAt;
    const {id} = await submit(months,'payment-' + months);
    await submit(months,' PAYMENT-' + months + ' ',409);
    if (months === 1) await api('admin/plans',{method:'PUT',user:staff,body:{...settings,prices:{...settings.prices,1:'120'}}});
    await review(id,'approved');
    await review(id,'approved',409);
    const after = (await api('me',{user:supplier})).expiresAt;
    assert.ok(after > (before ?? new Date().toISOString()));
    const {rows:[match]} = await db.query(`SELECT abs(extract(epoch FROM (expires_at - (
      (greatest($2::timestamptz,p.reviewed_at) AT TIME ZONE 'Africa/Addis_Ababa') + make_interval(months=>p.months)
      ) AT TIME ZONE 'Africa/Addis_Ababa'))) AS seconds
      FROM accounts a JOIN payments p ON p.account_id=a.id WHERE a.id=$1 AND p.id=$3`,[supplier,before,id]);
    assert.ok(Number(match.seconds) < 1);
  }
  assert.equal((await api('payments',{user:supplier})).find((item) => item.months === 1).price,'100.00');
  const {id} = await submit(1,'rejected-1');
  const expiry = (await api('me',{user:supplier})).expiresAt;
  await review(id,'rejected');
  assert.equal((await api('me',{user:supplier})).expiresAt,expiry);
  await db.query("UPDATE accounts SET expires_at=now()-interval '2 days' WHERE id=$1",[supplier]);
  const renewal = await submit(1,'renewal-1');
  await review(renewal.id,'approved');
  assert.ok((await api('me',{user:supplier})).subscribed);
});

test('eGP repeats, separates lots, quarantines ambiguous data and preserves listings on failure',async (t) => {
  const {db,api} = await setup(t);
  const notice = {reference:'DEMO-001',lot:'1',title:'Public supply notice',issuer:'Example Public Agency',region:'Oromia',
    deadline:future(10),status:'active',sourceUrl:'https://egp.gov.et/egp/bids/RebidTender'};
  assert.equal(await importApprovedFeed(db,{EGP_IMPORT_APPROVED:'false'}),null);
  const manual = await api('admin/listings',{method:'POST',user:staff,status:201,
    body:form({...notice,sector:'public',reference:notice.reference.toLowerCase()})});
  await ingest(db,[notice,{...notice,lot:'2'}]);
  await ingest(db,[notice,{...notice,lot:'2'}]);
  assert.equal((await api('listings')).items.length,2);
  assert.equal((await ingest(db,[{...notice,deadline:'sometime tomorrow'}])).review,1);
  assert.equal((await api('admin/review',{user:staff})).length,1);
  await assert.rejects(ingest(db,[notice,notice]),/Duplicate source/);
  assert.equal((await api('listings')).items.length,2);
  const {id} = (await api('listings')).items.find((item) => item.details.lot === '1');
  assert.equal(id,manual.id);
  await api('saved/' + id,{method:'PUT',user:supplier});
  await api('preferences',{method:'PUT',user:supplier,body:{emailAlerts:true}});
  await ingest(db,[{...notice,deadline:future(15)}]);
  await ingest(db,[{...notice,deadline:future(15),status:'cancelled'}]);
  await queueAlerts(db);
  await queueAlerts(db);
  const deliveries = [];
  await deliverAlerts(db,async (job) => {deliveries.push(job);return {};});
  await deliverAlerts(db,async () => assert.fail('Delivered twice'));
  assert.equal(deliveries.length,2);
  assert.ok(deliveries.every((job) => !job.message.includes(notice.issuer)));
  assert.equal((await api('saved',{user:supplier}))[0].status,'cancelled');
  assert.equal((await api('admin/review',{user:staff})).length,0);
});

