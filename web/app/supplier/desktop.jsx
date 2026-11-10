'use client';

import { useMemo, useState } from 'react';
import { Icon, sectionIcons } from '../stitch-ui.jsx';
import { Photo } from './components.jsx';
import { cleanTitle, closingInfo, conditionLabel, formatDeadline, sections, shortLabels } from './utils.js';
import './desktop.css';

const conditionOptions = [['', 'Any condition'], ['used', 'Running'], ['damaged', 'Damaged'], ['salvage', 'Salvage']];

function Access({item}) {
  if (item.access !== 'paid') return <span className="dx-pill free">Free</span>;
  return <span className="dx-pill paid">{item.locked ? 'Subscriber' : 'Unlocked'}</span>;
}

function Closing({deadline, long = false}) {
  const info = closingInfo(deadline);
  return <span className={'dx-closing ' + info.tone}>
    <Icon name="clock" size={13} />
    {info.label}{long && <small> · {formatDeadline(deadline)} EAT</small>}
  </span>;
}

export function DeskHeader({
  q, setQ, section, counts, screen, onSection, onHome, onSaved, onAlerts, onPlans,
  onProfile, onSignIn, onStaff, language, onLanguage, me, savedCount,
}) {
  const bar = [['', 'All bids', 'home', counts.all], ...sections.map(([key, label, icon]) => [key, label, icon, counts[key]])];
  const browsing = screen === 'catalog' || screen === 'home';
  return <header className="dx-header">
    <div className="dx-top">
      <div className="dx-wrap dx-top-row">
        <button type="button" className="dx-brand" onClick={onHome}>
          <span className="dx-mark"><Icon name="gavel" size={20} /></span>
          <span><strong>Bid Ethiopia</strong><small>Tenders &amp; vehicle bids</small></span>
        </button>
        <form className="dx-search" role="search" onSubmit={(event) => event.preventDefault()}>
          <select aria-label="Category" value={section} onChange={(event) => onSection(event.target.value)}>
            <option value="">All bids</option>
            {sections.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <input
            type="search"
            aria-label="Search tenders and vehicles"
            placeholder="Search tenders and vehicles"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
          <button type="submit" className="dx-search-btn"><Icon name="search" size={18} /> Search</button>
        </form>
        <nav className="dx-actions" aria-label="Account">
          <button type="button" className={screen === 'saved' ? 'on' : ''} onClick={onSaved}>
            <Icon name="bookmark" size={18} /> Saved{savedCount > 0 && <b>{savedCount}</b>}
          </button>
          <button type="button" className={screen === 'alerts' ? 'on' : ''} onClick={onAlerts}>
            <Icon name="bell" size={18} /> Alerts
          </button>
          <button type="button" className={screen === 'plans' ? 'on' : ''} onClick={onPlans}>
            <Icon name="gavel" size={18} /> Plans
          </button>
          {me?.admin && <button type="button" className={screen === 'staff' ? 'on' : ''} onClick={onStaff}>Staff</button>}
          <span className="dx-lang" role="group" aria-label="Language">
            <button type="button" aria-pressed={language === 'en'} onClick={() => onLanguage('en')}>EN</button>
            <button type="button" aria-pressed={language === 'am'} disabled title="Amharic coming soon">አማ</button>
          </span>
          {me
            ? <button type="button" className="dx-account" onClick={onProfile}><Icon name="user" size={18} /> Account</button>
            : <button type="button" className="dx-account" onClick={onSignIn}><Icon name="user" size={18} /> Sign in</button>}
        </nav>
      </div>
    </div>
    <div className="dx-catbar">
      <div className="dx-wrap dx-catbar-row">
        <nav aria-label="Categories">
          {bar.map(([key, label, icon, count]) => (
            <button
              key={key || 'all'}
              type="button"
              className={browsing && section === key ? 'on' : ''}
              aria-current={browsing && section === key ? 'page' : undefined}
              onClick={() => (key ? onSection(key) : onHome())}
            >
              <Icon name={icon === 'home' ? 'home' : icon || sectionIcons[key]} size={16} />
              {label}
              <em>{count ?? 0}</em>
            </button>
          ))}
        </nav>
        <p><Icon name="shield" size={14} /> Bid with the issuer — not on this site</p>
      </div>
    </div>
  </header>;
}

function VehicleCard({item, onOpen}) {
  const place = item.region || item.details?.location || 'Ethiopia';
  return <button type="button" className="dx-vcard" onClick={() => onOpen(item.id)}>
    <span className="dx-vcard-media">
      {item.cover ? <img src={'/api/photos/' + item.cover} alt="" loading="lazy" /> : <span className="dx-noimg"><Icon name="car" size={36} /></span>}
      <span className={'dx-tag' + (item.condition === 'damaged' || item.condition === 'salvage' ? ' warn' : '')}>{conditionLabel(item.condition)}</span>
      {item.details?.lot && <span className="dx-lot">Lot {item.details.lot}</span>}
      {item.access === 'paid' && item.locked && <span className="dx-lockchip"><Icon name="lock" size={12} /> Photos</span>}
    </span>
    <span className="dx-vcard-body">
      <strong>{cleanTitle(item.title)}</strong>
      <span className="dx-meta"><Icon name="pin" size={13} /> {place}</span>
      <span className="dx-meta">{item.issuer}</span>
      <span className="dx-vcard-foot"><Closing deadline={item.deadline} /><Access item={item} /></span>
    </span>
  </button>;
}

function TenderTable({items, onOpen}) {
  return <div className="dx-table-wrap">
    <table className="dx-table">
      <thead>
        <tr><th>Notice</th><th>Issuer</th><th>Region</th><th>Access</th><th>Closing (EAT)</th><th><span className="sr-only">Open</span></th></tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id} className={'sector-' + item.sector} onClick={() => onOpen(item.id)}>
            <td>
              <button type="button" className="dx-row-title" onClick={(event) => { event.stopPropagation(); onOpen(item.id); }}>
                {cleanTitle(item.title)}
              </button>
              {item.details?.reference && <small>Ref {item.details.reference}</small>}
            </td>
            <td>{item.issuer}</td>
            <td>{item.region || '—'}</td>
            <td><Access item={item} /></td>
            <td><Closing deadline={item.deadline} long /></td>
            <td className="dx-go"><Icon name="arrow" size={16} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>;
}

