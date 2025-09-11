'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { type HistoryEntry, columns } from './_components/columns';

const HistoryDataTable = createDataTable<HistoryEntry, any>();

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }

    if (user?.id) {
      const conversationsQuery = query(
        collection(db, 'conversations'),
        where('adminId', '==', user.id),
        where('status', '==', 'archived'),
        orderBy('archivedAt', 'desc')
      );

      const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
        const historyData: HistoryEntry[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            contactName: data.contactName || 'Desconhecido',
            summary: data.summary || 'Nenhum resumo disponível.',
            archivedAt: data.archivedAt?.toDate().toISOString() || new Date().toISOString(),
          };
        });
        setHistory(historyData);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar histórico: ", error);
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
        setLoading(false);
        setHistory([]);
    }
  }, [user, authLoading]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title={`Histórico de Conversas (${loading ? '...' : history.length})`}
        description="Visualize o arquivo de conversas passadas e seus resumos gerados por IA."
      />
      <Separator />
      <HistoryDataTable
        columns={columns}
        data={history}
        searchKey="contactName"
        placeholder="Filtrar por contato..."
        emptyMessage="Nenhuma conversa arquivada encontrada."
      />
    </div>
  );
}
