'use client';

import Brand from '../brand.jsx';

import { useState } from 'react';
import { Icon, sectionIcons } from '../stitch-ui.jsx';
import { AccessBadge, ListingStack, Photo, VehicleRailCard } from './components.jsx';
import { cleanTitle, conditionLabel, errorText, formatDeadline, sections, shortLabels, terms } from './utils.js';

export function HomeScreen({q, setQ, items, busy, error, onSection, onOpen, onProfile}) {
  const vehicles = items.filter((item) => item.vehicle).slice(0, 4);
  const openNow = items.filter((item) => !item.vehicle);
  return <section className="catalog is-home">
    <div className="phone-top phone-only">
      <div className="app-home-bar">
        <div className="page-head">
          <Brand />
        </div>
        <button type="button" className="avatar-btn" onClick={onProfile} aria-label="Profile">
          <span className="avatar"><Icon name="user" size={20} /></span>
        </button>
      </div>
      <div className="search-wrap">
        <Icon name="search" size={18} />
        <input
          type="search"
          aria-label="Search Ethiopian tenders & auctions"
          placeholder="Search Ethiopian tenders & auctions..."
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>
    </div>
    <div className="desk-home-intro desk-only">
      <div>
        <h1 className="serif desk-home-title">Fanos Tender</h1>
        <p className="desk-home-tagline">Find a bid. Judge the lot. Bid with the issuer.</p>
      </div>
    </div>
    <div className="section-tiles">
      {sections.map(([key, label, icon]) => (
        <button key={key} type="button" className={'section-tile sector-' + key} onClick={() => onSection(key)}>
          <span className="tile-ico"><Icon name={icon || sectionIcons[key]} size={22} /></span>
          <strong>{shortLabels[key] || label}</strong>
        </button>
      ))}
    </div>
    <div className="home-board">
      {!!vehicles.length && <div className="home-strip">
        <div className="strip-head">
          <h2><Icon name="car" size={18} /> Vehicle Bids</h2>
          <button type="button" className="link" onClick={() => onSection('vehicle')}>View all ›</button>
        </div>
        <div className="m-grid">
          {vehicles.map((item) => <VehicleRailCard key={item.id} item={item} onOpen={onOpen} />)}
        </div>
      </div>}
      {!!openNow.length && <div className="home-open-now">
        <div className="strip-head">
          <h2 className="section-label">Open now</h2>
        </div>
        <ListingStack items={openNow} onOpen={onOpen} />
      </div>}
      {error && (vehicles.length > 0 || openNow.length > 0) && <p role="alert" className="m-inline-error">{error}</p>}
      {!vehicles.length && !openNow.length && (
        <div className={'feed-empty' + (error ? ' is-error' : '')} role={error ? 'alert' : 'status'}>
          <strong>{busy ? 'Loading…' : error ? 'Listings unavailable' : 'No open lots'}</strong>
          <p>{error || (busy ? 'Fetching tenders and vehicles.' : 'Check back soon for active bids.')}</p>
        </div>
      )}
    </div>
  </section>;
}

