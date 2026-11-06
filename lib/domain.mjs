export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const sectors = ['public', 'ngo', 'private'];
export const conditions = ['used', 'damaged', 'salvage'];
export const terms = [1, 3, 6, 12];

export function clean(value, limit = 200) {
  return typeof value === 'string' ? value.trim().slice(0, limit) : '';
}

export function uuid(value) {
  if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(value ?? '')) {
    throw new HttpError(400, 'Invalid ID.');
  }
  return value;
}

export function filters(input) {
  const result = {};
  for (const key of ['q', 'section', 'region', 'access', 'condition', 'make', 'model', 'deadline']) {
    const value = clean(input[key], 100);
    if (value) result[key] = value;
  }
  if (result.section && ![...sectors, 'vehicle'].includes(result.section) ||
      result.access && !['free', 'paid'].includes(result.access) ||
      result.condition && !conditions.includes(result.condition) ||
      result.deadline && !['today', 'week', 'month'].includes(result.deadline)) {
    throw new HttpError(400, 'Invalid filter.');
  }
  return result;
}

export function egpKey(reference, lot, sourceId) {
  const identity = clean(reference,200).toUpperCase() || clean(sourceId,200);
  return identity ? 'egp:' + JSON.stringify([identity,clean(lot,100).toUpperCase()]) : null;
}

export function listingInput(input) {
  const vehicle = input.vehicle === true;
  const title = clean(input.title);
  const issuer = clean(input.issuer);
  const region = clean(input.region);
  const sector = clean(input.sector);
  const access = clean(input.access);
  const status = clean(input.status);
  const rawDeadline = clean(input.deadline);
  const deadline = new Date(rawDeadline);
  const details = Object.fromEntries([
    'sourceUrl', 'instructions', 'description', 'reference', 'lot', 'location',
    'condition', 'make', 'model', 'year', 'mileage', 'inspection',
  ].map((key) => [key, clean(input[key], ['instructions', 'description', 'inspection'].includes(key) ? 6000 : 1000)]));
  if (!title || !issuer || !region || !sectors.includes(sector) ||
      !['free', 'paid'].includes(access) || !['active', 'draft', 'cancelled'].includes(status) ||
      !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d{1,3})?)?(?:Z|[+-]\d\d:\d\d)$/.test(rawDeadline) ||
      !Number.isFinite(deadline.valueOf())) {
    throw new HttpError(400, 'Enter the issuer, title, sector, region, access, status and a deadline with a time zone.');
  }
  if (details.sourceUrl) {
    try {
      const url = new URL(details.sourceUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch {
      throw new HttpError(400, 'Use an official HTTP or HTTPS notice link.');
    }
  }
  if (!details.sourceUrl && (!vehicle || !details.instructions)) {
    throw new HttpError(400, 'Add the original notice or verified vehicle bidding instructions.');
  }
  if (vehicle && (!details.location || !conditions.includes(details.condition))) {
    throw new HttpError(400, 'Choose the vehicle condition and enter its location.');
  }
  return { title, issuer, region, sector, access, status, vehicle, deadline, details };
}

export function preview(row, entitled) {
  const locked = row.access === 'paid' && !entitled;
  const base = {
    id: row.id, title: row.title, sector: row.sector, access: row.access, vehicle: row.vehicle,
    deadline: row.deadline, status: row.status === 'active' && new Date(row.deadline) <= new Date() ? 'expired' : row.status,
    locked,
  };
  if (row.vehicle) {
    base.condition = row.details.condition;
    base.cover = row.photo_ids[0] ?? null;
  }
  if (locked) return base;
  return { ...base, issuer: row.issuer, region: row.region, details: row.details, photos: row.photo_ids };
}

export function listingPredicate(input, entitled, args) {
  const sql = [];
  const bind = (value) => { args.push(value); return '$' + args.length; };
  const isPublic = entitled ? 'TRUE' : "l.access = 'free'";
  const match = (column, value) => 'strpos(lower(' + column + '),lower(' + bind(value) + ')) > 0';
  if (input.section === 'vehicle') sql.push('l.vehicle');
  else if (input.section) sql.push('l.sector = ' + bind(input.section));
  if (input.q) sql.push("(to_tsvector('simple',l.title) @@ plainto_tsquery('simple'," + bind(input.q) + ') OR ' + match('l.title', input.q) + ' OR (' + isPublic + ' AND ' + match("concat_ws(' ',l.issuer,l.details->>'description',l.details->>'reference',l.details->>'make',l.details->>'model')", input.q) + '))');
  if (input.access) sql.push('l.access = ' + bind(input.access));
  if (input.region) sql.push(isPublic, match('l.region', input.region));
  if (input.condition) sql.push("l.vehicle AND l.details->>'condition' = " + bind(input.condition));
  for (const key of ['make', 'model']) {
    if (input[key]) sql.push('l.vehicle', isPublic, match("l.details->>'" + key + "'", input[key]));
  }
  const days = {today: 1, week: 7, month: 30}[input.deadline];
  if (days) sql.push("l.deadline < ((date_trunc('day', now() AT TIME ZONE 'Africa/Addis_Ababa') + " + bind(days) + "::int * interval '1 day') AT TIME ZONE 'Africa/Addis_Ababa')");
  return sql.length ? ' AND ' + sql.join(' AND ') : '';
}

export const listingSelect = "SELECT l.*, ARRAY(SELECT id FROM photos WHERE listing_id=l.id ORDER BY position) AS photo_ids FROM listings l";

