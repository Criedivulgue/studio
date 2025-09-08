'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { AdminUser, columns } from './_components/columns';

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: AdminUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<AdminUser, 'id'>),
      }));
      setAdmins(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching admin users: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      <Heading 
        title={`Usuários Administradores (${admins.length})`}
        description="Gerencie os usuários com permissão de administrador."
      />
      <Separator />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={admins}
          searchKey="name"
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum administrador encontrado."
        />
      )}
    </div>
  );
}
