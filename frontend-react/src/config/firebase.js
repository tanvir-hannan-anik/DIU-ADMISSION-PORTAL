// Firebase initialisation — Google Workspace auth + Firestore for student data.
// Config comes from REACT_APP_FIREBASE_* env vars (see .env.example).
//
// Init is guarded: with no config, getAuth() throws auth/invalid-api-key at
// import time and would white-screen the whole app. So we only initialise
// when configured; otherwise exports are null and loginWithGoogle reports a
// friendly "not configured" message.

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Only diu.edu.bd Google Workspace accounts may sign in as students.
export const ALLOWED_DOMAIN = 'diu.edu.bd';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  googleProvider = new GoogleAuthProvider();
  // `hd` restricts the Google account chooser to the workspace domain. It is
  // a UI hint only — the real enforcement is the post-sign-in domain check.
  googleProvider.setCustomParameters({
    hd: ALLOWED_DOMAIN,
    prompt: 'select_account',
  });
} else {
  // eslint-disable-next-line no-console
  console.warn(
    '[firebase] Not configured — set REACT_APP_FIREBASE_* in .env to enable Google sign-in.'
  );
}

export { app, auth, db, googleProvider };
export default app;
