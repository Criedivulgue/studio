'use client';

import { useState, useEffect, useCallback } from 'react';
// CORREÇÃO: Mover tipos do Firestore para cá e importar inicializadores
import { Firestore, collection, query, where, getDocs } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { PlatformUser } from '@/lib/types';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus } from 'lucide-react';
import { createDataTable } from '@/components/data-table';

import { GroupColumn, columns } from './_components/columns';
import { GroupModal } from './_components/group-modal';

const GroupsDataTable = createDataTable<GroupColumn, any>();

export default function SuperAdminMyGroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // CORREÇÃO: Estado para a instância do Firestore
  const [db, setDb] = useState<Firestore | null>(null);

  // CORREÇÃO: Inicializa o Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Erro ao inicializar Firebase:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Não foi possível conectar ao banco de dados.' });
        setLoading(false);
      }
    };
    initFirebase();
  }, [toast]);

  const fetchData = useCallback(async (currentUser: PlatformUser, firestoreDb: Firestore) => {
    setLoading(true);
    try {
      const tagsCollection = collection(firestoreDb, "tags");
      const contactsCollection = collection(firestoreDb, "contacts");

      const groupsQuery = query(
        tagsCollection, 
        where("type", "==", "group"),
        where("ownerId", "==", currentUser.id)
      );
      
      const contactsQuery = query(contactsCollection, where("ownerId", "==", currentUser.id));

      const [groupsSnapshot, contactsSnapshot] = await Promise.all([
        getDocs(groupsQuery),
        getDocs(contactsQuery),
      ]);

      const groupContactCounts = new Map<string, number>();
      contactsSnapshot.forEach(contactDoc => {
        const contactData = contactDoc.data();
        if (contactData.groupIds && Array.isArray(contactData.groupIds)) {
          contactData.groupIds.forEach(groupId => {
            groupContactCounts.set(groupId, (groupContactCounts.get(groupId) || 0) + 1);
          });
        }
      });

      const groupsData: GroupColumn[] = groupsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        contactCount: groupContactCounts.get(doc.id) || 0,
      }));

      setGroups(groupsData);

    } catch (error) {
      console.error("Error fetching groups data: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar os grupos" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user && db) {
      fetchData(user, db);
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, db, fetchData]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (user && db) {
      fetchData(user, db);
    }
  };

  if (authLoading || !db) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
           <Heading title="Meus Grupos" description="Carregando seus grupos..."/>
           <Separator />
        </div>
      )
  }
  
  return (
    <>
      {user && (
          <GroupModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSuccess}
            type="group"
          />
      )}

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Grupos (${loading ? '...' : groups.length})`}
            description="Crie e gerencie seus grupos pessoais para organizar contatos."
          />
          <Button onClick={() => setIsModalOpen(true)} disabled={!user}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Grupo
          </Button>
        </div>
        <Separator />
        
        <GroupsDataTable
          columns={columns}
          data={groups}
          searchKey="name"
          placeholder="Filtrar por nome do grupo..."
          emptyMessage="Nenhum grupo encontrado. Crie um para começar!"
        />
      </div>
    </>
  );
}
