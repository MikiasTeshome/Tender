import Shell from './supplier/Shell.jsx';

export const dynamic = 'force-dynamic';

export default function Page() {
  return <Shell authUrl={process.env.SUPABASE_URL ?? ''} authKey={process.env.SUPABASE_ANON_KEY ?? ''} />;
}
