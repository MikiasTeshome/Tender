'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import './staff.css';

const listingFields = [
  ['title', 'Title', true],
  ['issuer', 'Issuer', true],
  ['region', 'Region', true],
  ['reference', 'Procurement reference'],
  ['lot', 'Lot number'],
  ['sourceUrl', 'Original notice URL', false, 'url'],
];
const vehicleFields = [
  ['location', 'Vehicle location', true],
  ['make', 'Make'],
  ['model', 'Model'],
  ['year', 'Year'],
  ['mileage', 'Mileage'],
];
const terms = {1: 'Monthly', 3: 'Quarterly', 6: 'Half-year', 12: 'Annual'};
const statusFilters = [
  ['all', 'All'],
  ['draft', 'Draft'],
  ['active', 'Active'],
  ['cancelled', 'Cancelled'],
];

function localDeadline(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.valueOf())
    ? new Date(date.valueOf() + 10800000).toISOString().slice(0, 16)
    : '';
}

function statusBadge(status) {
  const key = status === 'active' || status === 'draft' || status === 'cancelled' ? status : '';
  return <span className={'staff-badge ' + key}>{status || 'unknown'}</span>;
}

export default function Admin({api, onBack}) {
  const [tab, setTab] = useState('listings');
  const [items, setItems] = useState([]);
  const [item, setItem] = useState(null);
  const [review, setReview] = useState(null);
  const [vehicle, setVehicle] = useState(false);
  const [formId, setFormId] = useState(0);
  const [plans, setPlans] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = useCallback(async () => {
    if (tab === 'plans') setPlans(await api('plans'));
    else setItems(await api('admin/' + tab));
  }, [api, tab]);

  useEffect(() => {
    load().catch((error) => setMessage(error.message));
  }, [load]);

  async function run(action) {
    setMessage('');
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function edit(entry, queue, asVehicle = false) {
    setItem(entry);
    setReview(queue);
    setVehicle(entry?.vehicle ?? queue?.payload?.vehicle ?? asVehicle);
    setFormId((id) => id + 1);
    setItems([]);
    setTab('listings');
    if (tab === 'listings') void load().catch((error) => setMessage(error.message));
  }

  function chooseTab(next) {
    setTab(next);
    setItems([]);
    setMessage('');
    setItem(null);
    setReview(null);
  }

  const values = item
    ? {...item, ...item.details, status: item.workflowStatus ?? item.status}
    : {...review?.payload};

  const listingRows = useMemo(() => {
    if (tab !== 'listings') return items;
    if (statusFilter === 'all') return items;
    return items.filter((entry) => entry.status === statusFilter);
  }, [items, statusFilter, tab]);

  const paymentRows = useMemo(() => {
    if (tab !== 'payments') return items;
    return [...items].sort((a, b) => Number(b.status === 'pending') - Number(a.status === 'pending'));
  }, [items, tab]);

  return <section className="staff-console">
    <div className="staff-split">
      <div>
        <p className="staff-eyebrow">Staff console · Fanos Tender only</p>
        <h1>Manage the directory</h1>
      </div>
      {onBack && <button type="button" className="staff-outline" onClick={onBack}>Back to site</button>}
    </div>

    <div className="staff-guide">
      <strong>How publishing works</strong>
      <ol>
        <li>Staff only — issuers supply materials offline; they do not log into admin.</li>
        <li>Create a draft tender or vehicle lot from the official notice / authorized photos.</li>
        <li>Set status to Active (free or paid) when ready for the public directory.</li>
        <li>Verify bank payment references here after bidders submit them on the website.</li>
      </ol>
    </div>

    <div className="staff-tabs" role="tablist" aria-label="Staff sections">
      {[
        ['listings', 'Listings'],
        ['review', 'Import review'],
        ['payments', 'Payments'],
        ['plans', 'Plan settings'],
        ['audit', 'Audit history'],
      ].map(([key, label]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={key === tab}
          className={key === tab ? 'selected' : ''}
          onClick={() => chooseTab(key)}
        >
          {label}
        </button>
      ))}
    </div>

    {message && <p role="status" className="staff-callout">{message}</p>}

    {tab === 'listings' && <>
      <div className="staff-split">
        <h2>
          {item ? 'Edit listing' : review ? 'Review imported notice' : vehicle ? 'New vehicle lot' : 'New tender'}
        </h2>
        <div className="staff-inline">
          <button type="button" className="staff-outline" onClick={() => edit(null, null, false)}>New tender</button>
          <button type="button" className="staff-outline" onClick={() => edit(null, null, true)}>New vehicle lot</button>
        </div>
      </div>
      <p className="staff-note">
        {vehicle
          ? 'Vehicle lots need at least one authorized photo. Cover stays public; extra photos follow paid access.'
          : 'Enter the issuer notice details. Use Draft until the listing is ready to publish.'}
      </p>

      <form
        key={formId}
        className="staff-stack"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          data.set('deadline', data.get('deadline') + ':00+03:00');
          data.set('vehicle', String(vehicle));
          if (review) data.set('reviewKey', review.source_key);
          void run(async () => {
            await api('admin/listings' + (item ? '/' + item.id : ''), {method: item ? 'PUT' : 'POST', data});
            edit(null, null, vehicle);
            setMessage('Listing saved.');
            await load();
          });
        }}
      >
        <div className="staff-form-grid">
          {listingFields.map(([key, label, required, type]) => (
            <label key={key}>
              {label}
              <input name={key} type={type ?? 'text'} required={required} defaultValue={values[key] ?? ''} />
            </label>
          ))}
          <label>
            Issuer sector
            <select name="sector" defaultValue={values.sector ?? (vehicle ? 'private' : 'public')}>
              <option value="public">Public</option>
              <option value="ngo">NGO</option>
              <option value="private">Private</option>
            </select>
          </label>
          <label>
            Closing date and time (EAT)
            <input type="datetime-local" name="deadline" required defaultValue={localDeadline(values.deadline)} />
          </label>
          <label>
            Access
            <select name="access" defaultValue={values.access ?? 'free'}>
              <option value="free">Free</option>
              <option value="paid">Paid (subscriber unlock)</option>
            </select>
          </label>
          <label>
            Publish status
            <select name="status" defaultValue={values.status ?? 'draft'}>
              <option value="draft">Draft — staff only</option>
              <option value="active">Active — public directory</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </label>
          {vehicle && <>
            <label>
              Condition
              <select name="condition" required defaultValue={values.condition ?? ''}>
                <option value="">Choose a condition</option>
                <option value="used">used</option>
                <option value="damaged">damaged</option>
                <option value="salvage">salvage</option>
              </select>
            </label>
            {vehicleFields.map(([key, label, required]) => (
              <label key={key}>
                {label}
                <input name={key} required={required} defaultValue={values[key] ?? ''} />
              </label>
            ))}
          </>}
        </div>
        <label>
          Notice details
          <textarea name="description" defaultValue={values.description ?? ''} />
        </label>
        {vehicle && <>
          <label>
            Verified bidding instructions
            <textarea name="instructions" defaultValue={values.instructions ?? ''} />
          </label>
          <label>
            Inspection details
            <textarea name="inspection" defaultValue={values.inspection ?? ''} />
          </label>
          <label>
            {item?.photos?.length ? 'Replace photos (optional)' : 'Vehicle photos'}
            <input type="file" name="images" multiple required={!item?.photos?.length} accept="image/jpeg,image/png,image/webp" />
          </label>
          <p className="staff-note">
            Up to five JPEG, PNG, or WebP photos, 3 MB each. The first photo is the public cover for active paid vehicle listings.
            {item?.photos?.length ? ' Uploading new files replaces the entire gallery.' : ''}
          </p>
          <label className="staff-check">
            <input name="authorized" type="checkbox" required={!item?.photos?.length} />
            The issuer supplied or authorized these photos
          </label>
        </>}
        <button type="submit" className="staff-primary" disabled={busy}>
          {item ? 'Save changes' : vehicle ? 'Save vehicle lot' : 'Save tender'}
        </button>
      </form>

      <h3>Directory listings</h3>
      <div className="staff-filter" role="group" aria-label="Filter by status">
        {statusFilters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={statusFilter === key ? 'on' : ''}
            onClick={() => setStatusFilter(key)}
          >
            {label}
          </button>
        ))}
      </div>
      {!listingRows.length && <div className="staff-empty">No listings in this filter.</div>}
      <ul className="staff-rows">
        {listingRows.map((entry) => (
          <li key={entry.id}>
            <span>
              <strong>{entry.title}</strong>
              {statusBadge(entry.status)}
              {entry.access === 'paid' && <span className="staff-badge paid">paid</span>}
              <br />
              <small>
                {entry.vehicle ? 'Vehicle' : entry.sector} · {entry.issuer} · {entry.region}
              </small>
            </span>
            <button
              type="button"
              className="staff-outline"
              onClick={() => {
                edit(entry, null);
                window.scrollTo(0, 0);
              }}
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
    </>}

    {tab === 'review' && <>
      <h2>Import review</h2>
      <p className="staff-note">Incomplete feed notices wait here. Review opens the listing form so staff can finish and publish.</p>
      {!items.length && <div className="staff-empty">No notices waiting for review.</div>}
      <ul className="staff-rows">
        {items.map((entry) => (
          <li key={entry.source_key}>
            <span>
              <strong>{entry.payload?.title ?? 'Untitled notice'}</strong>
              <br />
              <small>{entry.reason}</small>
            </span>
            <button type="button" className="staff-outline" onClick={() => edit(null, entry)}>Review</button>
          </li>
        ))}
      </ul>
    </>}

    {tab === 'payments' && <>
      <h2>Payment verification</h2>
      <p className="staff-note">
        Bidders submit bank references on the website. Approve only after you confirm the deposit with the payment provider.
      </p>
      {!paymentRows.length && <div className="staff-empty">No payment references submitted.</div>}
      <ul className="staff-rows">
        {paymentRows.map((entry) => (
          <li key={entry.id}>
            <span>
              <strong>{entry.email}</strong>
              <span className={'staff-badge ' + (entry.status === 'pending' ? 'pending' : entry.status === 'approved' ? 'active' : 'cancelled')}>
                {entry.status}
              </span>
              <br />
              <small>
                {entry.reference} · {terms[entry.months]} · ETB {entry.price}
              </small>
            </span>
            {entry.status === 'pending' && (
              <div className="staff-inline">
                {['approved', 'rejected'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    className={status === 'approved' ? 'staff-primary' : 'staff-outline'}
                    disabled={busy}
                    onClick={() => {
                      const ok = window.confirm(
                        status === 'approved'
                          ? 'Confirm that you verified this payment with the bank / payment provider.'
                          : 'Reject this payment reference?',
                      );
                      if (!ok) return;
                      void run(async () => {
                        await api('admin/payments/' + entry.id, {method: 'PUT', data: {status}});
                        await load();
                        setMessage('Payment ' + status + '.');
                      });
                    }}
                  >
                    {status === 'approved' ? 'Approve' : 'Reject'}
                  </button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>
    </>}

    {tab === 'plans' && plans && (
      <form
        className="staff-stack"
        onSubmit={(event) => {
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const prices = Object.fromEntries(plans.plans.map(({months}) => [months, form.get(String(months))]));
          void run(async () => {
            await api('admin/plans', {method: 'PUT', data: {prices, instructions: form.get('instructions')}});
            await load();
            setMessage('Plans saved.');
          });
        }}
      >
        <h2>Plans and payment instructions</h2>
        <p className="staff-note">Blank prices disable that term. Instructions are shown on the website subscription screen.</p>
        <div className="staff-form-grid">
          {plans.plans.map((plan) => (
            <label key={plan.months}>
              {terms[plan.months]} (ETB)
              <input name={plan.months} inputMode="decimal" defaultValue={plan.price ?? ''} placeholder="Leave blank to disable" />
            </label>
          ))}
        </div>
        <label>
          Payment instructions
          <textarea name="instructions" defaultValue={plans.instructions} />
        </label>
        <button type="submit" className="staff-primary" disabled={busy}>Save plans</button>
      </form>
    )}

    {tab === 'audit' && <>
      <h2>Audit history</h2>
      {!items.length && <div className="staff-empty">No audit events yet.</div>}
      <ul className="staff-rows">
        {items.map((entry) => (
          <li key={entry.id}>
            <span>{entry.action} · {entry.subject}</span>
            <small>{new Date(entry.created_at).toISOString()}</small>
          </li>
        ))}
      </ul>
    </>}
  </section>;
}
