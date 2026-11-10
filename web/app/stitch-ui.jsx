'use client';

/** Inline icons matching Stitch mobile frames */
export function Icon({name, size = 22}) {
  const props = {width:size, height:size, viewBox:'0 0 24 24', fill:'none', stroke:'currentColor', strokeWidth:1.8, strokeLinecap:'round', strokeLinejoin:'round', 'aria-hidden':true};
  if (name === 'home') return <svg {...props}><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>;
  if (name === 'car') return <svg {...props}><path d="M3 14h18l-1.5-5.5A2 2 0 0 0 17.6 7H6.4a2 2 0 0 0-1.9 1.5L3 14Z"/><path d="M5 17a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm14 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/><path d="M3 14v3h3m12 0h3v-3"/></svg>;
  if (name === 'bookmark') return <svg {...props}><path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.5L6 20V5a1 1 0 0 1 1-1Z"/></svg>;
  if (name === 'bell') return <svg {...props}><path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 20a2 2 0 0 0 4 0"/></svg>;
  if (name === 'search') return <svg {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>;
  if (name === 'building') return <svg {...props}><path d="M4 21V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v16"/><path d="M14 10h5a1 1 0 0 1 1 1v10"/><path d="M8 8h2M8 12h2M8 16h2M17 14h1M17 17h1"/></svg>;
  if (name === 'heart') return <svg {...props}><path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z"/></svg>;
  if (name === 'office') return <svg {...props}><path d="M3 21h18"/><path d="M5 21V7l7-3 7 3v14"/><path d="M9 21v-6h6v6M9 10h.01M15 10h.01M9 14h.01M15 14h.01"/></svg>;
  if (name === 'user') return <svg {...props}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>;
  if (name === 'arrow') return <svg {...props}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
  if (name === 'back') return <svg {...props}><path d="M15 18 9 12l6-6"/></svg>;
  if (name === 'shield') return <svg {...props}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9.5 4.5-1 8-4.5 8-9.5V6l-8-3Z"/></svg>;
  if (name === 'gavel') return <svg {...props}><path d="m14 13-8.5 8.5"/><path d="m15.5 5.5 3 3"/><path d="m12 8 5 5"/><path d="M5 21h6"/><path d="m14 4 6 6-3.5 3.5-6-6L14 4Z"/></svg>;
  if (name === 'clock') return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>;
  if (name === 'mail') return <svg {...props}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 7 9-7"/></svg>;
  if (name === 'lock') return <svg {...props}><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
  if (name === 'info') return <svg {...props}><circle cx="12" cy="12" r="9"/><path d="M12 10v6M12 7h.01"/></svg>;
  if (name === 'check') return <svg {...props}><path d="M20 6 9 17l-5-5"/></svg>;
  if (name === 'warn') return <svg {...props}><path d="M12 3 2 21h20L12 3Z"/><path d="M12 10v5M12 18h.01"/></svg>;
  if (name === 'doc') return <svg {...props}><path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>;
  if (name === 'download') return <svg {...props}><path d="M12 4v12"/><path d="m7 11 5 5 5-5"/><path d="M5 20h14"/></svg>;
  if (name === 'pin') return <svg {...props}><path d="M12 21s6-5.3 6-11a6 6 0 1 0-12 0c0 5.7 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>;
  return null;
}

export const sectionIcons = {public:'building', ngo:'heart', private:'office', vehicle:'car'};

export function conditionLabel(condition) {
  if (condition === 'used') return 'Running Fleet';
  if (condition === 'damaged') return 'Damaged';
  if (condition === 'salvage') return 'Salvage';
  return condition || '';
}
