import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database, ref, onValue, off } from 'firebase/database';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInAnonymously, signOut, User } from 'firebase/auth';
import { FirebaseConfig } from '@/types';

// Default / fallback Firebase config from environment variables
export const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSySampleKeyForAgroEyeLocalApp',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sample-629de.firebaseapp.com',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://sample-629de-default-rtdb.firebaseio.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sample-629de',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'sample-629de.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
};

let app: FirebaseApp | null = null;
let db: Database | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;

export function getFirebaseInstance(customConfig?: Partial<FirebaseConfig>) {
  try {
    const activeConfig = {
      ...defaultFirebaseConfig,
      ...(customConfig || {}),
    };

    const targetDbUrl = activeConfig.databaseURL || 'https://sample-629de-default-rtdb.firebaseio.com';

    if (!getApps().length) {
      app = initializeApp(activeConfig);
    } else {
      app = getApp();
    }

    try {
      db = getDatabase(app, targetDbUrl);
    } catch (err) {
      console.warn('Firebase RTDB not initialized:', err);
    }
    try {
      firestore = getFirestore(app);
    } catch (err) {
      console.warn('Firebase Firestore not initialized:', err);
    }
    try {
      auth = getAuth(app);
    } catch (err) {
      console.warn('Firebase Auth not initialized:', err);
    }

    return { app, db, firestore, auth, isConfigured: true };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { app: null, db: null, firestore: null, auth: null, isConfigured: false };
  }
}

export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInAnonymously, signOut };
export type { User };
