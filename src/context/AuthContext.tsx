'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFirebaseInstance, onAuthStateChanged, signInWithEmailAndPassword, signInAnonymously, signOut, User } from '@/lib/firebase';

export interface OperatorProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: 'operator' | 'admin' | 'viewer';
  isAnonymous: boolean;
}

interface AuthContextType {
  user: User | null;
  operator: OperatorProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginAsOperator: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [operator, setOperator] = useState<OperatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const { auth } = getFirebaseInstance();

    if (!auth) {
      // Fallback local session if Firebase Auth is not configured in .env
      const localOperator = localStorage.getItem('agroeye_local_operator');
      if (localOperator) {
        try {
          setOperator(JSON.parse(localOperator));
        } catch {
          // ignore
        }
      }
      setIsLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const op: OperatorProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'Farm Field Operator'),
          role: 'operator',
          isAnonymous: firebaseUser.isAnonymous,
        };
        setOperator(op);
        localStorage.setItem('agroeye_local_operator', JSON.stringify(op));
      } else {
        setOperator(null);
        localStorage.removeItem('agroeye_local_operator');
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginAsOperator = async () => {
    setIsLoading(true);
    try {
      const { auth } = getFirebaseInstance();
      if (auth) {
        await signInAnonymously(auth);
      } else {
        // Mock local operator session
        const op: OperatorProfile = {
          uid: 'op_local_' + Date.now(),
          email: 'operator@agroeye.farm',
          displayName: 'Authorized Field Operator',
          role: 'operator',
          isAnonymous: true,
        };
        setOperator(op);
        localStorage.setItem('agroeye_local_operator', JSON.stringify(op));
      }
      setIsAuthModalOpen(false);
    } catch (error) {
      console.warn('Operator sign-in notice (falling back to local operator session):', error);
      const op: OperatorProfile = {
        uid: 'op_local_' + Date.now(),
        email: 'operator@agroeye.farm',
        displayName: 'Authorized Field Operator',
        role: 'operator',
        isAnonymous: true,
      };
      setOperator(op);
      localStorage.setItem('agroeye_local_operator', JSON.stringify(op));
      setIsAuthModalOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { auth } = getFirebaseInstance();
      if (auth) {
        await signInWithEmailAndPassword(auth, email, pass);
      } else {
        const op: OperatorProfile = {
          uid: 'user_' + Date.now(),
          email,
          displayName: email.split('@')[0],
          role: 'admin',
          isAnonymous: false,
        };
        setOperator(op);
        localStorage.setItem('agroeye_local_operator', JSON.stringify(op));
      }
      setIsAuthModalOpen(false);
    } catch (error: any) {
      console.error('Email sign in failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const { auth } = getFirebaseInstance();
      if (auth) {
        await signOut(auth);
      }
      setUser(null);
      setOperator(null);
      localStorage.removeItem('agroeye_local_operator');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        operator,
        isAuthenticated: !!operator || !!user,
        isLoading,
        loginAsOperator,
        loginWithEmail,
        logout,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
