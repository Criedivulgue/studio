'use client';

import {
  useState, useEffect, createContext, useContext,
  ReactNode, useMemo
} from 'react';
import { useRouter } from 'next/navigation';
import { onAuthChange, logout } from '@/services/authService';
import type { User as AuthUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db, rtdb } from '@/lib/firebase';
import type { PlatformUser } from '@/lib/types';
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";

interface AuthContextType {
  user: PlatformUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthChange(async (authUser: AuthUser | null) => {
      if (authUser) {
        const userDocRef = doc(db, "users", authUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          // CORREÇÃO: Removido 'isOnline' e adicionado campos faltantes para alinhar com o tipo PlatformUser.
          setUser({ 
            id: authUser.uid,
            email: authUser.email ?? '',
            name: firestoreData.name,
            role: firestoreData.role,
            status: firestoreData.status, // Adicionado
            whatsapp: firestoreData.whatsapp, // Adicionado
            createdAt: firestoreData.createdAt, // Adicionado
          });
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const userStatusDatabaseRef = ref(rtdb, '/status/' + user.id);
    const connectedRef = ref(rtdb, '.info/connected');

    const listener = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(userStatusDatabaseRef, {
          isOnline: true,
          last_changed: serverTimestamp(),
        });
        onDisconnect(userStatusDatabaseRef).set({
          isOnline: false,
          last_changed: serverTimestamp(),
        });
      }
    });

    return () => {
      listener();
      onDisconnect(userStatusDatabaseRef).cancel();
      set(userStatusDatabaseRef, {
        isOnline: false,
        last_changed: serverTimestamp(),
      });
    };
  }, [user]);

  const handleSignOut = async () => {
    if (user) {
        const userStatusDatabaseRef = ref(rtdb, '/status/' + user.id);
        await set(userStatusDatabaseRef, {
            isOnline: false,
            last_changed: serverTimestamp(),
        });
    }
    await logout();
    setUser(null);
    router.push('/login');
  };

  const value = useMemo(() => ({
    user,
    loading,
    isSuperAdmin: user?.role === 'superadmin',
    signOut: handleSignOut,
  }), [user, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
