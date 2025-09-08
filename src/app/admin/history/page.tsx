'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { HistoryEntry, columns } from './_components/columns';

export default function HistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const conversationsQuery = query(
        collectionGroup(db, 'conversations'), 
        where('adminId', '==', user.id),
        orderBy('lastMessageTimestamp', 'desc')
      );

      const unsubscribe = onSnapshot(conversationsQuery, (snapshot) => {
        if (snapshot.empty) {
          setHistory([]);
          setLoading(false);
          return;
        }

        const historyData: HistoryEntry[] = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            contactName: data.contactName || 'Desconhecido',
            lastMessage: data.lastMessage || 'Nenhuma mensagem',
            lastMessageTimestamp: data.lastMessageTimestamp?.toDate().toISOString() || new Date().toISOString(),
          };
        });
        setHistory(historyData);
        setLoading(false);
      }, (error) => {
        console.error("Erro ao buscar histórico com collectionGroup: ", error);
        // ALERTA: Um erro comum aqui é a falta de um índice no Firestore.
        // O erro no console do navegador geralmente inclui um link para criar o índice necessário.
        setLoading(false);
      });

      return () => unsubscribe();
    } else {
        setLoading(false);
    }
  }, [user]);

  return (
    <div className="space-y-4">
      <Heading 
        title={`Histórico de Conversas (${history.length})`}
        description="Visualize todas as suas conversas passadas."
      />
      <Separator />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={history}
          searchKey="contactName"
          placeholder="Filtrar por contato..."
          emptyMessage="Nenhum histórico de conversa foi encontrado."
        />
      )}
    </div>
  );
}
