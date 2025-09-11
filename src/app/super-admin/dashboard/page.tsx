'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { BookUser, Users, MessageSquareText, Loader2, ShieldCheck } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function SuperAdminDashboardPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const [stats, setStats] = useState({
    // Personal Stats
    personalContacts: 0,
    personalGroups: 0,
    personalChats: 0,
    // Global Stats
    globalAdmins: 0,
    globalContacts: 0,
    globalChats: 0,
  });
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user && isSuperAdmin) {
      const fetchAllData = async () => {
        setDataLoading(true);
        try {
          // --- Personal Stats Queries (Standardized) ---
          const personalContactsQuery = query(collection(db, 'contacts'), where('ownerId', '==', user.id));
          const personalGroupsQuery = query(collection(db, `users/${user.id}/groups`));
          const personalChatsQuery = query(collection(db, 'conversations'), where('adminId', '==', user.id));

          // --- Global Stats Queries ---
          const globalAdminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
          const globalContactsQuery = collection(db, 'contacts');
          const globalChatsQuery = collection(db, 'conversations');

          const [
            personalContactsSnap,
            personalGroupsSnap,
            personalChatsSnap,
            globalAdminsSnap,
            globalContactsSnap,
            globalChatsSnap
          ] = await Promise.all([
            getDocs(personalContactsQuery),
            getDocs(personalGroupsQuery),
            getDocs(personalChatsQuery),
            getDocs(globalAdminsQuery),
            getDocs(globalContactsQuery),
            getDocs(globalChatsQuery),
          ]);

          setStats({
            personalContacts: personalContactsSnap.size,
            personalGroups: personalGroupsSnap.size,
            personalChats: personalChatsSnap.size,
            globalAdmins: globalAdminsSnap.size,
            globalContacts: globalContactsSnap.size,
            globalChats: globalChatsSnap.size,
          });
        } catch (error) {
          console.error("Error fetching dashboard data: ", error);
        } finally {
          setDataLoading(false);
        }
      };

      fetchAllData();
    } else if (!authLoading) {
      setDataLoading(false);
    }
  }, [user, isSuperAdmin, authLoading]);

  if (authLoading || dataLoading) {
      return (
          <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
              <Heading title="Dashboard" description="Carregando visão geral da plataforma..." />
              <Separator />
              <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
              </div>
          </div>
      )
  }

  return (
    <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
      {/* Personal Section */}
      <div>
        <Heading title="Minha Atividade Pessoal" description="Sua visão geral como administrador." />
        <Separator className="mt-4 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus Contatos</CardTitle>
              <BookUser className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.personalContacts}</div>
               <p className="text-xs text-muted-foreground">Total de contatos cadastrados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meus Grupos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.personalGroups}</div>
               <p className="text-xs text-muted-foreground">Total de grupos criados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minhas Conversas</CardTitle>
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.personalChats}</div>
               <p className="text-xs text-muted-foreground">Sessões de chat iniciadas</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Global Section */}
      <div>
        <Heading title="Visão Geral da Plataforma" description="Estatísticas globais de todo o sistema." />
        <Separator className="mt-4 mb-6" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.globalAdmins}</div>
               <p className="text-xs text-muted-foreground">Total de administradores na plataforma</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Contatos (Total)</CardTitle>
              <BookUser className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.globalContacts}</div>
              <p className="text-xs text-muted-foreground">Total de contatos em toda a plataforma</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversas (Total)</CardTitle>
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.globalChats}</div>
              <p className="text-xs text-muted-foreground">Total de conversas em toda a plataforma</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
