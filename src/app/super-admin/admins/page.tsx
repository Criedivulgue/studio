'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore'; // Removido o 'where' que causava o erro
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
    // CORREÇÃO: Busca TODOS os usuários, sem a cláusula 'where' que requer um índice inexistente.
    const q = query(collection(db, 'users'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: AdminUser[] = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...(doc.data() as Omit<AdminUser, 'id'>),
        }))
        // CORREÇÃO: Filtra os resultados AQUI no código, em vez de na consulta ao banco de dados.
        // Isso garante que a página funcione imediatamente, sem depender de configurações externas.
        .filter(user => user.role === 'admin');

      setAdmins(usersData);
      setLoading(false);
    }, (error) => {
      // Em caso de erro, garante que a tela não fique em loading infinito.
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
