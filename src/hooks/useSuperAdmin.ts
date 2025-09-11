import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './use-auth';

interface DashboardData {
  totalUsers: number;
  totalContacts: number;
  totalTags: number;
  recentUsers: any[];
  recentContacts: any[];
}

export const useSuperAdmin = () => {
  const { user } = useAuth(); // Correctly get the user object which includes the role
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
    // Use user.role for checking permissions
    if (user?.role !== 'superadmin') {
      setError('Acesso negado: requer permissões de superadmin');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch contacts
      const contactsQuery = query(collection(db, 'contacts'));
      const contactsSnapshot = await getDocs(contactsQuery);
      const contacts = contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch tags
      const tagsQuery = query(collection(db, 'tags'));
      const tagsSnapshot = await getDocs(tagsQuery);
      const tags = tagsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      setDashboardData({
        totalUsers: users.length,
        totalContacts: contacts.length,
        totalTags: tags.length,
        recentUsers: users.slice(0, 5),
        recentContacts: contacts.slice(0, 5)
      });

    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'superadmin') {
      fetchAllData();
    } else if (user) { // If user is not superadmin
        setError('Acesso negado: requer permissões de superadmin');
        setLoading(false);
    }
  }, [user]);

  return {
    dashboardData,
    loading,
    error,
    refetch: fetchAllData,
    isSuperAdmin: user?.role === 'superadmin'
  };
};