export function CatalogScreen({section, q, setQ, condition, setCondition, items, busy, error, onSection, onOpen, onHome, onProfile, onAlerts}) {
  const title = sections.find(([key]) => key === section)?.[1] || 'Search results';
  const vehicleChips = [['', 'All'], ['used', 'Used'], ['damaged', 'Damaged'], ['salvage', 'Salvage']];
  const countLabel = busy && !items.length
    ? 'Loading…'
    : error && !items.length
      ? error
      : section === 'vehicle'
        ? `Showing ${items.length} vehicles`
        : `${items.length} open`;
  return <section className={'catalog is-catalog' + (section === 'vehicle' ? ' section-vehicle' : '')} data-section={section || 'all'}>
    <div className="list-topbar phone-only">
      <button type="button" className="icon-btn" onClick={onHome} aria-label="Back"><Icon name="back" size={22} /></button>
      <div className="page-head"><h1>{title}</h1></div>
      <button type="button" className="avatar-btn" onClick={onProfile} aria-label="Profile">
        <span className="avatar"><Icon name="user" size={18} /></span>
      </button>
    </div>
    <div className="desk-catalog-head desk-only">
      <div>
        <p className="eyebrow">Browse</p>
        <div className="page-head"><h1>{title}</h1></div>
      </div>
      <div className="desk-catalog-meta">
        <p>{countLabel}</p>
        <button type="button" className="link" onClick={onHome}>Back to home</button>
      </div>
    </div>
    <div className="search-wrap phone-only">
      <Icon name="search" size={18} />
      <input
        type="search"
        aria-label="Search Ethiopian tenders & auctions"
        placeholder="Search Ethiopian tenders & auctions..."
        value={q}
        onChange={(event) => setQ(event.target.value)}
      />
    </div>
    <div className="section-tiles catalog-tiles" aria-label="Categories">
      {sections.map(([key, label, icon]) => (
        <button
          key={key}
          type="button"
          className={'section-tile sector-' + key + (section === key ? ' is-active' : '')}
          onClick={() => onSection(key)}
        >
          <span className="tile-ico"><Icon name={icon || sectionIcons[key]} size={22} /></span>
          <strong>{shortLabels[key] || label}</strong>
        </button>
      ))}
    </div>
    {section === 'vehicle' && (
      <div className="chip-row catalog-chips">
        {vehicleChips.map(([value, label]) => (
          <button
            type="button"
            key={label}
            className={((!condition && !value) || condition === value) ? 'chip on' : 'chip'}
            onClick={() => setCondition(value)}
          >{label}</button>
        ))}
      </div>
    )}
    <div className="list-count phone-only">
      <p>{countLabel}</p>
      <button type="button" className="link" onClick={onHome}>Back to home</button>
    </div>
    {section === 'private' && (
      <div className="tier-banner">
        <Icon name="shield" size={16} />
        <div><strong>Commercial & Private</strong><span> Enterprise tier access preview</span></div>
      </div>
    )}
    {section === 'ngo' && (
      <div className="notify-card">
        <p>Need more humanitarian bids?</p>
        <button type="button" className="primary wide" onClick={onAlerts || onHome}>
          <Icon name="bell" size={16} /> View Alerts
        </button>
      </div>
    )}
    {busy && !items.length ? <p role="status">Loading opportunities…</p>
      : error && !items.length ? <div className="empty" role="alert">{error}</div>
      : items.length ? <ListingStack items={items} onOpen={onOpen} />
      : <div className="empty">No active opportunities match these filters.</div>}
  </section>;
}