function Empty({busy, error, children}) {
  return <div className={'dx-empty' + (error ? ' error' : '')} role={error ? 'alert' : 'status'}>
    <strong>{busy ? 'Loading…' : error ? 'Listings unavailable' : children || 'Nothing here yet'}</strong>
    {error && <p>{error}</p>}
  </div>;
}

export function DeskHome({items, counts, busy, error, onSection, onOpen}) {
  const vehicles = items.filter((item) => item.vehicle);
  const tenders = items.filter((item) => !item.vehicle);
  const soon = useMemo(() => [...items]
    .filter((item) => item.status === 'active')
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 5), [items]);
  return <div className="dx-home">
    <div className="dx-hero">
      <aside className="dx-cats" aria-label="Browse categories">
        <h2>Categories</h2>
        {sections.map(([key, label, icon]) => (
          <button key={key} type="button" onClick={() => onSection(key)}>
            <span className={'dx-cat-ico sector-' + key}><Icon name={icon || sectionIcons[key]} size={18} /></span>
            <span>{label}</span>
            <em>{counts[key] ?? 0}</em>
            <b>›</b>
          </button>
        ))}
      </aside>
      <section className="dx-banner">
        <p className="dx-kicker">Ethiopia procurement directory</p>
        <h1>Find a bid. Judge the lot.<br />Bid with the issuer.</h1>
        <ol className="dx-steps">
          <li><b>1</b> Search tenders &amp; vehicle lots</li>
          <li><b>2</b> Check photos, condition &amp; closing</li>
          <li><b>3</b> Follow the issuer’s instructions</li>
        </ol>
        <div className="dx-banner-cta">
          <button type="button" className="dx-btn accent" onClick={() => onSection('vehicle')}><Icon name="car" size={18} /> Browse vehicles</button>
          <button type="button" className="dx-btn ghost" onClick={() => onSection('public')}>Browse tenders</button>
        </div>
      </section>
      <aside className="dx-soon" aria-label="Closing soon">
        <h2><Icon name="clock" size={16} /> Closing soon</h2>
        {soon.map((item) => (
          <button key={item.id} type="button" onClick={() => onOpen(item.id)}>
            <span className="dx-soon-thumb">
              {item.cover ? <img src={'/api/photos/' + item.cover} alt="" /> : <Icon name={item.vehicle ? 'car' : 'doc'} size={18} />}
            </span>
            <span><strong>{cleanTitle(item.title)}</strong><Closing deadline={item.deadline} /></span>
          </button>
        ))}
        {!soon.length && <p className="dx-muted">{busy ? 'Loading…' : 'No active lots yet.'}</p>}
      </aside>
    </div>

    {!!vehicles.length && <section className="dx-block">
      <div className="dx-block-head">
        <h2><Icon name="car" size={20} /> Vehicle bids <small>{vehicles.length} lots</small></h2>
        <button type="button" className="dx-link" onClick={() => onSection('vehicle')}>See all vehicles ›</button>
      </div>
      <div className="dx-grid dx-grid-4">
        {vehicles.slice(0, 8).map((item) => <VehicleCard key={item.id} item={item} onOpen={onOpen} />)}
      </div>
    </section>}

    <section className="dx-block">
      <div className="dx-block-head">
        <h2><Icon name="doc" size={20} /> Open tenders <small>{tenders.length} notices</small></h2>
        <button type="button" className="dx-link" onClick={() => onSection('public')}>See all tenders ›</button>
      </div>
      {tenders.length
        ? <TenderTable items={tenders.slice(0, 8)} onOpen={onOpen} />
        : <Empty busy={busy} error={error}>No open tenders</Empty>}
    </section>
  </div>;
}

