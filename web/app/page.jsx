import Shell from './supplier/Shell.jsx';
import Portal from './v0-portal';

export default async function Page({searchParams}) {
  const params = await searchParams;
  const screen = params?.screen ?? '';
  const authUrl = process.env.SUPABASE_URL ?? '';
  const authKey = process.env.SUPABASE_ANON_KEY ?? '';

  // Staff console stays on Shell; public catalog/auth/profile live in portal chrome.
  if (screen === 'staff') {
    return <Shell authUrl={authUrl} authKey={authKey} />;
  }

  return <Portal authUrl={authUrl} authKey={authKey} />;
}
