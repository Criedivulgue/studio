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

import { InterestColumn, columns } from './_components/columns';
// Reutilizando o mesmo modal de grupos, que é genérico para tags.
import { GroupModal } from '../groups/_components/group-modal';

const InterestsDataTable = createDataTable<InterestColumn, any>();

export default function AdminInterestsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [interests, setInterests] = useState<InterestColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchData = async (currentUser: PlatformUser) => {
    setLoading(true);
    try {
      const tagsCollection = collection(db, "tags");
      const contactsCollection = collection(db, "contacts");

      const interestsBaseQuery = [where("type", "==", "interest")];
      if (currentUser.role !== 'superadmin') {
        interestsBaseQuery.push(where("ownerId", "==", currentUser.id));
      }
      const interestsQuery = query(tagsCollection, ...interestsBaseQuery);

      const contactsQuery = currentUser.role === 'superadmin'
        ? query(contactsCollection)
        : query(contactsCollection, where("ownerId", "==", currentUser.id));

      const [interestsSnapshot, contactsSnapshot] = await Promise.all([
        getDocs(interestsQuery),
        getDocs(contactsQuery),
      ]);

      const interestContactCounts = new Map<string, number>();
      contactsSnapshot.forEach(contactDoc => {
        const contactData = contactDoc.data();
        if (contactData.interestIds && Array.isArray(contactData.interestIds)) {
          contactData.interestIds.forEach(interestId => {
            interestContactCounts.set(interestId, (interestContactCounts.get(interestId) || 0) + 1);
          });
        }
      });

      const interestsData: InterestColumn[] = interestsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        contactCount: interestContactCounts.get(doc.id) || 0,
      }));

      setInterests(interestsData);

    } catch (error) {
      console.error("Error fetching interests data: ", error);
      toast({ variant: "destructive", title: "Erro ao carregar os interesses" });
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
        type="interest"
      />

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Interesses (${loading ? '...' : interests.length})`}
            description="Crie e gerencie interesses para segmentar seus contatos."
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Interesse
          </Button>
        </div>
        <Separator />
        
        <InterestsDataTable
          columns={columns}
          data={interests}
          searchKey="name"
          placeholder="Filtrar por nome do interesse..."
          emptyMessage="Nenhum interesse encontrado. Crie um para começar!"
        />
      </div>
    </>
  );
}