export function DetailScreen({item, api, me, saved, onBack, onSave, onSubscribe, onSignIn}) {
  if (!item) return <p>Loading opportunity…</p>;
  const info = item.details ?? {};
  const facts = Object.entries({
    issuer: item.issuer,
    region: item.region,
    location: info.location,
    reference: info.reference,
    lot: info.lot,
    make: info.make,
    model: info.model,
    year: info.year,
    mileage: info.mileage,
  }).filter(([, value]) => value);
  const actionLabel = item.vehicle ? 'View bidding instructions' : 'View original notice';
  const unlockLabel = me
    ? (me.subscribed ? 'Subscription active' : 'View subscriptions')
    : 'Sign in to subscribe';
  const action = item.locked
    ? <button type="button" className="primary" onClick={me ? onSubscribe : onSignIn}>{unlockLabel}</button>
    : info.sourceUrl
      ? <a className="primary" href={info.sourceUrl} target="_blank" rel="noreferrer">{actionLabel}</a>
      : info.instructions
        ? <button type="button" className="primary" onClick={() => document.getElementById('bid-instructions')?.scrollIntoView({behavior: 'smooth'})}>{actionLabel}</button>
        : <button type="button" className="primary" disabled>{actionLabel}</button>;

  return <article className="detail-layout">
    <button type="button" className="text-back page-back" onClick={onBack}><Icon name="back" size={18} /> Back</button>
    {item.vehicle && <div className="detail-photo">
      {item.cover
        ? <img className="detail-cover" src={'/api/photos/' + item.cover} alt={item.title} />
        : <div className="detail-cover" />}
      {item.condition && item.condition !== 'used' && (
        <div className="condition-banner">{conditionLabel(item.condition)}</div>
      )}
      {item.locked && <div className="locked-photo-tag"><Icon name="lock" size={14} /> Extra photos locked</div>}
    </div>}
    <div className="detail-facts">
      <AccessBadge item={item} />
      {item.condition && <span className="badge">{conditionLabel(item.condition)}</span>}
      {info.lot && <span className="badge">Lot {info.lot}</span>}
    </div>
    <p className="eyebrow">{item.vehicle ? 'Vehicle bid' : item.sector}</p>
    <h1 className="serif detail-title">{cleanTitle(item.title)}</h1>
    <div className="deadline-box">
      <strong>Closing</strong>
      <span>{formatDeadline(item.deadline)} EAT</span>
    </div>
    {!!facts.length && (
      <dl className="spec-grid">
        {facts.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
      </dl>
    )}
    {item.locked ? (
      <div className="paywall-preview">
        <div className="locked-block">
          <Icon name="lock" size={18} />
          <div>
            <strong>Bidding instructions locked</strong>
            <p>Issuer, reference, lot, and closing time stay visible. Subscribe to unlock how to bid with the issuer{item.vehicle ? ' and the remaining photos' : ''}.</p>
          </div>
        </div>
        {item.vehicle && (
          <div className="locked-photos" aria-hidden="true">
            <div className="locked-photo-slot"><Icon name="lock" size={16} /><span>Photo 2</span></div>
            <div className="locked-photo-slot"><Icon name="lock" size={16} /><span>Photo 3</span></div>
          </div>
        )}
      </div>
    ) : <>
      {item.vehicle && item.photos?.some((id) => id !== item.cover) && (
        <div className="detail-photos">
          {item.photos.filter((id) => id !== item.cover).map((id) => <Photo key={id} id={id} api={api} />)}
        </div>
      )}
      {info.inspection && <div className="notice-text"><h3>Inspection notes</h3><p>{info.inspection}</p></div>}
      {info.description && <div className="notice-text"><h3>Description & scope</h3><p>{info.description}</p></div>}
      {info.instructions && <div className="notice-text" id="bid-instructions"><h3>Bidding instructions</h3><p>{info.instructions}</p></div>}
    </>}
    <aside className="detail-panel">
      {item.locked ? <>
        <h2 className="serif">Unlock this listing</h2>
        <ul className="paywall-list">
          <li>Visible now: issuer, reference, lot, closing (EAT)</li>
          <li>Locked: bidding instructions{item.vehicle ? ', extra photos' : ''}</li>
        </ul>
        <div className="desk-only detail-panel-actions">
          {action}
          {!me && <button type="button" className="outline" onClick={onSubscribe}>View plan prices</button>}
          <button type="button" className="outline" onClick={me ? onSave : onSignIn}>{saved ? 'Saved' : 'Save'}</button>
        </div>
      </> : <>
        <h2 className="serif">{actionLabel}</h2>
        {info.instructions && <div className="notice-text desk-only"><p>{info.instructions}</p></div>}
        <div className="desk-only detail-panel-actions">
          {action}
          {!info.instructions && !info.sourceUrl && <p>The issuer has not attached bidding instructions to this notice yet.</p>}
          <button type="button" className="outline" onClick={me ? onSave : onSignIn}>{saved ? 'Saved' : 'Save'}</button>
        </div>
      </>}
    </aside>
    <div className="detail-dock phone-only">
      <button type="button" className="save-fab" aria-label={saved ? 'Saved' : 'Save'} onClick={me ? onSave : onSignIn}>
        <Icon name="bookmark" size={18} />
      </button>
      {action}
    </div>
  </article>;
}

export function ProfileScreen({me, language, onLanguage, onSignIn, onSignOut, onAlerts, onSaved, onPlans, onStaff, savedCount = 0}) {
  return <section className="stitch-profile">
    <div className="profile-head">
      <div>
        <div className="page-head"><h1>Profile</h1></div>
        <p>Procurement Directory</p>
      </div>
      <button type="button" className="icon-btn" onClick={onAlerts} aria-label="Alerts"><Icon name="bell" /></button>
    </div>
    <div className="guest-card">
      <div className="guest-row">
        <div className="avatar guest"><Icon name="user" size={28} /></div>
        <div>
          <div className="name-row">
            <strong>{me?.email || 'Guest User'}</strong>
            {!me && <span className="badge browse-only">Browse-Only</span>}
            {me?.admin && <span className="badge paid">Superadmin</span>}
            {me?.subscribed && !me?.admin && <span className="badge paid">Subscriber</span>}
          </div>
          <p>{me
            ? (me.admin
              ? 'Superadmin — post notices, manage photos, plans, and payment approvals.'
              : me.subscribed
              ? 'Subscription active — paid listings unlocked'
              : 'Signed in · free account. Subscribe to unlock paid bidding instructions.')
            : 'Browse-only mode. Sign in to sync saved lots and submit a subscription payment reference.'}</p>
        </div>
      </div>
      <div className="stat-grid">
        <button type="button" className="stat" onClick={onSaved}>
          <Icon name="bookmark" size={16} /><span>Saved Lots</span><strong>{me ? String(savedCount) : '—'}</strong>
        </button>
        <button type="button" className="stat" onClick={onPlans}>
          <Icon name="gavel" size={16} /><span>Subscription</span><strong>{me?.subscribed ? 'Active' : 'Locked'}</strong>
        </button>
        <button type="button" className="stat" onClick={onAlerts}>
          <Icon name="bell" size={16} /><span>Alerts</span><strong>{me ? 'On' : 'Sign in'}</strong>
        </button>
      </div>
      {!me && <button type="button" className="primary wide" onClick={onSignIn}>Sign in <Icon name="arrow" size={18} /></button>}
      {me && !me.subscribed && !me.admin && <button type="button" className="primary wide" onClick={onPlans}>View subscriptions <Icon name="arrow" size={18} /></button>}
      {me?.admin && onStaff && (
        <button type="button" className="primary wide" onClick={onStaff}>
          Open Superadmin console <Icon name="arrow" size={18} />
        </button>
      )}
      {me && onSignOut && <button type="button" className="outline wide" onClick={onSignOut}>Sign out</button>}
    </div>
    <div className="verify-banner">
      <Icon name="shield" size={18} />
      <p>Official Commercial Bidding — Ministry & private fleet tenders verified daily across Ethiopia.</p>
    </div>
    <div className="pref-list">
      <div className="pref-row">
        <div>
          <Icon name="doc" size={18} />
          <div><strong>App Language</strong><small>Amharic (አማርኛ) available soon.</small></div>
        </div>
        <div className="lang mini" role="group" aria-label="Language">
          <button type="button" aria-pressed={language === 'en'} onClick={() => onLanguage('en')}>EN</button>
          <button type="button" aria-pressed={language === 'am'} disabled title="Amharic coming soon">አማ</button>
        </div>
      </div>
      <div className="pref-row">
        <div><Icon name="clock" size={18} /><div><strong>Timezone</strong><small>Synced to tender closing counters.</small></div></div>
        <span className="value-pill">EAT (UTC+3)</span>
      </div>
      <div className="pref-row">
        <div><Icon name="shield" size={18} /><div><strong>App Build</strong><small>Automotive procurement terminal.</small></div></div>
        <span className="value-pill">v1.0.4</span>
      </div>
    </div>
    <div className="info-box">
      <Icon name="info" size={16} />
      <p>Fanos Tender is an informational directory. Configure Supabase for sign-in and payment references if they are not available yet.</p>
    </div>
  </section>;
}

export function AuthScreen({client, onBack}) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    if (!client) return;
    setBusy(true);
    try {
      const {error} = sent
        ? await client.auth.verifyOtp({email, token: code, type: 'email'})
        : await client.auth.signInWithOtp({email});
      if (error) throw error;
      setSent(true);
      setMessage('Check your inbox for your sign-in code.');
    } catch (error) {
      setMessage(errorText(error));
    } finally {
      setBusy(false);
    }
  }

  return <section className="stitch-auth">
    <div className="stitch-subnav">
      <button type="button" className="text-back" onClick={onBack}><Icon name="back" size={18} /> Back to Profile</button>
    </div>
    <div className="auth-hero">
      <div className="auth-gavel"><Icon name="gavel" size={28} /></div>
      <h1>Sign in to Fanos Tender</h1>
      <p>Access official tenders, saved motor auctions, verified bank deposits, and critical closing alerts across your field devices.</p>
    </div>
    {!client ? (
      <div className="auth-notice" role="status">
        <Icon name="info" size={18} />
        <div>
          <strong>Sign-in is not configured</strong>
          <p>Supabase auth is not available on this deployment. Configure auth URL and key to enable email one-time codes.</p>
        </div>
      </div>
    ) : (
      <form className="auth-card" onSubmit={submit}>
        <div className="auth-steps" aria-hidden="true">
          <span className={'step' + (!sent ? ' on' : '')}><i>1</i>Tenderer Email</span>
          <span className="step-line" />
          <span className={'step' + (sent ? ' on' : '')}><i>2</i>Code Clearance</span>
        </div>
        {!sent ? <>
          <div className="field-head"><label htmlFor="proc-email">Official Procurement Email</label><span>Field Account</span></div>
          <div className="mail-input">
            <Icon name="mail" size={18} />
            <input id="proc-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@organization.et" />
          </div>
          <p className="field-hint">We will issue a one-time 6-digit access token for registered Ethiopian bidders.</p>
          <button className="primary wide" disabled={busy}>Send Code <Icon name="arrow" size={18} /></button>
        </> : <>
          <label htmlFor="otp-code">Code Clearance
            <input id="otp-code" inputMode="numeric" autoComplete="one-time-code" required value={code} onChange={(e) => setCode(e.target.value)} />
          </label>
          <button className="primary wide" disabled={busy}>Verify Code</button>
          <button type="button" className="ghost" onClick={() => {setSent(false); setMessage('');}}>Tenderer Email</button>
        </>}
        {message && <p role="status">{message}</p>}
      </form>
    )}
    <div className="trust-row">
      <span><Icon name="lock" size={14} /> End-to-End Encrypted</span>
      <span><Icon name="shield" size={14} /> Federal Gazette Compliant</span>
    </div>
    <p className="legal-note">
      By continuing you agree to the <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.
      Bid with the issuer — not on this site.
    </p>
  </section>;
}

