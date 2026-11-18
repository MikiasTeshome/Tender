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

export async function signInWithGoogle() {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const result = await signInWithPopup(auth, new GoogleAuthProvider());
  return requireVerifiedEmail(auth, result.user);
}

export async function signInWithEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);
  return requireVerifiedEmail(auth, result.user);
}

export async function registerWithEmail(email, password, displayName = '') {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (displayName.trim()) await updateProfile(result.user, {displayName: displayName.trim()});
  return requireVerifiedEmail(auth, result.user);
}

export async function signOutAuth() {
  const auth = getFirebaseAuth();
  if (auth) await firebaseSignOut(auth);
}
