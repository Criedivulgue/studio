'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { User, columns } from './_components/columns'; // Reutilizando a definição de coluna, se aplicável, ou crie uma nova.

export default function SuperAdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Busca todos os documentos da coleção 'users' em tempo real.
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
      setLoading(false); // Garante que a página não trave em loading
    });

    // Limpa o listener ao desmontar o componente.
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
        <DataTable
          columns={columns}
          data={users}
          searchKey="name" // Assumindo que a busca principal será por nome
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum usuário encontrado."
        />
      )}
    </div>
  );
}
