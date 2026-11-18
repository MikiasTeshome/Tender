import fs from 'fs';

const path = new URL('../app/v0-portal.tsx', import.meta.url);
let s = fs.readFileSync(path, 'utf8');

s = s.replace(
  "import { useEffect, useMemo, useState } from 'react'",
  "import { useCallback, useEffect, useMemo, useState } from 'react'",
);

if (!s.includes('portal-api')) {
  s = s.replace(
    "import Brand from './brand.jsx'",
    `import Brand from './brand.jsx'
import {
  alertsFromListings,
  createApi,
  createPortalClient,
  fetchAllListings,
  listingsToPortal,
  mapTender,
  mapVehicle,
} from './portal-api.js'`,
  );
}

const start = s.indexOf('// 1. VEHICLE LOTS FIXTURES');
const end = s.indexOf('export default function');
if (start < 0 || end < 0) {
  console.error('markers missing', start, end);
  process.exit(1);
}
s = s.slice(0, start) + s.slice(end);

s = s.replace(
  'export default function BidEthiopiaPortal() {',
  "export default function FanosPortal({ authUrl = '', authKey = '' }: { authUrl?: string; authKey?: string }) {",
);

fs.writeFileSync(path, s);
console.log('ok lines', s.split('\n').length);
