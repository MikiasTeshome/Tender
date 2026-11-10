'use client';

import { useCallback, useEffect, useState } from 'react';

const listingFields = [
  ['title','Title',true],['issuer','Issuer',true],['region','Region',true],
  ['reference','Procurement reference'],['lot','Lot number'],['sourceUrl','Original notice URL',false,'url'],
];
const vehicleFields = [['location','Vehicle location',true],['make','Make'],['model','Model'],['year','Year'],['mileage','Mileage']];
const terms = {1:'Monthly',3:'Quarterly',6:'Half-year',12:'Annual'};

function localDeadline(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.valueOf()) ? new Date(date.valueOf()+10800000).toISOString().slice(0,16) : '';
}

export default function Admin({api}) {
  const [tab,setTab] = useState('listings');
  const [items,setItems] = useState([]);
  const [item,setItem] = useState(null);
  const [review,setReview] = useState(null);
  const [vehicle,setVehicle] = useState(false);
  const [formId,setFormId] = useState(0);
  const [plans,setPlans] = useState(null);
  const [message,setMessage] = useState('');
  const [busy,setBusy] = useState(false);
  const load = useCallback(async () => {
    if (tab === 'plans') setPlans(await api('plans'));
    else setItems(await api('admin/' + tab));
  },[api,tab]);
  useEffect(() => {load().catch((error) => setMessage(error.message));},[load]);
  async function run(action) {
    setMessage('');setBusy(true);
    try {await action();} catch (error) {setMessage(error.message);}
    finally {setBusy(false);}
  }
  function edit(entry,queue,asVehicle = false) {
    setItem(entry);setReview(queue);setVehicle(entry?.vehicle ?? asVehicle);setFormId((id) => id+1);
    setItems([]);setTab('listings');
    if (tab === 'listings') void load().catch((error) => setMessage(error.message));
  }
  const values = item ? {...item,...item.details,status:item.workflowStatus} : {...review?.payload};
  return <section className="surface staff">
    <div className="eyebrow">Staff console</div><h1>Manage the directory</h1>
    <div className="tabs">{[['listings','Listings'],['review','Import review'],['payments','Payments'],['plans','Plan settings'],['audit','Audit history']].map(([key,label]) => <button className={key === tab ? 'selected' : ''} key={key} onClick={() => {setTab(key);setItems([]);setMessage('');}}>{label}</button>)}</div>
    {message && <p role="status" className="callout">{message}</p>}
    {tab === 'listings' && <>
      <div className="split"><h2>{item ? 'Edit listing' : review ? 'Review imported notice' : vehicle ? 'New vehicle lot' : 'New tender'}</h2><div className="inline"><button className="outline" onClick={() => edit(null,null)}>New tender</button><button className="outline" onClick={() => edit(null,null,true)}>New vehicle lot</button></div></div>
      <form key={formId} className="stack" onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        data.set('deadline',data.get('deadline') + ':00+03:00');
        data.set('vehicle',String(vehicle));
        if (review) data.set('reviewKey',review.source_key);
        void run(async () => {
          await api('admin/listings' + (item ? '/' + item.id : ''),{method:item ? 'PUT' : 'POST',data});
          edit(null,null,vehicle);setMessage('Listing saved.');
        });
      }}>
        <div className="form-grid">
          {listingFields.map(([key,label,required,type]) => <label key={key}>{label}<input name={key} type={type ?? 'text'} required={required} defaultValue={values[key] ?? ''} /></label>)}
          <label>Issuer sector<select name="sector" defaultValue={values.sector ?? (vehicle ? 'private' : 'public')}><option value="public">Public</option><option value="ngo">NGO</option><option value="private">Private</option></select></label>
          <label>Closing date and time (EAT)<input type="datetime-local" name="deadline" required defaultValue={localDeadline(values.deadline)} /></label>
          <label>Access<select name="access" defaultValue={values.access ?? 'free'}><option value="free">Free</option><option value="paid">Subscriber</option></select></label>
          <label>Status<select name="status" defaultValue={values.status ?? 'draft'}><option value="draft">Draft</option><option value="active">Active</option><option value="cancelled">Cancelled</option></select></label>
          {vehicle && <><label>Condition<select name="condition" required defaultValue={values.condition ?? ''}><option value="">Choose a condition</option><option>used</option><option>damaged</option><option>salvage</option></select></label>
            {vehicleFields.map(([key,label,required]) => <label key={key}>{label}<input name={key} required={required} defaultValue={values[key] ?? ''} /></label>)}</>}
        </div>
        <label>Notice details<textarea name="description" defaultValue={values.description ?? ''} /></label>
        {vehicle && <><label>Verified bidding instructions<textarea name="instructions" defaultValue={values.instructions ?? ''} /></label>
          <label>Inspection details<textarea name="inspection" defaultValue={values.inspection ?? ''} /></label>
          <label>{item?.photos?.length ? 'Replace photos (optional)' : 'Vehicle photos'}<input type="file" name="images" multiple required={!item?.photos?.length} accept="image/jpeg,image/png,image/webp" /></label>
          <small>Up to five JPEG, PNG, or WebP photos, 3 MB each. The first photo is the public cover for active paid vehicle listings.{item?.photos?.length ? ' Uploading new files replaces the entire gallery.' : ''}</small>
          <label className="check"><input name="authorized" type="checkbox" required={!item?.photos?.length} /> The issuer supplied or authorized these photos</label></>}
        <button className="primary" disabled={busy}>Save listing</button>
      </form>
      <h3>Directory listings</h3>
      <ul className="rows">{items.map((entry) => <li key={entry.id}><span><strong>{entry.title}</strong> · {entry.vehicle ? 'Vehicle' : entry.sector} · {entry.status} · {entry.access}</span><button className="outline" onClick={() => {edit(entry,null);window.scrollTo(0,0);}}>Edit</button></li>)}</ul>
    </>}
    {tab === 'review' && <><h2>Import review</h2>{!items.length && <p>No notices waiting for review.</p>}<ul className="rows">{items.map((entry) => <li key={entry.source_key}><span><strong>{entry.payload.title ?? 'Untitled notice'}</strong><br />{entry.reason}</span><button className="outline" onClick={() => edit(null,entry)}>Review</button></li>)}</ul></>}
    {tab === 'payments' && <><h2>Payment verification</h2>{!items.length && <p>No payment references submitted.</p>}<ul className="rows">{items.map((entry) => <li key={entry.id}>
      <span><strong>{entry.email}</strong><br />{entry.reference} · {terms[entry.months]} · ETB {entry.price} · {entry.status}</span>
      {entry.status === 'pending' && <div className="inline">{['approved','rejected'].map((status) => <button key={status} className={status === 'approved' ? 'primary' : 'outline'} disabled={busy} onClick={() => {
        if (!window.confirm(status === 'approved' ? 'Confirm that you verified this payment with the payment provider.' : 'Reject this payment reference?')) return;
        void run(async () => {await api('admin/payments/' + entry.id,{method:'PUT',data:{status}});await load();setMessage('Payment ' + status + '.');});
      }}>{status === 'approved' ? 'Approve' : 'Reject'}</button>)}</div>}
    </li>)}</ul></>}
    {tab === 'plans' && plans && <form className="stack" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const prices = Object.fromEntries(plans.plans.map(({months}) => [months,form.get(String(months))]));
      void run(async () => {await api('admin/plans',{method:'PUT',data:{prices,instructions:form.get('instructions')}});await load();setMessage('Plans saved.');});
    }}><h2>Plans and payment instructions</h2><div className="form-grid">{plans.plans.map((plan) => <label key={plan.months}>{terms[plan.months]} (ETB)<input name={plan.months} inputMode="decimal" defaultValue={plan.price ?? ''} placeholder="Leave blank to disable" /></label>)}</div>
      <label>Payment instructions<textarea name="instructions" defaultValue={plans.instructions} /></label><button className="primary" disabled={busy}>Save plans</button></form>}
    {tab === 'audit' && <><h2>Audit history</h2><ul className="rows">{items.map((entry) => <li key={entry.id}><span>{entry.action} · {entry.subject}</span><small>{new Date(entry.created_at).toISOString()}</small></li>)}</ul></>}
  </section>;
}
