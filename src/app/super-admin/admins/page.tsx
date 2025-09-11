'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
// CORREÇÃO: Importando a função factory para criar a data table
import { createDataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { AdminUser, columns } from './_components/columns';

// CORREÇÃO: Criando uma instância da DataTable com o tipo específico AdminUser
const AdminDataTable = createDataTable<AdminUser, any>();

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: AdminUser[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<AdminUser, 'id'>),
        }))
        .filter(user => user.role === 'admin');

      setAdmins(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar usuários para filtrar admins: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      <Heading 
        title={`Usuários Administradores (${loading ? '...' : admins.length})`}
        description="Gerencie os usuários com permissão de administrador."
      />
      <Separator />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        // CORREÇÃO: Usando a instância tipada da DataTable
        <AdminDataTable
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
