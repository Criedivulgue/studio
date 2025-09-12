'use client';

import { useEffect, useState } from 'react';
// CORREÇÃO: Remover import antigo do DB e adicionar os novos
import { collection, query, where, orderBy, onSnapshot, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { type HistoryEntry, columns } from './_components/columns';

const HistoryDataTable = createDataTable<HistoryEntry, any>();

export default function SuperAdminHistoryPage() {
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

  // CORREÇÃO: Efeito para buscar os dados quando o usuário e o DB estiverem prontos
  useEffect(() => {
    // Aguarda o auth, o db e o usuário estarem prontos
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
      toast({ variant: "destructive", title: "Erro ao Carregar", description: "Não foi possível buscar o histórico de conversas." });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, authLoading, db, toast]);

  const isLoading = loading || authLoading;

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title={`Meu Histórico de Chats (${isLoading ? '...' : history.length})`}
        description="Visualize o arquivo de suas conversas passadas e seus resumos gerados por IA."
      />
      <Separator />
      <HistoryDataTable 
        columns={columns} 
        data={history} 
        searchKey="contactName"
        placeholder="Filtrar por nome do contato..."
        emptyMessage="Nenhuma conversa arquivada encontrada."
        isLoading={isLoading} // CORREÇÃO: Passar o estado de carregamento
      />
    </div>
  );
}