function FilterGroup({title, children}) {
  return <fieldset className="dx-filter"><legend>{title}</legend>{children}</fieldset>;
}

export function DeskCatalog({
  section, q, condition, setCondition, items, counts, busy, error, onSection, onOpen, onHome,
}) {
  const [access, setAccess] = useState('');
  const [region, setRegion] = useState('');
  const [sort, setSort] = useState('closing');
  const title = sections.find(([key]) => key === section)?.[1] || (q ? `Results for “${q}”` : 'All bids');
  const regions = useMemo(() => [...new Set(items.map((item) => item.region).filter(Boolean))].sort(), [items]);
  const shown = useMemo(() => {
    const list = items.filter((item) => (!access || item.access === access) && (!region || item.region === region));
    return list.sort((a, b) => sort === 'title'
      ? cleanTitle(a.title).localeCompare(cleanTitle(b.title))
      : new Date(a.deadline) - new Date(b.deadline));
  }, [items, access, region, sort]);
  const vehicles = shown.filter((item) => item.vehicle);
  const tenders = shown.filter((item) => !item.vehicle);
  const filtered = !!(access || region || condition);
  function reset() {
    setAccess('');
    setRegion('');
    setCondition('');
  }
  return <div className="dx-catalog">
    <nav className="dx-crumbs" aria-label="Breadcrumb">
      <button type="button" onClick={onHome}>Home</button><span>›</span><strong>{title}</strong>
    </nav>
    <div className="dx-catalog-body">
      <aside className="dx-sidebar" aria-label="Filters">
        <FilterGroup title="Category">
          {[['', 'All bids', counts.all], ...sections.map(([key, label]) => [key, label, counts[key]])].map(([key, label, count]) => (
            <button key={key || 'all'} type="button" className={'dx-opt' + (section === key ? ' on' : '')} onClick={() => onSection(key)}>
              <span>{label}</span><em>{count ?? 0}</em>
            </button>
          ))}
        </FilterGroup>
        {(section === 'vehicle' || !section) && (
          <FilterGroup title="Vehicle condition">
            {conditionOptions.map(([key, label]) => (
              <button key={key || 'any'} type="button" className={'dx-opt' + (condition === key ? ' on' : '')} onClick={() => setCondition(key)}>
                <span>{label}</span><em>{key ? counts[key] ?? 0 : counts.vehicle}</em>
              </button>
            ))}
          </FilterGroup>
        )}
        <FilterGroup title="Access">
          {[['', 'Any'], ['free', 'Free to view'], ['paid', 'Subscriber']].map(([key, label]) => (
            <button key={key || 'any'} type="button" className={'dx-opt' + (access === key ? ' on' : '')} onClick={() => setAccess(key)}>
              <span>{label}</span>
            </button>
          ))}
        </FilterGroup>
        {!!regions.length && (
          <FilterGroup title="Region">
            <select aria-label="Region" value={region} onChange={(event) => setRegion(event.target.value)}>
              <option value="">All regions</option>
              {regions.map((name) => <option key={name} value={name}>{name}</option>)}
            </select>
          </FilterGroup>
        )}
        <button type="button" className="dx-btn ghost dark wide" disabled={!filtered} onClick={reset}>Reset filters</button>
      </aside>

      <section className="dx-results" aria-live="polite">
        <div className="dx-results-head">
          <div>
            <h1>{title}</h1>
            <p>{busy && !items.length ? 'Loading…' : `${shown.length} ${shown.length === 1 ? 'result' : 'results'}`}</p>
          </div>
          <label className="dx-sort">Sort by
            <select value={sort} onChange={(event) => setSort(event.target.value)}>
              <option value="closing">Closing soonest</option>
              <option value="title">Title A–Z</option>
            </select>
          </label>
        </div>
        {!shown.length
          ? <Empty busy={busy && !items.length} error={error && !items.length}>No active opportunities match these filters.</Empty>
          : <>
            {!!vehicles.length && <div className="dx-grid dx-grid-3">
              {vehicles.map((item) => <VehicleCard key={item.id} item={item} onOpen={onOpen} />)}
            </div>}
            {!!tenders.length && <>
              {!!vehicles.length && <h2 className="dx-sub">Tenders</h2>}
              <TenderTable items={tenders} onOpen={onOpen} />
            </>}
          </>}
      </section>
    </div>
  </div>;
}

