import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let app;

function loadCredential(admin) {
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (jsonPath) {
    const raw = JSON.parse(readFileSync(jsonPath, 'utf8'));
    return admin.credential.cert(raw);
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId || !clientEmail || !privateKey) return null;
  privateKey = privateKey.replace(/\\n/g, '\n');
  return admin.credential.cert({projectId, clientEmail, privateKey});
}

export function firebaseAuth() {
  const admin = require('firebase-admin');
  if (!app) {
    if (admin.apps.length) {
      app = admin.app();
    } else {
      const credential = loadCredential(admin);
      if (!credential) return null;
      app = admin.initializeApp({credential, projectId: process.env.FIREBASE_PROJECT_ID});
    }
  }
  return admin.auth(app);
}
