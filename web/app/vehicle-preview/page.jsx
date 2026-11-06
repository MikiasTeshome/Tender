import { notFound } from 'next/navigation';
import { referenceCrop, vehicleReference as vehicle } from '../../../mobile/vehicle-reference.mjs';
import './preview.css';

export const dynamic = 'force-dynamic';
export const metadata = {title:'Vehicle detail preview | Bid Ethiopia',robots:{index:false,follow:false}};

export default function VehiclePreview() {
  if (!process.env.VEHICLE_REFERENCE_PREVIEW) notFound();
  return <main className="shell vp">
    <header className="vp-header"><a href="/">← Bid Ethiopia</a><span>Design preview</span></header>
    <p className="vp-note">Reference listing from GoBid, Sandton. Review the layout here. Confirm availability with the issuer.</p>
    <div className="vp-title">
      <div className="vp-tags"><span>Lot {vehicle.lot}</span><span className="vp-damage">{vehicle.condition}</span></div>
      <h1>{vehicle.title}</h1><p>{vehicle.issuer} · {vehicle.location}</p>
    </div>
    <div className="vp-grid">
      <section className="vp-visual" aria-label="Vehicle photos and condition">
        <figure>
          <div className="vp-photo" style={{aspectRatio:referenceCrop.aspectRatio}}><img src="/vehicle-preview/photo" alt="Silver Ford Figo with visible damage at the front-left corner" style={referenceCrop} /></div>
          <figcaption>Issuer reference photo · Front three-quarter view</figcaption>
        </figure>
        <div className="vp-box"><h2>Condition overview</h2><p>{vehicle.note}</p></div>
      </section>
      <aside className="vp-info" aria-label="Auction and vehicle details">
        <div className="vp-box vp-auction">
          <div className="eyebrow">Amount shown on the notice</div><strong className="vp-price">{vehicle.amount}</strong>
          <div className="vp-schedule"><strong>{vehicle.event}</strong><span>{vehicle.schedule}</span><small>Date and time as printed by the issuer</small></div>
          <button className="primary" disabled>Bid with issuer</button><small>Sample action for this preview</small>
        </div>
        <div className="vp-box"><h2>Lot details</h2><dl>{vehicle.specs.map(([label,value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
      </aside>
    </div>
  </main>;
}

