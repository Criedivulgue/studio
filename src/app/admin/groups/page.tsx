'use client';

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { PlatformUser } from '@/lib/types';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2 } from 'lucide-react';
import { createDataTable } from '@/components/data-table';

import { GroupColumn, createColumns } from './_components/columns';
import { GroupModal } from './_components/group-modal';

const GroupsDataTable = createDataTable<GroupColumn, any>();

export default function AdminGroupsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);

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

  const fetchData = useCallback(async (currentUser: PlatformUser, dbInstance: Firestore) => {
    setLoading(true);
    try {
      const tagsCollection = collection(dbInstance, "tags");
      const contactsCollection = collection(dbInstance, "contacts");

      const groupsBaseQuery = [where("type", "==", "group")];
      if (currentUser.role !== 'superadmin') {
        groupsBaseQuery.push(where("ownerId", "==", currentUser.id));
      }
      const groupsQuery = query(tagsCollection, ...groupsBaseQuery);

      const contactsQuery = currentUser.role === 'superadmin'
        ? query(contactsCollection)
        : query(contactsCollection, where("ownerId", "==", currentUser.id));

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
        ownerId: doc.data().ownerId, 
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
    if (authLoading || !db) {
      setLoading(true);
      return;
    }
    if(user) {
      fetchData(user, db);
    } else {
      setLoading(false);
    }
  }, [user, authLoading, db, fetchData]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (user && db) {
      fetchData(user, db);
    }
  };

  const columns = createColumns(handleSuccess);

  const isLoading = loading || authLoading || !db;

  return (
    <>
      {user && (
          <GroupModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleSuccess}
            type="group"
            ownerId={user.id}
          />
      )}

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Grupos (${isLoading ? '...' : groups.length})`}
            description="Crie e gerencie grupos para organizar seus contatos."
          />
          <Button onClick={() => setIsModalOpen(true)} disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />} 
            Adicionar Grupo
          </Button>
        </div>
        <Separator />
        
        <GroupsDataTable
          columns={columns}
          data={groups}
          searchKey="name"
          placeholder="Filtrar por nome do grupo..."
          emptyMessage="Nenhum grupo encontrado. Crie um para começar!"
          isLoading={isLoading}
        />
      </div>
    </>
  );
}
