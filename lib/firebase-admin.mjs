import { readFileSync } from 'node:fs';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app;

function loadCredential() {
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (jsonPath) {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
    return cert(raw);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, '\n');
  return cert({projectId, clientEmail, privateKey});
}

export function firebaseAuth() {
  if (!app) {
    app = getApps().find((candidate) => candidate.name === '[DEFAULT]');
  }
  if (!app) {
    const credential = loadCredential();
    if (!credential) return null;
    app = initializeApp({credential, projectId: process.env.FIREBASE_PROJECT_ID});
  }
  return getAuth(app);
}
