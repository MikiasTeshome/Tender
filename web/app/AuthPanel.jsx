'use client';

import { useState } from 'react';
import {
  firebaseConfigured,
  registerWithEmail,
  signInWithEmail,
  signInWithGoogle,
} from './firebase-client.js';

export default function AuthPanel({onSuccess, compact = false}) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const configured = firebaseConfigured();

  async function run(action) {
    setBusy(true);
    setMessage('');
    try {
      const user = await action();
      if (user && !user.emailVerified && mode === 'register') {
        setMessage('Account created. Verify your email if prompted, then continue.');
      }
      onSuccess?.(user);
    } catch (error) {
      setMessage(error.message || 'Sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  if (!configured) {
    return (
      <div className="auth-panel" role="status">
        <p>Sign-in is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables.</p>
      </div>
    );
  }

  return (
    <div className={'auth-panel' + (compact ? ' compact' : '')}>
      <button
        type="button"
        className="auth-google"
        disabled={busy}
        onClick={() => run(() => signInWithGoogle())}
      >
        Continue with Google
      </button>

      <div className="auth-divider"><span>or email</span></div>

      <form
        className="auth-email"
        onSubmit={(event) => {
          event.preventDefault();
          if (mode === 'register') {
            void run(() => registerWithEmail(email, password, name));
          } else {
            void run(() => signInWithEmail(email, password));
          }
        }}
      >
        {mode === 'register' && (
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </label>
        )}
        <label>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@organization.et"
          />
        </label>
        <label>
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        </label>
        <button type="submit" className="auth-primary" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'register' ? 'Create account' : 'Sign in with email'}
        </button>
      </form>

      <button
        type="button"
        className="auth-switch"
        disabled={busy}
        onClick={() => {
          setMode(mode === 'register' ? 'signin' : 'register');
          setMessage('');
        }}
      >
        {mode === 'register' ? 'Already have an account? Sign in' : 'Need an account? Register'}
      </button>

      <p className="auth-legal">
        By continuing you agree to the <a href="/terms">Terms of Use</a> and <a href="/privacy">Privacy Policy</a>.
      </p>
      {message && <p className="auth-message" role="status">{message}</p>}
    </div>
  );
}
