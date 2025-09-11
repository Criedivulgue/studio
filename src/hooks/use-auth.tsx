'use client';

import {
  useState, useEffect, createContext, useContext, ReactNode, useMemo, useCallback
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { auth, db, rtdb } from '@/lib/firebase';
import { logout } from '@/services/authService';
import { useToast } from "@/hooks/use-toast";
import type { PlatformUser } from '@/lib/types';

interface AuthContextType {
  user: PlatformUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            const firestoreData = userDoc.data();
            setUser({
              id: firebaseUser.uid,
              email: firebaseUser.email ?? '',
              name: firestoreData.name,
              role: firestoreData.role,
              status: firestoreData.status,
              whatsapp: firestoreData.whatsapp,
              createdAt: firestoreData.createdAt,
            });
          } else {
            setUser(null);
            logout(); 
          }
          setLoading(false);
        }, (error) => {
          console.error("Auth Hook: Erro ao buscar dados do usuário.", error);
          setUser(null);
          setLoading(false);
        });
        return () => unsubscribeSnapshot();
      } else {
        setUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const userStatusDatabaseRef = ref(rtdb, '/status/' + user.id);
    const connectedRef = ref(rtdb, '.info/connected');
    const listener = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;
      set(userStatusDatabaseRef, { isOnline: true, last_changed: serverTimestamp() });
      onDisconnect(userStatusDatabaseRef).set({ isOnline: false, last_changed: serverTimestamp() });
    });
    return () => {
      if (user?.id) {
        const userStatusOnDisconnectRef = ref(rtdb, '/status/' + user.id);
        onDisconnect(userStatusOnDisconnectRef).cancel();
      }
    };
  }, [user]);

  const checkAndRedirect = useCallback(async () => {
    if (loading || !user) return;
    const isPrivilegedUser = user.role === 'admin' || user.role === 'superadmin';
    if (!isPrivilegedUser || pathname.startsWith('/login') || pathname.startsWith('/register')) return;

    const profilePath = user.role === 'superadmin' ? '/super-admin/profile' : '/admin/profile';
    if (pathname === profilePath) return;

    try {
      const publicProfileRef = doc(db, "public_profiles", user.id);
      const publicProfileDoc = await getDoc(publicProfileRef);
      if (!publicProfileDoc.exists()) {
        toast({ title: "Perfil Incompleto", description: "Complete seu perfil público para continuar." });
        router.push(profilePath);
      }
    } catch (error) {
      console.error("Erro ao verificar perfil público:", error);
    }
  }, [user, loading, pathname, router, toast]);

  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  const handleSignOut = useCallback(async () => {
    // Primeiro, atualiza o status de presença, se o usuário existir
    if (user?.id) {
        try {
            const userStatusDatabaseRef = ref(rtdb, '/status/' + user.id);
            await set(userStatusDatabaseRef, { isOnline: false, last_changed: serverTimestamp() });
        } catch (error) {
            console.error("Falha ao atualizar status de presença no logout:", error);
        }
    }
    
    // Inicia o logout no Firebase e o redirecionamento
    await logout();
    router.push('/login');
    // A linha setUser(null) foi removida. O onAuthStateChanged cuidará disso.

  }, [user, router]);

  const value = useMemo(() => ({
    user,
    loading,
    isSuperAdmin: user?.role === 'superadmin',
    signOut: handleSignOut,
  }), [user, loading, handleSignOut]);

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
