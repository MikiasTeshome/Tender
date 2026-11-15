import Shell from './supplier/Shell.jsx';
import Portal from './v0-portal';

export default async function Page({searchParams}) {
  const {bid, screen, section, q, condition} = await searchParams;
  if (bid || screen || section || q || condition) {
    return <Shell authUrl={process.env.SUPABASE_URL ?? ''} authKey={process.env.SUPABASE_ANON_KEY ?? ''} />;
  }
  return <Portal />;
}
