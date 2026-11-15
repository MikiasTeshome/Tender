'use client';

import Brand from '../brand.jsx';

import { useEffect, useState } from 'react';
import { Icon } from '../stitch-ui.jsx';
import { cleanTitle, closingInfo, conditionLabel, formatDeadline, sections } from './utils.js';

export function AccessBadge({item}) {
  if (item.access !== 'paid') return <span className="badge">Free access</span>;
  return <span className="badge paid">{item.locked ? 'Paid listing' : 'Unlocked'}</span>;
}

function ClosingChip({deadline}) {
  const info = closingInfo(deadline);
  return <span className={'m-closing ' + info.tone}><Icon name="clock" size={12} /> {info.label}</span>;
}

export function VehicleTile({item, onOpen}) {
  const place = item.region || item.details?.location || 'Ethiopia';
  return <button type="button" className="m-tile" onClick={() => onOpen(item.id)}>
    <span className="m-tile-media">
      {item.cover ? <img src={'/api/photos/' + item.cover} alt="" loading="lazy" /> : <span className="m-noimg"><Icon name="car" size={30} /></span>}
      <span className={'m-tag' + (item.condition === 'damaged' || item.condition === 'salvage' ? ' warn' : '')}>
        {conditionLabel(item.condition)}
      </span>
      {item.details?.lot && <span className="m-lot">Lot {item.details.lot}</span>}
    </span>
    <span className="m-tile-body">
      <strong>{cleanTitle(item.title)}</strong>
      <span className="m-meta"><Icon name="pin" size={12} /> {place}</span>
      <span className="m-tile-foot">
        <ClosingChip deadline={item.deadline} />
        {item.access === 'paid' && <span className="m-paid" title="Subscriber listing"><Icon name="lock" size={11} /></span>}
      </span>
    </span>
  </button>;
}

export function VehicleRailCard(props) {
  return <VehicleTile {...props} />;
}

export function VehicleCard(props) {
  return <VehicleTile {...props} />;
}

export function TenderCard({item, onOpen}) {
  return <button type="button" className={'m-row sector-' + item.sector} onClick={() => onOpen(item.id)}>
    <span className="m-row-main">
      <strong>{cleanTitle(item.title)}</strong>
      <span className="m-meta"><Icon name="building" size={12} /> {item.issuer}{item.region ? ' · ' + item.region : ''}</span>
    </span>
    <span className="m-row-side">
      <ClosingChip deadline={item.deadline} />
      <AccessBadge item={item} />
    </span>
  </button>;
}

export function ListingStack({items, onOpen}) {
  const vehicles = items.filter((item) => item.vehicle);
  const tenders = items.filter((item) => !item.vehicle);
  return <div className="m-stack">
    {!!vehicles.length && <div className="m-grid">
      {vehicles.map((item) => <VehicleTile key={item.id} item={item} onOpen={onOpen} />)}
    </div>}
    {!!tenders.length && <div className="m-rows">
      {tenders.map((item) => <TenderCard key={item.id} item={item} onOpen={onOpen} />)}
    </div>}
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
  const homeOn = screen === 'home' || (screen === 'catalog' && section && section !== 'vehicle');
  const vehiclesOn = screen === 'catalog' && section === 'vehicle';
  return <nav className="dock phone-only" aria-label="Mobile navigation">
    <button type="button" className={homeOn ? 'active' : ''} aria-current={homeOn ? 'page' : undefined} onClick={onHome}>
      <span className="dock-pill"><Icon name="home" size={20} /></span>Home
    </button>
    <button type="button" className={vehiclesOn ? 'active' : ''} aria-current={vehiclesOn ? 'page' : undefined} onClick={onVehicles}>
      <span className="dock-pill"><Icon name="car" size={20} /></span>Vehicles
    </button>
    <button type="button" className={screen === 'saved' ? 'active' : ''} aria-current={screen === 'saved' ? 'page' : undefined} onClick={onSaved}>
      <span className="dock-pill"><Icon name="bookmark" size={20} /></span>Saved
    </button>
    <button type="button" className={screen === 'alerts' ? 'active' : ''} aria-current={screen === 'alerts' ? 'page' : undefined} onClick={onAlerts}>
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
}) {
  return <header className="desk-nav desk-only" aria-label="Site navigation">
    <div className="desk-nav-inner">
      <button type="button" className="desk-brand" onClick={onHome}>
        <Brand />
        <span>
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
          <button type="button" aria-pressed={language === 'am'} disabled title="Amharic coming soon">አማ</button>
        </div>
        {me
          ? <button type="button" className="outline desk-profile" onClick={onProfile}>Account</button>
          : <button type="button" className="outline desk-profile" onClick={onSignIn}>Sign in</button>}
      </div>
    </div>
  </header>;
}

export function SiteFooter({
  me,
  onHome,
  onSection,
  onSaved,
  onPlans,
  onProfile,
  onSignIn,
  compact = false,
}) {
  return <footer className={'site-footer' + (compact ? ' has-dock-clearance' : '')}>
    <div className="site-footer-inner site-footer-slim">
      <button type="button" className="site-footer-logo" onClick={onHome}>
        <Brand />
        <span>
          <span className="badge demo">DEMO</span>
        </span>
      </button>
      <nav className="site-footer-links" aria-label="Footer">
        {sections.map(([key, label]) => (
          <button type="button" key={key} onClick={() => onSection(key)}>{label}</button>
        ))}
        <button type="button" onClick={onSaved}>Saved</button>
        <button type="button" onClick={onPlans}>Subscriptions</button>
        <button type="button" onClick={me ? onProfile : onSignIn}>{me ? 'Account' : 'Sign in'}</button>
      </nav>
    </div>
    <div className="site-footer-bar">
      <p>© 2026 Fanos Tender · Closings in EAT</p>
      <p>Bid with the issuer — not on this site</p>
    </div>
  </footer>;
}
