'use client';

import { useEffect, useState, useCallback } from 'react';
// CORREÇÃO: Remover import antigo do DB e adicionar os novos
import { collection, onSnapshot, query, where, orderBy, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { type HistoryEntry, columns } from './_components/columns';

const HistoryDataTable = createDataTable<HistoryEntry, any>();

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  // CORREÇÃO: Adicionar estado para o DB
  const [db, setDb] = useState<Firestore | null>(null);

  // CORREÇÃO: Efeito para inicializar o Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Firebase init error:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Não foi possível carregar o histórico.' });
        setLoading(false);
      }
    };
    initFirebase();
  }, [toast]);

  // CORREÇÃO: Efeito para escutar as alterações no histórico, dependente do DB
  useEffect(() => {
    if (authLoading || !db || !user?.id) {
        if (!authLoading) setLoading(false);
        if (!user?.id) setHistory([]); // Limpa o histórico se o usuário deslogar
        return;
    }

    setLoading(true);
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
      toast({ variant: "destructive", title: "Erro ao Carregar", description: "Não foi possível buscar as conversas arquivadas." });
      setLoading(false);
    });

    // Função de limpeza para parar de escutar quando o componente for desmontado
    return () => unsubscribe();
    
  }, [user, authLoading, db, toast]);

  const isLoading = loading || authLoading;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title={`Histórico de Conversas (${isLoading ? '...' : history.length})`}
        description="Visualize o arquivo de conversas passadas e seus resumos gerados por IA."
      />
      <Separator />
      <HistoryDataTable
        columns={columns}
        data={history}
        searchKey="contactName"
        placeholder="Filtrar por contato..."
        emptyMessage="Nenhuma conversa arquivada encontrada."
        isLoading={isLoading}
      />
    </div>
  );
}
