import { initializeApp, getApps } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
};

export function firebaseConfigured() {
  return !!(config.apiKey && config.authDomain && config.projectId && config.appId);
}

function getApp() {
  if (!firebaseConfigured()) return null;
  return getApps().length ? getApps()[0] : initializeApp(config);
}

export function getFirebaseAuth() {
  const app = getApp();
  if (!app) return null;
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export function watchAuth(callback) {
  const auth = getFirebaseAuth();
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => callback(user?.emailVerified ? user : null));
}

async function requireVerifiedEmail(auth, user) {
  if (user.emailVerified) return user;
  try {
    await sendEmailVerification(user);
  } catch {
    throw new Error('Your email still needs verification. Check your inbox for an existing link or try signing in again later.');
  } finally {
    await signOut(auth);
  }
  throw new Error('We sent a verification link to your email. Open it, then sign in again.');
}

export async function signInEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const {user} = await signInWithEmailAndPassword(auth, email.trim(), password);
  return requireVerifiedEmail(auth, user);
}

export async function registerEmail(email, password) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const {user} = await createUserWithEmailAndPassword(auth, email.trim(), password);
  return requireVerifiedEmail(auth, user);
}

export async function signInGoogleIdToken(idToken) {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase Auth is not configured.');
  const credential = GoogleAuthProvider.credential(idToken);
  const {user} = await signInWithCredential(auth, credential);
  return requireVerifiedEmail(auth, user);
}

export async function signOutAuth() {
  const auth = getFirebaseAuth();
  if (auth) await signOut(auth);
}
