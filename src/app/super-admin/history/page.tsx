'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, onSnapshot, query, getDocs, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { History, columns } from './_components/columns'; // Adapte as colunas conforme necessário

export default function SuperAdminHistoryPage() {
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // A consulta agora busca da coleção 'conversations', que é o nosso histórico de chat.
    const q = query(collection(db, 'conversations'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // Cache para evitar buscar o mesmo usuário (admin) múltiplas vezes
      const usersCache = new Map<string, string>();
      const adminsSnapshot = await getDocs(collection(db, 'users'));
      adminsSnapshot.forEach(doc => {
        usersCache.set(doc.id, doc.data().name || `Admin ${doc.id.substring(0, 4)}`);
      });

      const historyData: History[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          contactName: data.contactName || 'Nome não encontrado',
          adminName: usersCache.get(data.adminId) || 'Admin desconhecido',
          lastMessage: data.lastMessage || 'Nenhuma mensagem',
          status: data.status || 'active',
          adminId: data.adminId,
          contactId: data.contactId,
          createdAt: data.createdAt?.toDate() || new Date(), // Converte Timestamp para Date
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
    <div className="space-y-4">
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
        <DataTable
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
