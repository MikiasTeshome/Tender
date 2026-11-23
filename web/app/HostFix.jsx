'use client';

import { useEffect } from 'react';

/** Firebase Auth allows localhost by default, not 127.0.0.1. */
export default function HostFix() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hostname !== '127.0.0.1') return;
    const next = new URL(window.location.href);
    next.hostname = 'localhost';
    window.location.replace(next.toString());
  }, []);
  return null;
}
