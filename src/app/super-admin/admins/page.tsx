'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore'; // Importando o 'where'
import { db } from '@/lib/firebase';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { columns } from './_components/columns';
import type { PlatformUser } from '@/lib/types';

const AdminDataTable = createDataTable<PlatformUser, any>();

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Query otimizada para buscar apenas usuários com a role 'admin'
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminsData: PlatformUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<PlatformUser, 'id'>),
      }));

      setAdmins(adminsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar administradores: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      <Heading 
        title={`Lojistas Administradores (${loading ? '...' : admins.length})`}
        description="Gerencie os usuários com permissão de administrador das lojas."
      />
      <Separator />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          data={admins}
          searchKey="name"
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum lojista administrador encontrado."
        />
      )}
    </div>
  );
}
