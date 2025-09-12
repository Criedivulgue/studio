'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2 } from 'lucide-react';
import { createDataTable } from '@/components/data-table';
import { UserModal } from './_components/user-modal';
import { PlatformUser, createColumns } from './_components/columns';

// Cria a tabela de dados com a configuração de colunas e dados
const UsersDataTable = createDataTable<PlatformUser, any>();

export default function SuperAdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);

  // Efeito para inicializar o Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db } = getFirebaseInstances();
        setDb(db);
      } catch (error) {
        console.error("Firebase init error:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Não foi possível conectar ao banco de dados.' });
        setLoading(false);
      }
    };
    initFirebase();
  }, [toast]);

  // Função para buscar os usuários
  const fetchUsers = useCallback(async (dbInstance: Firestore) => {
    setLoading(true);
    try {
      const usersCollection = collection(dbInstance, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PlatformUser));
      setUsers(usersList);
    } catch (error) {
      console.error("Error fetching users: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar usuários" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Efeito para buscar os dados quando o DB estiver pronto
  useEffect(() => {
    if (db) {
      fetchUsers(db);
    }
  }, [db, fetchUsers]);

  // Função de callback para ser chamada após uma atualização bem-sucedida
  const handleUserUpdate = () => {
    if (db) {
      fetchUsers(db); // Recarrega os usuários
    }
    setIsModalOpen(false); // Fecha o modal
  };

  // Cria as colunas passando a função de atualização
  const columns = createColumns(handleUserUpdate);

  return (
    <>
      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onUserUpdate={handleUserUpdate} 
      />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Usuários (${loading ? '...' : users.length})`} 
            description="Gerencie os usuários da plataforma."
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Usuário
          </Button>
        </div>
        <Separator />
        <UsersDataTable
          columns={columns}
          data={users}
          searchKey="name"
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum usuário encontrado."
          isLoading={loading}
        />
      </div>
    </>
  );
}
