import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { getFirebaseInstances } from '../lib/firebase';
import { useAuth } from './use-auth';
import type { PlatformUser, Contact } from '@/lib/types'; // Importando os tipos

interface DashboardData {
  totalUsers: number;
  totalContacts: number;
  totalTags: number;
  recentUsers: PlatformUser[]; // Tipagem forte
  recentContacts: Contact[];    // Tipagem forte
}

export const useSuperAdmin = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalContacts: 0,
    totalTags: 0,
    recentUsers: [],
    recentContacts: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = async () => {
    if (user?.role !== 'superadmin') {
      setError('Acesso negado: requer permissões de superadmin');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { db } = getFirebaseInstances();
      // Otimizando as queries para pegar totais e recentes de forma eficiente
      const usersCollection = collection(db, 'users');
      const contactsCollection = collection(db, 'contacts');
      const tagsCollection = collection(db, 'tags');

      // Queries para totais
      const usersSnapshot = await getDocs(usersCollection);
      const contactsSnapshot = await getDocs(contactsCollection);
      const tagsSnapshot = await getDocs(tagsCollection);

      // Queries para recentes (ordenando por 'createdAt' se disponível)
      const recentUsersQuery = query(usersCollection, orderBy('createdAt', 'desc'), limit(5));
      const recentContactsQuery = query(contactsCollection, orderBy('createdAt', 'desc'), limit(5));

      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentContactsSnapshot = await getDocs(recentContactsQuery);

      const recentUsers = recentUsersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as PlatformUser);
      const recentContacts = recentContactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Contact);

      setDashboardData({
        totalUsers: usersSnapshot.size,
        totalContacts: contactsSnapshot.size,
        totalTags: tagsSnapshot.size,
        recentUsers,
        recentContacts,
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError('Falha ao carregar os dados. Verifique a console para detalhes.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        if (user.role === 'superadmin') {
            fetchAllData();
        } else {
            setError('Acesso negado: requer permissões de superadmin');
            setLoading(false);
        }
    }
    // A correção definitiva: usar um valor primitivo e estável (ID) na dependência.
  }, [user?.id]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchAllData,
    isSuperAdmin: user?.role === 'superadmin'
  };
};
