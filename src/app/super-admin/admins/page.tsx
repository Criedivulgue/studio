'use client';

import { useEffect, useState } from 'react';
// CORREÇÃO: Remover import antigo do DB e adicionar os novos
import { collection, onSnapshot, query, where, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { Loader2 } from 'lucide-react';
import { columns } from './_components/columns';
import type { PlatformUser } from '@/lib/types';

const AdminDataTable = createDataTable<PlatformUser, any>();

export default function SuperAdminAdminsPage() {
  const [admins, setAdmins] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
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
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Não foi possível conectar ao banco de dados.' });
        setLoading(false);
      }
    };
    initFirebase();
  }, [toast]);

  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const q = query(collection(db, 'users'), where('role', '==', 'admin'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const adminsData: PlatformUser[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<PlatformUser, 'id'>),
      }));

      setAdmins(adminsData);
      setLoading(false);
    }, (error) => {
      console.error("Erro ao buscar administradores: ", error);
      toast({ variant: 'destructive', title: 'Erro ao Carregar', description: 'Não foi possível buscar os administradores.' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, toast]);

  if (loading || !db) {
    return (
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Heading 
          title={`Lojistas Administradores (...)`}
          description="Gerencie os usuários com permissão de administrador das lojas."
        />
        <Separator />
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title={`Lojistas Administradores (${admins.length})`}
        description="Gerencie os usuários com permissão de administrador das lojas."
      />
      <Separator />
      <AdminDataTable
        columns={columns}
        data={admins}
        searchKey="name"
        placeholder="Filtrar por nome..."
        emptyMessage="Nenhum lojista administrador encontrado."
      />
    </div>
  );
}
