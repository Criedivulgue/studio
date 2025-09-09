'use client';

import {
  useState, useEffect, createContext, useContext,
  ReactNode, useMemo
} from 'react';
import { useRouter } from 'next/navigation'; // 1. Importar o useRouter
import { onAuthChange, logout } from '@/services/authService';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // 2. Instanciar o router

  useEffect(() => {
    const unsubscribe = onAuthChange((appUser: User | null) => {
      setUser(appUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    router.push('/login'); // 3. Redirecionar para a página de login
  };

  const value = useMemo(() => ({
    user,
    loading,
    isSuperAdmin: user?.role === 'superadmin',
    signOut: handleSignOut, 
  // Adicionar `router` ao array de dependências do useMemo se ele for usado no `value`,
  // mas como só é usado em handleSignOut, que é estável, não é estritamente necessário.
  // A boa prática é garantir que o objeto de contexto seja estável.
  }), [user, loading, router]);

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
