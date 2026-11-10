export const sections = [
  ['public', 'Public Tenders', 'building'],
  ['ngo', 'NGO Tenders', 'heart'],
  ['private', 'Private Tenders', 'office'],
  ['vehicle', 'Vehicle Bids', 'car'],
];

export const terms = {1: 'Monthly', 3: 'Quarterly', 6: 'Half-year', 12: 'Annual'};
export const demoEmails = ['procurement@addis-transport.et', 'bidder@sample.et'];

const deadlineFmt = new Intl.DateTimeFormat('en-ET', {
  timeZone: 'Africa/Addis_Ababa',
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDeadline(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return deadlineFmt.format(date);
}

export function cleanTitle(title = '') {
  return title.replace(/^Sample ·\s*/, '');
}

export function conditionLabel(condition) {
  if (condition === 'used') return 'Running Fleet';
  if (condition === 'damaged') return 'Damaged';
  if (condition === 'salvage') return 'Salvage';
  return condition || '';
}

export function errorText(error) {
  return error?.message ?? 'Please try again.';
}

export function readRoute() {
  if (typeof location === 'undefined') {
    return {bid: '', screen: 'home', section: '', q: '', condition: ''};
  }
  const params = new URL(location.href).searchParams;
  return {
    bid: params.get('bid') || '',
    screen: params.get('screen') || 'home',
    section: params.get('section') || '',
    q: params.get('q') || '',
    condition: params.get('condition') || '',
  };
}

export function writeRoute({bid = '', screen = 'home', section = '', q = '', condition = ''} = {}) {
  const url = new URL(location.href);
  url.search = '';
  if (bid) {
    url.searchParams.set('bid', bid);
    if (section) url.searchParams.set('section', section);
  } else {
    if (screen && screen !== 'home') url.searchParams.set('screen', screen);
    if (section) url.searchParams.set('section', section);
    if (q) url.searchParams.set('q', q);
    if (condition) url.searchParams.set('condition', condition);
  }
  history.pushState(null, '', url.pathname + url.search);
}