export function SavedScreen({items, onOpen, onSignIn, guest = true}) {
  const [filter, setFilter] = useState('all');
  const vehicles = items.filter((item) => item.vehicle);
  const procurement = items.filter((item) => !item.vehicle);
  const shown = filter === 'vehicles' ? vehicles : filter === 'procurement' ? procurement : items;

  return <section className="stitch-saved">
    <div className="saved-status">
      <strong>{items.length} Saved lots</strong>
      <span className={'badge ' + (guest ? 'browse-only' : 'mint')}>{guest ? 'Sign in to sync' : 'Synced'}</span>
    </div>
    <div className="chip-row">
      <button type="button" className={filter === 'all' ? 'chip on' : 'chip'} onClick={() => setFilter('all')}>All Items ({items.length})</button>
      <button type="button" className={filter === 'vehicles' ? 'chip on' : 'chip'} onClick={() => setFilter('vehicles')}>Vehicles ({vehicles.length})</button>
      <button type="button" className={filter === 'procurement' ? 'chip on' : 'chip'} onClick={() => setFilter('procurement')}>Procurement ({procurement.length})</button>
    </div>
    <div className="saved-stack">
      {shown.map((item) => item.vehicle ? (
        <article key={item.id} className="saved-vehicle">
          <div className="saved-media">
            {item.cover ? <img src={'/api/photos/' + item.cover} alt="" /> : null}
            <span className={'cond-pill' + (item.condition !== 'used' ? ' warn' : '')}>{conditionLabel(item.condition)}</span>
            {item.details?.lot && <span className="lot-overlay">Lot #{item.details.lot}</span>}
            {(item.region || item.details?.location) && <span className="place-overlay">{item.region || item.details?.location}</span>}
          </div>
          <h3>{cleanTitle(item.title)}</h3>
          <div className="spec-row">
            {item.details?.mileage && <div><span>Odometer</span><strong>{item.details.mileage}</strong></div>}
            {item.details?.year && <div><span>Year</span><strong>{item.details.year}</strong></div>}
            {item.details?.make && <div><span>Make</span><strong>{item.details.make}</strong></div>}
          </div>
          <div className="deadline-bar warn"><Icon name="clock" size={14} /> Submission Deadline: {formatDeadline(item.deadline)} EAT</div>
          <button type="button" className="primary wide" onClick={() => onOpen(item.id)}>View Vehicle <Icon name="arrow" size={16} /></button>
        </article>
      ) : (
        <article key={item.id} className="saved-tender">
          <div className="tender-list-top">
            <AccessBadge item={item} />
            {item.details?.reference && <span className="ref-pill">Ref: {item.details.reference}</span>}
          </div>
          <p className="entity"><Icon name="building" size={14} /> {item.issuer}</p>
          <h3>{cleanTitle(item.title)}</h3>
          {item.details?.description && <p className="clamp">{item.details.description}</p>}
          <div className="deadline-bar mint"><Icon name="clock" size={14} /> Bid Box Submission: {formatDeadline(item.deadline)} EAT</div>
          <button type="button" className="primary wide" onClick={() => onOpen(item.id)}>View Tender →</button>
        </article>
      ))}
      {!shown.length && <div className="empty">
        <p>No saved opportunities yet.</p>
        {guest && onSignIn && <button type="button" className="primary" onClick={onSignIn}>Sign in to save lots</button>}
      </div>}
    </div>
    {guest && !!shown.length && (
      <div className="info-box">
        <Icon name="info" size={16} />
        <p>Sign in to keep saved lots synced across your devices.</p>
      </div>
    )}
  </section>;
}

export function AlertsScreen({me, items, onOpen, onHome, onSignIn}) {
  const vehicle = items.find((item) => item.vehicle) || items[0];
  const tender = items.find((item) => !item.vehicle) || items[1];
  return <section className="stitch-alerts">
    <div className="alerts-toolbar">
      <span className="value-pill">{me ? 'Your alerts' : 'Alerts'}</span>
      <button type="button" className="text-back" disabled title="Mark all read coming soon">Mark all read</button>
    </div>
    {!me ? (
      <div className="empty" role="status">
        <strong>Sign in for closing alerts</strong>
        <p>Real tender updates and deadline reminders will appear here when you are signed in. Push notifications are coming soon.</p>
        {onSignIn && <button type="button" className="primary" onClick={onSignIn}>Sign in</button>}
      </div>
    ) : (
      <div className="alert-stack">
        {vehicle && <article className="alert-card urgent">
          <div className="alert-ico warn"><Icon name="clock" size={18} /></div>
          <div>
            <div className="alert-top"><span className="badge warn-badge">Urgent Deadline</span><small>Closing · EAT</small></div>
            <h3>Closing Soon: {cleanTitle(vehicle.title)}</h3>
            <p>Bidding closes at {formatDeadline(vehicle.deadline)} EAT{vehicle.details?.lot ? ` (Lot #${vehicle.details.lot})` : ''}.</p>
            <div className="alert-action">
              <div><Icon name="car" size={16} /><span>{vehicle.issuer}</span></div>
              <button type="button" className="primary" onClick={() => onOpen(vehicle.id)}>Review Bid</button>
            </div>
          </div>
        </article>}
        {tender && <article className="alert-card update">
          <div className="alert-ico mint"><Icon name="doc" size={18} /></div>
          <div>
            <div className="alert-top"><span className="badge mint">Tender Update</span><small>Open notice · EAT</small></div>
            <h3>Open opportunity: {cleanTitle(tender.title)}</h3>
            <p>{tender.issuer} — closing {formatDeadline(tender.deadline)} EAT.</p>
            <div className="alert-action file">
              <Icon name="doc" size={16} />
              <span>{tender.details?.reference || 'Notice'}</span>
              <Icon name="download" size={16} />
            </div>
          </div>
        </article>}
        {!vehicle && !tender && (
          <div className="empty" role="status">
            <strong>No alerts yet</strong>
            <p>Closing reminders and tender updates will show here as listings change. Push notifications are coming soon.</p>
          </div>
        )}
      </div>
    )}
    <button type="button" className="primary wide" onClick={onHome}><Icon name="back" size={16} /> Return to Tender Dashboard</button>
    <div className="info-box">
      <Icon name="shield" size={16} />
      <p>{me
        ? 'Alerts reflect open listings on your account. Personalized push notifications are coming soon.'
        : 'Sign in to receive closing alerts for Ethiopian procurement and vehicle bids.'}</p>
    </div>
  </section>;
}

const previewSubscriptionPlans = [
  {months: 1, price: 500},
  {months: 3, price: 1275},
  {months: 6, price: 1860},
  {months: 12, price: 3240},
];

function subscriptionSavings(plan, monthlyPrice) {
  const regularPrice = monthlyPrice * plan.months;
  return plan.price && regularPrice > 0
    ? Math.round((1 - Number(plan.price) / regularPrice) * 100)
    : 0;
}

export function HomePricing({plans, onSelect}) {
  const configuredPlans = plans?.plans?.filter((plan) => plan.price) ?? [];
  const offers = configuredPlans.length ? configuredPlans : previewSubscriptionPlans;
  const monthlyPrice = Number(offers.find((plan) => plan.months === 1)?.price);

  return <section className="home-pricing" aria-labelledby="home-pricing-title">
    <header>
      <h2 id="home-pricing-title">Subscription pricing</h2>
      {!configuredPlans.length && <p>Preview prices</p>}
    </header>
    <div className="home-pricing-grid">
      {offers.map((plan) => {
        const recommended = plan.months === 6;
        const savings = subscriptionSavings(plan, monthlyPrice);
        const title = plan.months === 12 ? '1 year' : plan.months === 1 ? '1 month' : plan.months + ' months';
        return <article className={'home-pricing-card' + (recommended ? ' recommended' : '')} key={plan.months}>
          {recommended && <div className="home-pricing-banner">Recommended</div>}
          <h3>{title}</h3>
          <p className="home-pricing-total">{Number(plan.price).toLocaleString('en-ET')} birr</p>
          <p className="home-pricing-savings">{savings > 0 && <span className="badge">Save {savings}%</span>}</p>
          <button type="button" className={recommended ? 'primary wide' : 'outline wide'} onClick={() => onSelect(plan.months)} aria-label={'View ' + title + ' plan'}>View plan</button>
          <ul>
            <li>Access paid tender details</li>
            <li>View vehicle bidding instructions</li>
            <li>Save tenders to revisit</li>
          </ul>
        </article>;
      })}
    </div>
    <style>{`
      .home-pricing { margin: 32px auto; padding: clamp(18px, 3vw, 40px); width: 100%; max-width: 1180px; border-radius: var(--radius-card); background: var(--paper); color: var(--green); }
      .home-pricing > header { text-align: center; margin-bottom: 24px; }
      .home-pricing h2 { margin: 0; font: 800 clamp(1.65rem, 4vw, 2.6rem)/1.15 var(--serif); }
      .home-pricing header p { margin: 8px 0 0; }
      .home-pricing-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
      .home-pricing-card { position: relative; display: flex; flex-direction: column; align-items: stretch; text-align: center; padding: 54px 16px 22px; background: var(--card); border: 1px solid var(--line); border-radius: var(--radius-tile); overflow: hidden; }
      .home-pricing-card.recommended { border-color: var(--green); box-shadow: var(--shadow); }
      .home-pricing-banner { position: absolute; inset: 0 0 auto; padding: 9px 6px; font-weight: 800; background: var(--green); color: white; }
      .home-pricing-card h3 { margin: 0; font-size: 1.05rem; }
      .home-pricing-total { margin: 6px 0; font-size: clamp(1.4rem, 2.6vw, 2.15rem); font-weight: 800; font-variant-numeric: tabular-nums; }
      .home-pricing-savings { margin: 0 0 14px; min-height: 24px; }
      .home-pricing-card ul { display: grid; gap: 10px; margin: 20px 0 0; padding: 0; text-align: left; list-style: none; font-size: .88rem; }
      .home-pricing-card li { display: flex; gap: 8px; }
      .home-pricing-card li::before { content: '✓'; font-weight: 800; }
      @media (max-width: 920px) { .home-pricing-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
      @media (max-width: 540px) { .home-pricing-grid { grid-template-columns: minmax(0, 1fr); } .home-pricing-card:not(.recommended) { padding-top: 22px; } }
    `}</style>
  </section>;
}

export function PlansScreen({me, plans, plansError, payments, term, setTerm, reference, setReference, onSubmit, onAuth, onBack}) {
  const priced = plans?.plans?.filter((plan) => plan.price) ?? [];
  const showPreviewPrices = !!plansError || (!!plans && !priced.length);
  const visiblePlans = showPreviewPrices
    ? previewSubscriptionPlans
    : plans?.plans ?? [];
  const monthlyPrice = Number(visiblePlans.find((plan) => plan.months === 1)?.price);
  return <section className="stitch-plans">
    <button type="button" className="text-back" onClick={onBack}><Icon name="back" size={18} /> Back</button>
    <div className="page-head"><h1 className="serif">Subscriptions</h1></div>
    <p className="plans-lead">Unlock paid tenders and vehicle bidding instructions. Purchase stays on the website — the iOS and Android apps use the same account after sign-in.</p>
    {me?.subscribed && (
      <div className="verify-banner">
        <Icon name="shield" size={18} />
        <p>Subscription active{me.expiresAt ? ` until ${formatDeadline(me.expiresAt)} EAT` : ''}.</p>
      </div>
    )}
    {plansError && <div className="empty" role="alert">{plansError}</div>}
    {(plans || showPreviewPrices) ? <>
      <div className="plans">
        {visiblePlans.map((plan) => {
          const savings = subscriptionSavings(plan, monthlyPrice);
          return <button
            key={plan.months}
            type="button"
            className={'plan ' + (String(plan.months) === term ? 'selected' : '')}
            disabled={showPreviewPrices || !plan.price}
            onClick={() => setTerm(String(plan.months))}
          >
            <strong>{terms[plan.months]}</strong>
            <span>{plan.price ? 'ETB ' + Number(plan.price).toLocaleString('en-ET') : 'Unavailable'}</span>
            {savings > 0 && <span className="badge">Save {savings}%</span>}
            {plan.months === 6 && !!plan.price && <span className="badge">Recommended</span>}
          </button>;
        })}
      </div>
      {showPreviewPrices && <p role="status">Preview prices. Payments are unavailable until Staff configures the subscription plans.</p>}
      {plans?.instructions
        ? <div className="notice-text pay-instructions"><h3>Payment instructions</h3><p>{plans.instructions}</p></div>
        : <div className="empty">Payment instructions are not configured yet.</div>}
    </> : !plansError && <p role="status">Loading plans…</p>}
    {me ? (
      <form className="stack" onSubmit={onSubmit}>
        <label>Transaction reference
          <input value={reference} onChange={(event) => setReference(event.target.value)} required placeholder="Bank deposit reference" />
        </label>
        <button type="submit" className="primary wide" disabled={!plans?.instructions || !priced.some((plan) => String(plan.months) === term)}>
          Submit for verification
        </button>
      </form>
    ) : (
      <button type="button" className="primary wide" onClick={onAuth}>Sign in to submit a reference</button>
    )}
    {!!payments.length && <>
      <h3>Payment history</h3>
      <ul className="rows">
        {payments.map((payment) => (
          <li key={payment.id}>
            <span>{terms[payment.months]} · ETB {payment.price} · {payment.reference}</span>
            <span className="badge">{payment.status}</span>
          </li>
        ))}
      </ul>
    </>}
  </section>;
}

