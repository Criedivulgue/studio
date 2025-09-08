
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { BookUser, Users, MessageSquareText, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth(); 
  const [stats, setStats] = useState({
    contacts: 0,
    groups: 0,
    chats: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      const fetchData = async () => {
        setDataLoading(true);
        try {
          // CORREÇÃO: Trocar todas as instâncias de user.uid por user.id
          const contactsQuery = query(collection(db, `users/${user.id}/contacts`));
          const contactsSnap = await getDocs(contactsQuery);
          
          const groupsQuery = query(collection(db, `users/${user.id}/groups`));
          const groupsSnap = await getDocs(groupsQuery);

          const chatsQuery = query(collection(db, 'chatSessions'), where('adminId', '==', user.id));
          const chatsSnap = await getDocs(chatsQuery);

          setStats({
            contacts: contactsSnap.size,
            groups: groupsSnap.size,
            chats: chatsSnap.size,
          });
        } catch (error) {
          console.error("Error fetching dashboard data: ", error);
        } finally {
          setDataLoading(false);
        }
      };

      fetchData();
    }
  }, [user, authLoading]);

  if (authLoading) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin" />
          </div>
      )
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading title="Dashboard" description="Visão geral da sua conta." />
      <Separator />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Contatos
            </CardTitle>
            <BookUser className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.contacts}</div>
            <p className="text-xs text-muted-foreground">
              Total de contatos cadastrados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Grupos
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.groups}</div>
            <p className="text-xs text-muted-foreground">
              Total de grupos criados
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
            <MessageSquareText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.chats}</div>
            <p className="text-xs text-muted-foreground">
              Sessões de chat iniciadas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
