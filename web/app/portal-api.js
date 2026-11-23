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
  return async function api(path, options = {}) {
    const {data, ...init} = options;
    const headers = new Headers(init.headers);
    const token = typeof getToken === 'function' ? await getToken() : getToken;
    if (token) headers.set('Authorization', 'Bearer ' + token);
    if (data && !(data instanceof FormData)) headers.set('Content-Type', 'application/json');
    const response = await fetch('/api/' + path, {
      ...init,
      headers,
      body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
    });
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

function asList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}

export function mapVehicle(item) {
  const d = item.details || {};
  const photoIds = item.photos?.length ? item.photos : item.cover ? [item.cover] : [];
  const gallery = photoIds.map((id, index) => ({
    src: photoUrl(id),
    caption: d.captions?.[index] || `Photo ${index + 1}`,
  }));
  const condition = String(d.condition || '').toLowerCase() === 'damaged' ? 'Damaged' : 'Used';
  return {
    id: item.id,
    title: item.title,
    condition,
    conditionLabel: d.condition || condition,
    region: item.region || '',
    regionLabel: item.region || '',
    yardLocation: d.location || item.region || '—',
    issuer: item.issuer || '',
    issuerCategory: 'Vehicle disposal',
    closeIso: item.deadline,
    closeLabel: formatClose(item.deadline),
    cpoBond: d.cpo || d.bond || '—',
    estimatedReserve: d.reserve || d.estimatedReserve || '—',
    year: Number(d.year) || 0,
    mileage: d.mileage ? String(d.mileage) : '—',
    keys: d.keys || '—',
    starter: d.starter || '—',
    fuelType: d.fuel || d.fuelType || '—',
    transmission: d.transmission || '—',
    plateStatus: d.plate || d.plateStatus || '—',
    summary: d.description || d.summary || item.title,
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
    noticeRef: d.reference || d.lot || item.id.slice(0, 8),
    locked: !!item.locked,
    access: item.access,
  };
}

export function mapTender(item) {
  const d = item.details || {};
  const category = item.sector === 'ngo' ? 'NGO' : item.sector === 'private' ? 'Private' : 'Public';
  const scope = asList(d.scope).length ? asList(d.scope) : asList(d.description).length ? asList(d.description) : ['See the full notice for scope of work.'];
  const eligibility = asList(d.eligibility).length ? asList(d.eligibility) : ['See the notice for eligibility requirements.'];
  const notice = asList(d.notice).length ? asList(d.notice) : asList(d.description).length ? asList(d.description) : [item.title];
  return {
    id: item.id,
    title: item.title,
    category,
    categoryLabel: category,
    sector: d.category || item.sector || category,
    issuer: item.issuer || '',
    refNumber: d.reference || item.id.slice(0, 8),
    closeIso: item.deadline,
    closeLabel: formatClose(item.deadline),
    cpoAmount: d.cpo || '—',
    documentFee: d.documentFee || '—',
    region: item.region || '',
    gazette: d.gazette || '—',
    summary: d.description || item.title,
    scopeOfWork: scope,
    eligibilityRequirements: eligibility,
    contactPerson: d.contact || 'See notice',
    submissionAddress: d.location || d.submissionAddress || '—',
    fullNoticeText: notice,
    locked: !!item.locked,
    access: item.access,
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
    const isVehicle = 'mainImage' in row.entry;
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
