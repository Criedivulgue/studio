'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getFirebaseInstances, ensureFirebaseInitialized } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';

export interface PlatformUser extends DocumentData {
  id: string;
  role: 'admin' | 'superadmin';
  displayName: string;
  email: string;
  avatar?: string;
}

interface AnonymousUser {
  id: string;
  role: 'anonymous';
  isAnonymous: true;
}

export type AuthUser = PlatformUser | AnonymousUser;

interface AuthContextType {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  firebaseUser: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = async () => {
    try {
      const { auth } = getFirebaseInstances();
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  useEffect(() => {
    let unsubscribeAuth: () => void;
    let unsubscribeSnapshot: () => void;
    let isMounted = true;

    const initializeAuth = async () => {
      await ensureFirebaseInitialized();
      const { auth, db } = getFirebaseInstances();

      unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
        if (!isMounted) return;
        
        unsubscribeSnapshot?.();
        setFirebaseUser(fbUser);

        if (fbUser) {
          const userDocRef = doc(db, 'users', fbUser.uid);

          unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (!isMounted) return;

            if (docSnap.exists()) {
              const userData = docSnap.data();
              
              if (userData.role === 'admin' || userData.role === 'superadmin') {
                setUser({ id: docSnap.id, ...userData } as PlatformUser);
              } else {
                setUser(null);
                console.warn('Usuário sem permissões de admin');
              }
            } else {
              setUser(null);
              console.warn('Usuário registrado sem perfil');
            }
            setLoading(false);
          }, (error) => {
            if (!isMounted) return;
            console.error("Erro no snapshot:", error);
            setUser(null);
            setLoading(false);
          });
        } else {
          setUser(null);
          setLoading(false);
        }
      }, (error) => {
        if (!isMounted) return;
        console.error("Erro no onAuthStateChanged:", error);
        setUser(null);
        setLoading(false);
      });
    };

    initializeAuth();

    return () => {
      isMounted = false;
      unsubscribeAuth?.();
      unsubscribeSnapshot?.();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, firebaseUser, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
