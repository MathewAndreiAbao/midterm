// ---------------------------------------------------------------------------
// firebase.js
//
// This file connects the app to Firebase. It runs once, when the app starts.
// ---------------------------------------------------------------------------
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Our Firebase keys. They are read from the .env file so that we do not have
// to type them inside the code (and so they are not uploaded to GitHub).
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// If the .env file was never filled in, projectId will be empty. We check for
// that so the app can show a friendly message instead of crashing.
export const isFirebaseReady = Boolean(firebaseConfig.projectId);

// "db" is our connection to the Firestore database. Every other file imports
// this one variable.
export let db = null;

if (isFirebaseReady) {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  // Optional: use the offline emulator instead of the real Firebase.
  // Turn it on by putting VITE_USE_FIREBASE_EMULATOR=true in the .env file.
  if (import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    console.log('Using the local Firebase emulator.');
  }
} else {
  console.warn('Firebase is not set up. Copy .env.example to .env and add your keys.');
}
