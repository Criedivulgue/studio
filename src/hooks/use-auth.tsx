'use client';

import {
  useState, useEffect, createContext, useContext,
  ReactNode, useMemo
} from 'react';
import { onAuthChange } from '@/services/authService';
import type { User } from '@/lib/types';

// A interface de contexto agora só precisa do nosso usuário da aplicação.
interface AuthContextType {
  user: User | null;
  loading: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // useEffect agora está alinhado com a nova assinatura de onAuthChange.
  useEffect(() => {
    // A função onAuthChange agora retorna apenas o usuário do nosso aplicativo (ou null).
    const unsubscribe = onAuthChange((appUser: User | null) => {
      setUser(appUser);
      setLoading(false); // Esta linha crucial agora será executada corretamente.
    });

    // Limpa a inscrição quando o componente desmonta.
    return () => unsubscribe();
  }, []);

  // O useMemo foi simplificado pois não temos mais o firebaseUser aqui.
  const value = useMemo(() => ({
    user,
    loading,
    isSuperAdmin: user?.role === 'superadmin',
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
