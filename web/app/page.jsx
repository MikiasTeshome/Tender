import Portal from './portal.jsx';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <Portal authUrl={process.env.SUPABASE_URL ?? ''} authKey={process.env.SUPABASE_ANON_KEY ?? ''} />;
}
