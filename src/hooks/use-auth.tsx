'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { getFirebaseInstances, ensureFirebaseInitialized } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';

// Tipo para um utilizador da plataforma (admin/superadmin)
interface PlatformUser extends DocumentData {
  id: string;
  role: 'admin' | 'superadmin';
  displayName: string;
  email: string;
  avatar?: string;
}

// Tipo para um visitante anónimo
interface AnonymousUser {
  id: string;
  role: 'anonymous';
  isAnonymous: true;
}

// O utilizador do contexto pode ser um administrador ou um visitante
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

    ensureFirebaseInitialized().then(() => {
      const { auth, db } = getFirebaseInstances();

      unsubscribeAuth = onAuthStateChanged(auth, (fbUser) => {
        unsubscribeSnapshot?.(); // Limpa o listener de perfil anterior

        if (fbUser) {
          setFirebaseUser(fbUser);
          const userDocRef = doc(db, 'users', fbUser.uid);

          unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              // CASO 1: É um administrador/superadmin
              setUser({ id: docSnap.id, ...docSnap.data() } as PlatformUser);
              setLoading(false);
            } else {
              // CASO 2: Não tem perfil. É um visitante anónimo?
              if (fbUser.isAnonymous) {
                setUser({ id: fbUser.uid, role: 'anonymous', isAnonymous: true });
                setLoading(false);
              } else {
                // CASO 3: É um utilizador registado mas sem perfil (erro)
                console.warn('Utilizador registado sem perfil. A deslogar.');
                signOut();
              }
            }
          }, (error) => {
            console.error("Erro no onSnapshot do perfil:", error);
            signOut(); // Em caso de erro de permissão, deslogar
          });
        } else {
          // CASO 4: Não há ninguém logado
          setUser(null);
          setFirebaseUser(null);
          setLoading(false);
        }
      });
    });

    return () => {
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
