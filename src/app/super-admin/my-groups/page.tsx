'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
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

  const fetchData = async (currentUser: PlatformUser) => {
    setLoading(true);
    try {
      const tagsCollection = collection(db, "tags");
      const contactsCollection = collection(db, "contacts");

      // MODIFICATION: Always filter by the current user's ID
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
  };

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if(user) {
      fetchData(user);
    }
  }, [user, authLoading]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    if (user) {
      fetchData(user);
    }
  };

  return (
    <>
      <GroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        type="group"
      />

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Grupos (${loading ? '...' : groups.length})`}
            description="Crie e gerencie seus grupos pessoais para organizar contatos."
          />
          <Button onClick={() => setIsModalOpen(true)}>
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
