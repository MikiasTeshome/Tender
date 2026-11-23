'use client';

import { initializeApp, getApps } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  sendEmailVerification,
  updateProfile,
} from 'firebase/auth';

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
};

export function firebaseConfigured() {
  return !!(config.apiKey && config.authDomain && config.projectId && config.appId);
}

export function getFirebaseAuth() {
  if (!firebaseConfigured()) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(config);
  return getAuth(app);
}

export function watchAuth(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => callback(user?.emailVerified ? user : null));
}

export async function getIdToken(forceRefresh = false) {
  const auth = getFirebaseAuth();
  const user = auth?.currentUser;
  if (!user?.emailVerified) return null;
  return user.getIdToken(forceRefresh);
}

async function requireVerifiedEmail(auth, user) {
  if (user.emailVerified) return user;
  try {
    await sendEmailVerification(user);
  } catch {
    throw new Error('Your email still needs verification. Check your inbox for an existing link or try signing in again later.');
  } finally {
    await firebaseSignOut(auth);
  }
  throw new Error('We sent a verification link to your email. Open it, then sign in again.');
}

function friendlyAuthError(error) {
  const code = error?.code || '';
  const message = error?.message || '';
  if (code === 'auth/unauthorized-domain') {
    return new Error(
      'This site address is not allowed for Firebase sign-in. Open http://localhost:3000 (not 127.0.0.1), or add 127.0.0.1 under Firebase Console → Authentication → Settings → Authorized domains.',
    );
  }
  if (code === 'auth/popup-blocked') {
    return new Error('Google sign-in popup was blocked. Allow popups for this site and try again.');
  }
  if (code === 'auth/popup-closed-by-user') {
    return new Error('Google sign-in was closed before finishing. Try again.');
  }
  if (code === 'auth/network-request-failed' || message.includes('missing initial state')) {
    return new Error(
      'Google sign-in was blocked by the browser. Use http://localhost:3000, allow third-party cookies for Google/Firebase (or try Incognito), close the error tab, and try again. Email/password sign-in also works.',
    );
  }
  return error instanceof Error ? error : new Error(message || 'Sign-in failed.');
}

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({prompt: 'select_account'});
    const result = await signInWithPopup(auth, provider);
    return requireVerifiedEmail(auth, result.user);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

export async function signInWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return requireVerifiedEmail(auth, result.user);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

export async function registerWithEmail(email, password, displayName = '') {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    if (displayName.trim()) await updateProfile(result.user, {displayName: displayName.trim()});
    return requireVerifiedEmail(auth, result.user);
  } catch (error) {
    throw friendlyAuthError(error);
  }
}

export async function signOutAuth() {
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}
