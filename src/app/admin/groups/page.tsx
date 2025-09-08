
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/data-table';
import { columns, GroupColumn } from './_components/columns'; // Colunas para Grupos

export default function AdminGroupsPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<GroupColumn[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/groups`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData: GroupColumn[] = snapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        memberCount: doc.data().members?.length || 0,
      }));
      setGroups(groupsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching groups: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading 
          title={`Grupos (${groups.length})`}
          description="Gerencie seus grupos de contatos."
        />
        <Button onClick={() => { /* TODO: Implementar modal de adição de grupo */ }}>
          <Plus className="mr-2 h-4 w-4" /> Criar Grupo
        </Button>
      </div>
      <Separator />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={groups}
          searchKey="name"
          placeholder="Filtrar por nome do grupo..."
          emptyMessage="Nenhum grupo encontrado."
        />
      )}
    </div>
  );
}
