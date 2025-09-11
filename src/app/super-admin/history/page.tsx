'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
// CORREÇÃO: Importando o tipo correto (ConversationHistory) de columns.tsx
import { ConversationHistory, columns } from './_components/columns';

// CORREÇÃO: Criando o componente da tabela da forma correta
const HistoryDataTable = createDataTable<ConversationHistory, any>();

export default function SuperAdminHistoryPage() {
  // CORREÇÃO: Usando o tipo correto no estado
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'conversations'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const usersCache = new Map<string, string>();
      const adminsSnapshot = await getDocs(collection(db, 'users'));
      adminsSnapshot.forEach(doc => {
        usersCache.set(doc.id, doc.data().name || `Admin ${doc.id.substring(0, 4)}`);
      });

      // CORREÇÃO: Mapeando os dados para o tipo ConversationHistory
      const historyData: ConversationHistory[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          contactName: data.contactName || 'Nome não encontrado',
          adminName: usersCache.get(data.adminId) || 'Admin desconhecido',
          lastMessage: data.lastMessage || 'Nenhuma mensagem',
          // Mapeando para o campo esperado pelo arquivo de colunas
          lastMessageTimestamp: data.lastMessageTimestamp?.toDate() || data.updatedAt?.toDate() || data.createdAt?.toDate() || new Date(),
        };
      });

      setHistory(historyData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar histórico de conversas: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title={`Histórico de Chats (${loading ? '...' : history.length})`}
        description="Visualize todas as conversas iniciadas na plataforma."
      />
      <Separator />
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        // CORREÇÃO: Usando o componente de tabela criado corretamente
        <HistoryDataTable
          columns={columns}
          data={history}
          searchKey="contactName"
          placeholder="Filtrar por nome do contato..."
          emptyMessage="Nenhum histórico de conversa encontrado."
        />
      )}
    </div>
  );
}
