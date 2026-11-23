import StaffGate from './StaffGate.jsx';
import Portal from './v0-portal';

export default async function Page({searchParams}) {
  const params = await searchParams;
  const screen = params?.screen ?? '';

  // Staff console uses portal-aligned chrome; public catalog stays in the portal.
  if (screen === 'staff') {
    return <StaffGate />;
  }

  return <Portal />;
}
