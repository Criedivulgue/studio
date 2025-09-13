'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { BookUser, Users, MessageSquareText, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(); 
  const [stats, setStats] = useState({ contacts: 0, groups: 0, chats: 0 });
  const [dataLoading, setDataLoading] = useState(true);
  const [db, setDb] = useState<Firestore | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Firebase init error:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Não foi possível conectar aos serviços.' });
        setDataLoading(false);
      }
    };
    initFirebase();
  }, [toast]);

  useEffect(() => {
    // ✅ CORREÇÃO CRÍTICA: Não buscar dados se não for admin
    if (authLoading || !user || user.role === 'anonymous' || !db) {
      if (!authLoading) setDataLoading(false);
      return;
    }

    const fetchData = async () => {
      setDataLoading(true);
      try {
        const contactsQuery = query(collection(db, 'contacts'), where('ownerId', '==', user.id));
        const groupsQuery = query(collection(db, 'tags'), where('ownerId', '==', user.id));
        const chatsQuery = query(collection(db, 'conversations'), where('adminId', '==', user.id));
        
        const [contactsSnap, groupsSnap, chatsSnap] = await Promise.all([
            getDocs(contactsQuery),
            getDocs(groupsQuery),
            getDocs(chatsQuery)
        ]);

        setStats({ contacts: contactsSnap.size, groups: groupsSnap.size, chats: chatsSnap.size });
      } catch (error) {
        console.error("Error fetching dashboard data: ", error);
        toast({ variant: 'destructive', title: 'Erro ao Carregar Dados', description: 'Não foi possível buscar as estatísticas.' });
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [user, authLoading, db, toast]);

  const isLoading = authLoading || dataLoading;

  // ✅ Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading title="Dashboard" description="Visão geral da sua conta." />
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos</CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.contacts}</div>
            <p className="text-xs text-muted-foreground">Total de contatos cadastrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Grupos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.groups}</div>
            <p className="text-xs text-muted-foreground">Total de grupos e interesses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.chats}</div>
            <p className="text-xs text-muted-foreground">Sessões de chat iniciadas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
