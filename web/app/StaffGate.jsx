'use client';

import { useCallback, useEffect, useState } from 'react';
import AuthPanel from './AuthPanel.jsx';
import Brand from './brand.jsx';
import { getIdToken, signOutAuth, watchAuth } from './firebase-client.js';
import { createApi } from './portal-api.js';
import Admin from './staff.jsx';
import './auth-panel.css';
import './staff.css';

export default function StaffGate() {
  const [user, setUser] = useState(undefined);
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState('');

  const api = useCallback(createApi(() => getIdToken()), []);

  useEffect(() => watchAuth((next) => {
    setUser(next);
    if (!next) setMe(null);
  }), []);

  useEffect(() => {
    if (user === undefined) return;
    if (!user) {
      setMe(null);
      return;
    }
    let alive = true;
    api('me')
      .then((account) => {
        if (alive) setMe(account);
      })
      .catch((error) => {
        if (alive) setStatus(error.message || 'Could not load your account.');
      });
    return () => {
      alive = false;
    };
  }, [api, user]);

  return (
    <div className="staff-gate">
      <header className="staff-gate-bar">
        <a href="/" className="staff-gate-brand" aria-label="Fanos Tender home">
          <Brand />
        </a>
        <div className="staff-gate-actions">
          {me?.email && <span className="staff-gate-email">{me.email}</span>}
          <a href="/" className="staff-outline">Back to site</a>
          {user && (
            <button
              type="button"
              className="staff-outline"
              onClick={() => {
                void signOutAuth().then(() => {
                  setMe(null);
                  window.location.href = '/';
                });
              }}
            >
              Sign out
            </button>
          )}
        </div>
      </header>

      <main className="staff-gate-main">
        {status && <p role="status" className="staff-callout staff-callout-error">{status}</p>}

        {user === undefined && <p role="status" className="staff-note">Checking sign-in…</p>}

        {user === null && (
          <section className="staff-gate-auth">
            <p className="staff-eyebrow">Superadmin</p>
            <h1>Sign in to manage the directory</h1>
            <p className="staff-note">Use the same verified Google or email account that is registered as Superadmin.</p>
            <AuthPanel onSuccess={() => setStatus('')} />
          </section>
        )}

        {user && !me && !status && <p role="status" className="staff-note">Checking Superadmin access…</p>}

        {user && me && !me.admin && (
          <section className="staff-gate-auth">
            <p className="staff-eyebrow">Access</p>
            <h1>Staff access required</h1>
            <p className="staff-note">This account is signed in but is not the Superadmin. Return to the site or sign in with the owner account.</p>
            <a href="/" className="staff-primary">Back to site</a>
          </section>
        )}

        {user && me?.admin && <Admin api={api} onBack={() => { window.location.href = '/'; }} />}
      </main>
    </div>
  );
}
