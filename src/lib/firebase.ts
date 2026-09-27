import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database, ref, onValue, off } from 'firebase/database';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInAnonymously, signOut, User } from 'firebase/auth';
import { FirebaseConfig } from '@/types';

// Default / fallback Firebase config from environment variables
export const defaultFirebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
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

    if (!activeConfig.projectId && !activeConfig.databaseURL && !activeConfig.apiKey) {
      return { app: null, db: null, firestore: null, auth: null, isConfigured: false };
    }

    if (!getApps().length) {
      app = initializeApp(activeConfig);
    } else {
      app = getApp();
    }

    if (activeConfig.databaseURL || activeConfig.projectId) {
      try {
        db = getDatabase(app);
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
    }

    return { app, db, firestore, auth, isConfigured: true };
  } catch (error) {
    console.error('Failed to initialize Firebase:', error);
    return { app: null, db: null, firestore: null, auth: null, isConfigured: false };
  }
}

export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, signInAnonymously, signOut };
export type { User };
