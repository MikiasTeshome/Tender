'use client';

import { useEffect, useState } from 'react';
import { Icon } from '../stitch-ui.jsx';
import { cleanTitle, conditionLabel, formatDeadline } from './utils.js';

export function AccessBadge({item}) {
  return <span className={item.access === 'paid' ? 'badge paid' : 'badge'}>
    {item.access === 'paid' ? 'Subscriber' : 'Free access'}
  </span>;
}

export function VehicleRailCard({item, onOpen}) {
  const place = (item.region || item.details?.location || 'Ethiopia').toUpperCase();
  return <article className="vehicle-rail-card">
    <button type="button" className="vehicle-rail-media" onClick={() => onOpen(item.id)}>
      {item.cover ? <img src={'/api/photos/' + item.cover} alt="" /> : <span>Vehicle</span>}
      <span className={'cond-pill' + (item.condition === 'damaged' || item.condition === 'salvage' ? ' warn' : '')}>
        {conditionLabel(item.condition)}
      </span>
      <span className="bookmark-fab" aria-hidden="true"><Icon name="bookmark" size={16} /></span>
    </button>
    <div className="vehicle-rail-body">
      <p className="rail-meta">
        <span className="place">{place}</span>
        <span>·</span>
        <Icon name="clock" size={14} />
        <span>Closing {formatDeadline(item.deadline)} EAT</span>
      </p>
      <h3>{cleanTitle(item.title)}</h3>
      <p className="issuer">{item.issuer}</p>
      <button type="button" className="primary wide" onClick={() => onOpen(item.id)}>
        View Vehicle <Icon name="arrow" size={16} />
      </button>
    </div>
  </article>;
}

export function TenderCard({item, onOpen}) {
  return <article className="tender-list-card">
    <div className="tender-list-top">
      <AccessBadge item={item} />
      <span className="badge demo">DEMO</span>
      {item.details?.reference && <span className="ref-pill">Ref: {item.details.reference}</span>}
    </div>
    <h3>{cleanTitle(item.title)}</h3>
    <p className="entity"><Icon name="building" size={14} /> {item.issuer}</p>
    {(item.region || item.details?.location) && (
      <p className="lot-place"><Icon name="pin" size={14} /> {item.region || item.details?.location}</p>
    )}
    <div className="deadline-bar mint">
      <Icon name="clock" size={14} /> Closing: {formatDeadline(item.deadline)} EAT
    </div>
    <div className="sourced-row"><Icon name="shield" size={14} /> Sourced Directly</div>
    <button type="button" className="primary wide" onClick={() => onOpen(item.id)}>
      View Tender →
    </button>
  </article>;
}

export function VehicleCard({item, onOpen}) {
  return <article className="vehicle-list-card">
    <button type="button" className="vehicle-rail-media" onClick={() => onOpen(item.id)}>
      {item.cover ? <img src={'/api/photos/' + item.cover} alt="" /> : <span>Vehicle</span>}
      <span className={'cond-pill' + (item.condition === 'damaged' || item.condition === 'salvage' ? ' warn' : '')}>
        {conditionLabel(item.condition)}
      </span>
      <span className="bookmark-fab" aria-hidden="true"><Icon name="bookmark" size={16} /></span>
      {item.details?.lot && <span className="lot-overlay">Lot #{item.details.lot}</span>}
      {(item.region || item.details?.location) && (
        <span className="place-overlay">{item.region || item.details?.location}</span>
      )}
    </button>
    <div className="vehicle-rail-body">
      <p className="rail-meta">
        <span className="place">{(item.region || 'Ethiopia').toUpperCase()}</span>
        <span>·</span>
        <Icon name="clock" size={14} />
        <span>Closing {formatDeadline(item.deadline)} EAT</span>
      </p>
      <h3>{cleanTitle(item.title)}</h3>
      <p className="issuer">{item.issuer}</p>
      <button type="button" className="primary wide" onClick={() => onOpen(item.id)}>
        View Vehicle <Icon name="arrow" size={16} />
      </button>
    </div>
  </article>;
}

export function ListingStack({items, onOpen}) {
  return <div className="list-stack">
    {items.map((item) => item.vehicle
      ? <VehicleCard key={item.id} item={item} onOpen={onOpen} />
      : <TenderCard key={item.id} item={item} onOpen={onOpen} />)}
  </div>;
}

export function Photo({id, api}) {
  const [url, setUrl] = useState('');
  useEffect(() => {
    let live = true;
    let objectUrl;
    api('photos/' + id, {binary: true}).then((blob) => {
      if (!live) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    }).catch(() => {});
    return () => {
      live = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, api]);
  return url ? <img src={url} alt="" /> : null;
}

export function Dock({screen, section, onHome, onVehicles, onSaved, onAlerts}) {
  return <nav className="dock phone-only" aria-label="Mobile navigation">
    <button type="button" className={screen === 'home' ? 'active' : ''} onClick={onHome}>
      <span className="dock-pill"><Icon name="home" size={20} /></span>Home
    </button>
    <button type="button" className={screen === 'catalog' && section === 'vehicle' ? 'active' : ''} onClick={onVehicles}>
      <span className="dock-pill"><Icon name="car" size={20} /></span>Vehicles
    </button>
    <button type="button" className={screen === 'saved' ? 'active' : ''} onClick={onSaved}>
      <span className="dock-pill"><Icon name="bookmark" size={20} /></span>Saved
    </button>
    <button type="button" className={screen === 'alerts' ? 'active' : ''} onClick={onAlerts}>
      <span className="dock-pill"><Icon name="bell" size={20} /></span>Alerts
    </button>
  </nav>;
}

export function DeskNav({
  screen,
  section,
  q,
  setQ,
  language,
  onLanguage,
  me,
  onHome,
  onVehicles,
  onSaved,
  onAlerts,
  onProfile,
  onSignIn,
  onSection,
}) {
  return <header className="desk-nav desk-only" aria-label="Site navigation">
    <div className="desk-nav-inner">
      <button type="button" className="desk-brand" onClick={onHome}>
        <span className="desk-mark"><Icon name="gavel" size={18} /></span>
        <span className="desk-brand-text">
          <strong>Bid Ethiopia</strong>
          <span className="badge demo">DEMO</span>
        </span>
      </button>
      <div className="desk-search">
        <Icon name="search" size={18} />
        <input
          type="search"
          aria-label="Search Ethiopian tenders & auctions"
          placeholder="Search Ethiopian tenders & auctions..."
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>
      <nav className="desk-links">
        <button type="button" className={screen === 'home' ? 'on' : ''} onClick={onHome}>Home</button>
        <button type="button" className={screen === 'catalog' && section === 'vehicle' ? 'on' : ''} onClick={onVehicles}>Vehicles</button>
        <button type="button" className={screen === 'saved' ? 'on' : ''} onClick={onSaved}>Saved</button>
        <button type="button" className={screen === 'alerts' ? 'on' : ''} onClick={onAlerts}>Alerts</button>
      </nav>
      <div className="desk-actions">
        <div className="lang mini" role="group" aria-label="Language">
          <button type="button" aria-pressed={language === 'en'} onClick={() => onLanguage('en')}>EN</button>
          <button type="button" aria-pressed={language === 'am'} onClick={() => onLanguage('am')}>አማ</button>
        </div>
        {me
          ? <button type="button" className="outline desk-profile" onClick={onProfile}>Account</button>
          : <button type="button" className="outline desk-profile" onClick={onSignIn}>Sign in</button>}
      </div>
    </div>
  </header>;
}
