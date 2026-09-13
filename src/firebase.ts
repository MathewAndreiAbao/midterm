/**
 * Firebase bootstrap.
 *
 * The configuration values are read from environment variables so that the
 * project keys are never hard-coded into the repository. Copy ".env.example"
 * to ".env" and paste the values from your Firebase console.
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

/**
 * Set VITE_USE_FIREBASE_EMULATOR=true in .env to talk to the local Firebase
 * emulator instead of the real cloud project. Handy for demoing offline -
 * see the README. Leave it unset for normal use.
 */
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

/**
 * True only when we have enough configuration to start. The app checks this
 * before touching Firestore so a missing ".env" shows a helpful message
 * instead of a stack trace.
 */
export const isFirebaseConfigured: boolean = useEmulator
  ? Boolean(firebaseConfig.projectId)
  : Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app: FirebaseApp | undefined;
let firestore: Firestore | undefined;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  firestore = getFirestore(app);

  if (useEmulator) {
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    console.info('[Firebase] Using the local Firestore emulator on port 8080.');
  }
} else {
  console.warn(
    '[Firebase] Configuration missing. Copy .env.example to .env and fill in ' +
      'your Firebase project keys, then restart "npm run dev".',
  );
}

/**
 * Returns the Firestore instance. Callers must check isFirebaseConfigured
 * first - this throws if Firebase was never initialised.
 */
export function getDb(): Firestore {
  if (!firestore) {
    throw new Error('Firebase is not configured. See .env.example.');
  }
  return firestore;
}

/** Name of the Firestore collection that holds every expense document. */
export const EXPENSES_COLLECTION = 'expenses';