export function DeskSaved({items, guest, onOpen, onRestore, onHome}) {
  const vehicles = items.filter((item) => item.vehicle);
  const tenders = items.filter((item) => !item.vehicle);
  return <div className="dx-saved">
    <div className="dx-results-head">
      <div>
        <h1>Saved lots</h1>
        <p>{items.length} saved · {guest ? 'on this device only' : 'synced to your account'}</p>
      </div>
      <button type="button" className="dx-btn ghost dark" onClick={onHome}>Keep browsing</button>
    </div>
    {!items.length && <div className="dx-empty">
      <strong>No saved lots yet</strong>
      {guest && <button type="button" className="dx-link" onClick={onRestore}>Restore demo saved items</button>}
    </div>}
    {!!vehicles.length && <div className="dx-grid dx-grid-4">
      {vehicles.map((item) => <VehicleCard key={item.id} item={item} onOpen={onOpen} />)}
    </div>}
    {!!tenders.length && <>
      <h2 className="dx-sub">Tenders</h2>
      <TenderTable items={tenders} onOpen={onOpen} />
    </>}
  </div>;
}

export function DeskDetail({item, api, me, saved, section, onBack, onSave, onSubscribe, onSignIn, onSection}) {
  const info = item.details ?? {};
  const [active, setActive] = useState(item.cover || '');
  const photos = item.vehicle
    ? (item.locked ? [item.cover].filter(Boolean) : (item.photos?.length ? item.photos : [item.cover].filter(Boolean)))
    : [];
  const facts = [
    ['Issuer', item.issuer],
    ['Reference', info.reference],
    ['Lot', info.lot],
    ['Region', item.region],
    ['Location', info.location],
    ['Make', info.make],
    ['Model', info.model],
    ['Year', info.year],
    ['Mileage', info.mileage],
  ].filter(([, value]) => value);
  const closing = closingInfo(item.deadline);
  const sectionLabel = item.vehicle ? 'Vehicle Bids' : sections.find(([key]) => key === item.sector)?.[1] || 'Tenders';
  const actionLabel = item.vehicle ? 'View bidding instructions' : 'View original notice';

  let primary;
  if (item.locked) {
    primary = <button type="button" className="dx-btn accent wide" onClick={me ? onSubscribe : onSignIn}>
      <Icon name="lock" size={16} /> {me ? 'Unlock with a subscription' : 'Sign in to subscribe'}
    </button>;
  } else if (info.sourceUrl) {
    primary = <a className="dx-btn accent wide" href={info.sourceUrl} target="_blank" rel="noreferrer">{actionLabel} ↗</a>;
  } else if (info.instructions) {
    primary = <button type="button" className="dx-btn accent wide" onClick={() => document.getElementById('dx-instructions')?.scrollIntoView({behavior: 'smooth'})}>{actionLabel}</button>;
  } else {
    primary = <button type="button" className="dx-btn accent wide" disabled>{actionLabel}</button>;
  }

  return <article className="dx-detail">
    <nav className="dx-crumbs" aria-label="Breadcrumb">
      <button type="button" onClick={onBack}>Home</button><span>›</span>
      <button type="button" onClick={() => onSection(item.vehicle ? 'vehicle' : item.sector)}>{sectionLabel}</button><span>›</span>
      <strong>{cleanTitle(item.title)}</strong>
    </nav>
    <div className="dx-detail-grid">
      <div className="dx-detail-main">
        {item.vehicle && <div className="dx-gallery">
          <div className="dx-gallery-main">
            {active === item.cover || !active
              ? (item.cover ? <img src={'/api/photos/' + item.cover} alt={item.title} /> : <span className="dx-noimg"><Icon name="car" size={56} /></span>)
              : <Photo key={active} id={active} api={api} />}
            {item.condition && <span className={'dx-tag big' + (item.condition !== 'used' ? ' warn' : '')}>{conditionLabel(item.condition)}</span>}
          </div>
          <div className="dx-thumbs">
            {photos.map((id) => (
              <button key={id} type="button" className={id === active ? 'on' : ''} aria-label="Show photo" onClick={() => setActive(id)}>
                {id === item.cover ? <img src={'/api/photos/' + id} alt="" /> : <Photo id={id} api={api} />}
              </button>
            ))}
            {item.locked && [2, 3, 4].map((n) => (
              <span key={n} className="dx-thumb-lock" aria-hidden="true"><Icon name="lock" size={16} /><small>Photo {n}</small></span>
            ))}
          </div>
        </div>}

        <header className="dx-detail-head">
          <div className="dx-badges">
            <Access item={item} />
            {item.condition && <span className="dx-pill">{conditionLabel(item.condition)}</span>}
            {info.lot && <span className="dx-pill">Lot {info.lot}</span>}
            <span className="dx-pill demo">DEMO</span>
          </div>
          <h1>{cleanTitle(item.title)}</h1>
          <p className="dx-meta"><Icon name="building" size={14} /> {item.issuer}{item.region ? ` · ${item.region}` : ''}</p>
        </header>

        {item.locked ? (
          <section className="dx-locked">
            <Icon name="lock" size={22} />
            <div>
              <h2>Bidding instructions are for subscribers</h2>
              <p>Issuer, reference, lot, closing time{item.vehicle ? ' and the cover photo' : ''} stay visible. Subscribe to see how to bid with the issuer{item.vehicle ? ' and the full photo set' : ''}.</p>
            </div>
          </section>
        ) : <>
          {info.instructions && <section className="dx-section" id="dx-instructions"><h2>Bidding instructions</h2><p>{info.instructions}</p></section>}
          {info.inspection && <section className="dx-section"><h2>Inspection notes</h2><p>{info.inspection}</p></section>}
          {info.description && <section className="dx-section"><h2>Description &amp; scope</h2><p>{info.description}</p></section>}
          {!info.instructions && !info.sourceUrl && <section className="dx-section"><p>The issuer has not attached bidding instructions to this notice yet.</p></section>}
        </>}
      </div>

      <aside className="dx-panel" aria-label="Bid summary">
        <div className={'dx-panel-close ' + closing.tone}>
          <span>Closing</span>
          <strong>{closing.label}</strong>
          <small>{formatDeadline(item.deadline)} EAT</small>
        </div>
        <dl className="dx-facts">
          {facts.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{value}</dd></div>)}
        </dl>
        {primary}
        {item.locked && !me && <button type="button" className="dx-btn ghost dark wide" onClick={onSubscribe}>View plan prices</button>}
        <button type="button" className="dx-btn ghost dark wide" onClick={onSave}>
          <Icon name="bookmark" size={16} /> {saved ? 'Saved' : 'Save for later'}
        </button>
        <p className="dx-panel-note"><Icon name="shield" size={14} /> You bid with the issuer, not on this site.</p>
      </aside>
    </div>
  </article>;
}
