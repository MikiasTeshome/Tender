'use client';

import { getIdToken } from './firebase-client.js';

const closeFmt = new Intl.DateTimeFormat('en-ET', {
  timeZone: 'Africa/Addis_Ababa',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatClose(iso) {
  try {
    return closeFmt.format(new Date(iso)) + ' EAT';
  } catch {
    return iso || '—';
  }
}

export function photoUrl(id) {
  return id ? '/api/photos/' + id : '';
}

export function createApi(getToken) {
  return async function api(path, options = {}, forcedToken) {
    const {data, ...init} = options;
    const headers = new Headers(init.headers);
    const token = forcedToken
      || (typeof getToken === 'function' ? await getToken() : getToken)
      || await getIdToken();
    if (token) headers.set('Authorization', 'Bearer ' + token);
    if (data && !(data instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch('/api/' + path, {
      ...init,
      headers,
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });
    if (response.status === 401 && forcedToken == null) {
      const fresh = await getIdToken(true);
      if (fresh) return api(path, options, fresh);
    }
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error ?? 'Request failed.');
    }
    if (response.status === 204) return null;
    const type = response.headers.get('content-type') || '';
    if (!type.includes('application/json')) return response;
    return response.json();
  };
}

export function createTokenApi() {
  return createApi(() => getIdToken());
}

export async function fetchAllListings(api, params = {}) {
  const items = [];
  let page = 1;
  while (page) {
    const qs = new URLSearchParams({...params, page: String(page)});
    const data = await api('listings?' + qs.toString());
    items.push(...(data.items || []));
    page = data.next || null;
  }
  return items;
}

function text(value) {
  if (value == null) return '';
  const cleaned = String(value).trim();
  return cleaned && cleaned !== '—' ? cleaned : '';
}

export function mapVehicle(item) {
  const d = item.details || {};
  const photoIds = item.photos?.length ? item.photos : item.cover ? [item.cover] : [];
  const gallery = photoIds.map((id, index) => ({
    src: photoUrl(id),
    caption: text(d.captions?.[index]) || `Photo ${index + 1}`,
  }));
  const conditionRaw = text(d.condition).toLowerCase();
  const condition = conditionRaw === 'damaged' || conditionRaw === 'salvage' ? 'Damaged' : 'Used';
  return {
    id: item.id,
    title: item.title,
    condition,
    conditionLabel: text(d.condition) || condition,
    region: text(item.region),
    regionLabel: text(item.region),
    yardLocation: text(d.location) || text(item.region),
    issuer: text(item.issuer),
    closeIso: item.deadline,
    closeLabel: formatClose(item.deadline),
    year: Number(d.year) || 0,
    mileage: d.mileage ? String(d.mileage) : '—',
    make: text(d.make),
    model: text(d.model),
    keys: d.keys || '—',
    starter: d.starter || '—',
    fuelType: d.fuel || d.fuelType || '—',
    transmission: d.transmission || '—',
    plateStatus: d.plate || d.plateStatus || '—',
    summary: d.description || d.summary || item.title,
    instructions: text(d.instructions),
    inspection: text(d.inspection),
    sourceUrl: text(d.sourceUrl),
    lot: text(d.lot),
    inspectionReport: {
      engine: d.engine || '—',
      gearbox: d.gearbox || '—',
      bodyFrame: d.body || d.bodyFrame || '—',
      interior: d.interior || '—',
      tyres: d.tyres || '—',
    },
    contactPerson: d.contact || 'See notice',
    visitingHours: d.visitingHours || '—',
    // Keep missing photos as a real empty state for the public cards. The
    // detail view supplies a neutral fallback only when it needs an image.
    mainImage: gallery[0]?.src || '',
    gallery,
    noticeRef: text(d.reference) || text(d.lot) || item.id.slice(0, 8),
    locked: !!item.locked,
    access: item.access || 'free',
  };
}

export function mapTender(item) {
  const d = item.details || {};
  const category = item.sector === 'ngo' ? 'NGO' : item.sector === 'private' ? 'Private' : 'Public';
  return {
    id: item.id,
    title: item.title,
    category,
    categoryLabel: category,
    sector: category,
    issuer: text(item.issuer),
    refNumber: text(d.reference),
    lot: text(d.lot),
    closeIso: item.deadline,
    closeLabel: formatClose(item.deadline),
    region: text(item.region),
    summary: text(d.description),
    sourceUrl: text(d.sourceUrl),
    locked: !!item.locked,
    access: item.access || 'free',
  };
}

export function listingsToPortal(items) {
  const vehicles = [];
  const tenders = [];
  for (const item of items) {
    if (item.vehicle) vehicles.push(mapVehicle(item));
    else tenders.push(mapTender(item));
  }
  return {vehicles, tenders};
}

export function alertsFromListings(vehicles, tenders) {
  const soon = [...vehicles, ...tenders]
    .map((entry) => ({
      entry,
      ms: new Date(entry.closeIso).getTime() - Date.now(),
    }))
    .filter((row) => row.ms > 0 && row.ms < 1000 * 60 * 60 * 72)
    .sort((a, b) => a.ms - b.ms)
    .slice(0, 12);

  return soon.map((row, index) => {
    const isVehicle = 'mainImage' in row.entry || 'gallery' in row.entry;
    const hours = Math.max(1, Math.round(row.ms / (1000 * 60 * 60)));
    return {
      id: 'live-' + row.entry.id,
      title: isVehicle ? 'Vehicle lot closing soon' : 'Tender closing soon',
      message: `${row.entry.title} closes ${row.entry.closeLabel}.`,
      category: isVehicle ? 'Vehicles' : row.entry.category,
      timestamp: hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`,
      read: index > 2,
      targetId: row.entry.id,
      targetType: isVehicle ? 'vehicle' : 'tender',
    };
  });
}
