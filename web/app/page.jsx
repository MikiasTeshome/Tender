import Shell from './supplier/Shell.jsx';
import Portal from './v0-portal';

export default async function Page({searchParams}) {
  const params = await searchParams;
  const screen = params?.screen ?? '';

  // Staff console stays on Shell; public catalog/auth/profile live in portal chrome.
  if (screen === 'staff') {
    return <Shell />;
  }

  return <Portal />;
}
