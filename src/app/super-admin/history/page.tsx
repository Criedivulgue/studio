'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { type HistoryEntry, columns } from './_components/columns';

const HistoryDataTable = createDataTable<HistoryEntry, any>();

export default function SuperAdminHistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
        setLoading(true);
        return;
    }

    if (!user) {
        setLoading(false);
        return;
    }

    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('adminId', '==', user.id),
      where('status', '==', 'archived'),
      orderBy('archivedAt', 'desc')
    );

    const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
      const fetchedHistory = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          contactName: data.contactName || 'N/A',
          summary: data.summary || 'Nenhum resumo gerado.',
          archivedAt: data.archivedAt?.toDate?.().toISOString() || new Date().toISOString(),
        } as HistoryEntry;
      });
      setHistory(fetchedHistory);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar histórico do Super Admin: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title={`Meu Histórico de Chats (${loading ? '...' : history.length})`}
        description="Visualize o arquivo de suas conversas passadas e seus resumos gerados por IA."
      />
      <Separator />
      <HistoryDataTable 
        columns={columns} 
        data={history} 
        searchKey="contactName"
        placeholder="Filtrar por nome do contato..."
        emptyMessage="Nenhuma conversa arquivada encontrada."
      />
    </div>
  );
}
