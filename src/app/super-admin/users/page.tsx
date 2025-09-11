'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
// CORREÇÃO: Importando a função factory em vez do componente diretamente.
import { createDataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { User, columns } from './_components/columns';

// CORREÇÃO: Criando uma instância da DataTable com o tipo específico User.
const UserDataTable = createDataTable<User, any>();

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: User[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<User, 'id'>),
      }));
      setUsers(usersData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar todos os usuários: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="space-y-4">
      <Heading 
        title={`Todos os Usuários (${loading ? '...' : users.length})`}
        description="Gerencie todos os usuários da plataforma (admins e superadmins)."
      />
      <Separator />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        // CORREÇÃO: Utilizando a instância da DataTable fortemente tipada.
        <UserDataTable
          columns={columns}
          data={users}
          searchKey="name"
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum usuário encontrado."
        />
      )}
    </div>
  );
}
