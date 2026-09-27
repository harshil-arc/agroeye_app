'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getFirebaseInstance,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  User,
} from '@/lib/firebase';
import { ref, set } from 'firebase/database';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  phoneNumber?: string;
  farmName?: string;
  location?: string;
  crop?: string;
  farmSize?: string;
  role: 'farmer' | 'operator' | 'admin';
  createdAt?: string;
  lastLoginAt?: string;
  isAnonymous?: boolean;
}

// Alias for backward compatibility
export type OperatorProfile = UserProfile;

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  phoneNumber?: string;
  farmName?: string;
  location?: string;
  crop?: string;
  farmSize?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  operator: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  registerWithEmail: (data: RegisterData) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  logout: () => Promise<void>;
  loginAsOperator: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const DEFAULT_FIREBASE_URL = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || 'https://sample-629de-default-rtdb.firebaseio.com';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function sanitizeEmailKey(email: string): string {
  return email.toLowerCase().trim().replace(/[\.\#\$\[\]\/@]/g, '_');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('agroeye_user_profile');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile to Firebase RTDB
  const syncProfileToFirebase = useCallback(async (profile: UserProfile, password?: string) => {
    const dbUrl = DEFAULT_FIREBASE_URL.replace(/\/$/, '');
    try {
      await fetch(`${dbUrl}/users/${profile.uid}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch (e) {
      console.warn('Profile cloud sync notice:', e);
    }

    if (profile.email) {
      const emailKey = sanitizeEmailKey(profile.email);
      try {
        const accPayload: any = {
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName,
          phoneNumber: profile.phoneNumber || '',
          farmName: profile.farmName || '',
          location: profile.location || '',
          crop: profile.crop || '',
          farmSize: profile.farmSize || '',
          updatedAt: new Date().toISOString(),
        };
        if (password) {
          accPayload.password = password;
        }
        await fetch(`${dbUrl}/registered_accounts/${emailKey}.json`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(accPayload),
        });
      } catch (e) {
        console.warn('Account index sync notice:', e);
      }
    }

    const { db } = getFirebaseInstance();
    if (db) {
      try {
        await set(ref(db, `users/${profile.uid}`), profile);
      } catch {}
    }
  }, []);

  // Fetch profile from Firebase RTDB
  const fetchProfileFromFirebase = useCallback(async (uid: string): Promise<UserProfile | null> => {
    const dbUrl = DEFAULT_FIREBASE_URL.replace(/\/$/, '');
    try {
      const res = await fetch(`${dbUrl}/users/${uid}.json`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object') {
          return data as UserProfile;
        }
      }
    } catch (e) {
      console.warn('Profile fetch notice:', e);
    }
    return null;
  }, []);

  useEffect(() => {
    const { auth } = getFirebaseInstance();

    if (!auth) {
      const localProfile = localStorage.getItem('agroeye_user_profile');
      if (localProfile) {
        try {
          setUserProfile(JSON.parse(localProfile));
        } catch {}
      }
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const cloudProfile = await fetchProfileFromFirebase(firebaseUser.uid);
        if (cloudProfile) {
          setUserProfile(cloudProfile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('agroeye_user_profile', JSON.stringify(cloudProfile));
          }
        } else {
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Farmer'),
            phoneNumber: firebaseUser.phoneNumber || '',
            farmName: 'my Farm Dabok',
            location: 'Dabok, Udaipur',
            crop: 'Rice / Foliar Canopy',
            farmSize: '5 Acres',
            role: 'farmer',
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };
          setUserProfile(newProfile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('agroeye_user_profile', JSON.stringify(newProfile));
          }
          syncProfileToFirebase(newProfile);
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfileFromFirebase, syncProfileToFirebase]);

  const registerWithEmail = async (data: RegisterData) => {
    setIsLoading(true);
    const dbUrl = DEFAULT_FIREBASE_URL.replace(/\/$/, '');
    const cleanEmail = data.email.toLowerCase().trim();
    const emailKey = sanitizeEmailKey(cleanEmail);

    try {
      // 1. Check if account already exists in RTDB
      try {
        const checkRes = await fetch(`${dbUrl}/registered_accounts/${emailKey}.json`, { cache: 'no-store' });
        if (checkRes.ok) {
          const existingAcc = await checkRes.json();
          if (existingAcc && existingAcc.email) {
            throw new Error('An account with this email is already registered. Please sign in.');
          }
        }
      } catch (err: any) {
        if (err.message?.includes('already registered')) throw err;
      }

      // 2. Firebase Auth registration if available
      const { auth } = getFirebaseInstance();
      let uid = 'usr_' + Date.now() + '_' + Math.floor(1000 + Math.random() * 9000);

      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
          uid = userCredential.user.uid;
          if (data.displayName) {
            await updateProfile(userCredential.user, { displayName: data.displayName });
          }
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-in-use') {
            throw new Error('An account with this email is already registered. Please sign in.');
          } else if (authErr.code === 'auth/weak-password') {
            throw new Error('Password must be at least 6 characters.');
          } else if (authErr.code === 'auth/invalid-email') {
            throw new Error('Invalid email address format.');
          }
          console.warn('Firebase Auth user creation notice:', authErr);
        }
      }

      // 3. Store full UserProfile
      const profile: UserProfile = {
        uid,
        email: cleanEmail,
        displayName: data.displayName || cleanEmail.split('@')[0],
        phoneNumber: data.phoneNumber || '',
        farmName: data.farmName || 'Primary Farm Sector',
        location: data.location || 'Dabok, Udaipur',
        crop: data.crop || 'Rice / Paddy',
        farmSize: data.farmSize || '5 Acres',
        role: 'farmer',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      // 4. Save account credential index and profile to Firebase RTDB
      await syncProfileToFirebase(profile, data.password);

      setUserProfile(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agroeye_user_profile', JSON.stringify(profile));
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    const dbUrl = DEFAULT_FIREBASE_URL.replace(/\/$/, '');
    const cleanEmail = email.toLowerCase().trim();
    const emailKey = sanitizeEmailKey(cleanEmail);

    try {
      const { auth } = getFirebaseInstance();
      let authenticatedUid: string | null = null;
      let authError: any = null;

      // 1. Try Firebase Auth first if initialized
      if (auth) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
          authenticatedUid = userCredential.user.uid;
        } catch (err: any) {
          authError = err;
        }
      }

      // 2. Check Firebase RTDB registered_accounts index
      if (!authenticatedUid) {
        let accountData: any = null;
        try {
          const res = await fetch(`${dbUrl}/registered_accounts/${emailKey}.json`, { cache: 'no-store' });
          if (res.ok) {
            accountData = await res.json();
          }
        } catch (e) {
          console.warn('Account index lookup notice:', e);
        }

        if (!accountData) {
          // If neither Firebase Auth succeeded nor account exists in RTDB
          if (authError?.code === 'auth/wrong-password' || authError?.code === 'auth/invalid-credential') {
            throw new Error('Incorrect password. Please verify your credentials.');
          }
          throw new Error('No registered account found with this email. Please create an account first.');
        }

        // Account exists in RTDB: Verify password
        if (accountData.password && accountData.password !== pass) {
          throw new Error('Incorrect password. Please verify your credentials.');
        }

        authenticatedUid = accountData.uid;
      }

      if (!authenticatedUid) {
        throw new Error('No registered account found with this email. Please create an account first.');
      }

      // 3. Load user profile
      const cloudProfile = await fetchProfileFromFirebase(authenticatedUid);
      const profile: UserProfile = cloudProfile || {
        uid: authenticatedUid,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        farmName: 'my Farm Dabok',
        location: 'Dabok, Udaipur',
        crop: 'Rice / Paddy',
        farmSize: '5 Acres',
        role: 'farmer',
        lastLoginAt: new Date().toISOString(),
      };

      profile.lastLoginAt = new Date().toISOString();
      setUserProfile(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agroeye_user_profile', JSON.stringify(profile));
      }
      syncProfileToFirebase(profile);
    } catch (err: any) {
      console.error('Login validation error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!userProfile) return;
    const updated: UserProfile = {
      ...userProfile,
      ...updates,
    };
    setUserProfile(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroeye_user_profile', JSON.stringify(updated));
    }
    await syncProfileToFirebase(updated);
  };

  const logout = async () => {
    try {
      const { auth } = getFirebaseInstance();
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      setUserProfile(null);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('agroeye_user_profile');
        localStorage.removeItem('agroeye_local_operator');
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const loginAsOperator = async () => {
    // No-op or redirects
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        operator: userProfile,
        isAuthenticated: !!userProfile,
        isLoading,
        registerWithEmail,
        loginWithEmail,
        updateUserProfile,
        logout,
        loginAsOperator,
        isAuthModalOpen: false,
        setIsAuthModalOpen: () => {},
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
