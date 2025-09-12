'use client';

import {
  useState, useEffect, createContext, useContext, ReactNode, useMemo, useCallback
} from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, getDoc } from 'firebase/firestore';
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";

import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { logout as logoutService } from '@/services/authService';
import { useToast } from "@/hooks/use-toast";
import type { PlatformUser } from '@/lib/types';

interface FirebaseServices {
  db: any;
  auth: any;
  rtdb: any;
}

interface AuthContextType {
  user: PlatformUser | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => void;
  isLoggingOut: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebase, setFirebase] = useState<FirebaseServices | null>(null);
  const [user, setUser] = useState<PlatformUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        setFirebase(getFirebaseInstances());
      } catch (err) {
        console.error("Falha crítica na inicialização do Firebase no AuthProvider:", err);
        setLoading(false);
      }
    };
    initFirebase();
  }, []);

  useEffect(() => {
    if (!firebase) return;
    // CORREÇÃO: Destruturação das instâncias do Firebase
    const { auth, db } = firebase;

    const handleUserChange = (firestoreData: any, firebaseUser: FirebaseUser) => {
      setUser({
        id: firebaseUser.uid, email: firebaseUser.email ?? '', name: firestoreData.name,
        role: firestoreData.role, status: firestoreData.status, whatsapp: firestoreData.whatsapp,
        createdAt: firestoreData.createdAt,
      });
      setLoading(false);
    };

    const handleNoUser = () => {
      setUser(null);
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && !firebaseUser.isAnonymous) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        const unsubscribeSnapshot = onSnapshot(userDocRef, (userDoc) => {
          if (userDoc.exists()) {
            handleUserChange(userDoc.data(), firebaseUser);
          } else {
            logoutService().finally(handleNoUser);
          }
        }, (error) => {
          console.error("Auth Hook: Erro ao observar dados do utilizador.", error);
          logoutService().finally(handleNoUser);
        });
        return () => unsubscribeSnapshot();
      } else {
        handleNoUser();
      }
    });

    return () => unsubscribe();
  }, [firebase]); // A dependência de `firebase` está correta

  // REINTRODUZIDO: Lógica de verificação e redirecionamento de perfil
  const checkAndRedirect = useCallback(async () => {
    if (loading || !user || !firebase) return;
    const { db } = firebase;
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
  }, [user, loading, pathname, router, toast, firebase]);

  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  const handleSignOut = useCallback(async () => {
    if (!firebase) return;
    setIsLoggingOut(true);
    try {
      await logoutService();
      router.push('/login');
    } catch (error) {
      console.error("Erro durante o logout:", error);
      toast({ title: "Erro", description: "Não foi possível fazer logout.", variant: "destructive" });
    } finally {
      setIsLoggingOut(false);
    }
  }, [firebase, router, toast]);

  // Gestão de presença (online/offline)
  useEffect(() => {
    if (!user || !firebase) return;
    const { rtdb } = firebase;
    const userStatusDatabaseRef = ref(rtdb, '/status/' + user.id);
    onValue(ref(rtdb, '.info/connected'), (snap) => {
      if (snap.val() === true) {
        set(userStatusDatabaseRef, { isOnline: true, last_changed: serverTimestamp() });
        onDisconnect(userStatusDatabaseRef).set({ isOnline: false, last_changed: serverTimestamp() });
      }
    });
    return () => {
      if (user?.id) {
        onDisconnect(ref(rtdb, '/status/' + user.id)).cancel();
      }
    };
  }, [user, firebase]);

  const value = useMemo(() => ({
    user,
    loading: loading || isLoggingOut,
    isSuperAdmin: user?.role === 'superadmin',
    signOut: handleSignOut,
    isLoggingOut,
  }), [user, loading, isLoggingOut, handleSignOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
