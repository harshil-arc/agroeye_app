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

const defaultProfile: UserProfile = {
  uid: 'usr_baldev_singh',
  email: 'baldev.singh@agroeye.farm',
  displayName: 'Sardar Baldev Singh',
  phoneNumber: '+91 98765 43210',
  farmName: 'my Farm Dabok (Sector 1)',
  location: 'Dabok, Udaipur, Rajasthan',
  crop: 'Rice / Foliar Canopy',
  farmSize: '24.5 Acres',
  role: 'farmer',
  createdAt: '2026-01-15T08:00:00.000Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
      return defaultProfile;
    }
    return defaultProfile;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync profile to Firebase RTDB
  const syncProfileToFirebase = useCallback(async (profile: UserProfile) => {
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
      // Check cached profile
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
        // Try fetching full saved profile from Firebase RTDB
        const cloudProfile = await fetchProfileFromFirebase(firebaseUser.uid);
        if (cloudProfile) {
          setUserProfile(cloudProfile);
          if (typeof window !== 'undefined') {
            localStorage.setItem('agroeye_user_profile', JSON.stringify(cloudProfile));
          }
        } else {
          // Construct initial profile from Firebase User
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Farm Operator'),
            phoneNumber: firebaseUser.phoneNumber || '+91 98765 43210',
            farmName: 'my Farm Dabok',
            location: 'Dabok, Udaipur',
            crop: 'Rice / Foliar Canopy',
            farmSize: '24.5 Acres',
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
    try {
      const { auth } = getFirebaseInstance();
      let uid = 'usr_' + Date.now();

      if (auth) {
        try {
          const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
          uid = userCredential.user.uid;
          if (data.displayName) {
            await updateProfile(userCredential.user, { displayName: data.displayName });
          }
        } catch (authErr: any) {
          console.warn('Firebase Auth create user fallback:', authErr);
          // If auth domain is restricted or demo, continue with local and RTDB persistence
        }
      }

      const profile: UserProfile = {
        uid,
        email: data.email,
        displayName: data.displayName || data.email.split('@')[0],
        phoneNumber: data.phoneNumber || '',
        farmName: data.farmName || 'Primary Farm Plot',
        location: data.location || 'Dabok, Udaipur',
        crop: data.crop || 'Rice / Paddy',
        farmSize: data.farmSize || '5 Acres',
        role: 'farmer',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      };

      setUserProfile(profile);
      if (typeof window !== 'undefined') {
        localStorage.setItem('agroeye_user_profile', JSON.stringify(profile));
      }
      await syncProfileToFirebase(profile);
    } catch (err: any) {
      console.error('Registration error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { auth } = getFirebaseInstance();
      let uid = '';

      if (auth) {
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, pass);
          uid = userCredential.user.uid;
        } catch (authErr: any) {
          console.warn('Firebase Auth sign-in fallback:', authErr);
        }
      }

      if (!uid) {
        uid = 'usr_' + Math.abs(email.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0));
      }

      const cloudProfile = await fetchProfileFromFirebase(uid);
      const profile: UserProfile = cloudProfile || {
        uid,
        email,
        displayName: email.split('@')[0],
        farmName: 'my Farm Dabok',
        location: 'Dabok, Udaipur',
        crop: 'Rice / Foliar Canopy',
        farmSize: '24.5 Acres',
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
      console.error('Login error:', err);
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
    setUserProfile(defaultProfile);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroeye_user_profile', JSON.stringify(defaultProfile));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        operator: userProfile,
        isAuthenticated: !!userProfile || !!user,
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
