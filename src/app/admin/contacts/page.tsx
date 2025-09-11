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
import { columns, ContactColumn } from './_components/columns';
import { AddContactModal } from '@/components/admin/AddContactModal';

const ContactsDataTable = createDataTable<ContactColumn, any>();

export default function AdminContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // CORREÇÃO: A função agora recebe o objeto de usuário completo para usar sua role.
  const fetchData = async (currentUser: PlatformUser) => {
    setLoading(true);
    try {
      // CORREÇÃO: A consulta agora é feita na coleção raiz 'contacts' e filtrada por 'ownerId' para admins.
      const contactsCollection = collection(db, 'contacts');
      const contactsQuery = currentUser.role === 'superadmin' 
        ? query(contactsCollection) 
        : query(contactsCollection, where('ownerId', '==', currentUser.id));

      // CORREÇÃO: A consulta de tags foi movida para a coleção raiz 'tags' para evitar problemas de permissão.
      const tagsCollection = collection(db, 'tags');
       const tagsQuery = currentUser.role === 'superadmin'
        ? query(tagsCollection)
        : query(tagsCollection, where('ownerId', '==', currentUser.id));

      const [contactsSnapshot, tagsSnapshot] = await Promise.all([
        getDocs(contactsQuery),
        getDocs(tagsQuery),
      ]);

      const tagMap = new Map<string, string>();
      tagsSnapshot.forEach(doc => tagMap.set(doc.id, doc.data().name));

      const contactsData: ContactColumn[] = contactsSnapshot.docs.map(doc => {
        const data = doc.data();
        // A lógica de mapeamento de grupos e interesses permanece a mesma.
        const groupNames = (data.groupIds || []).map((gid: string) => tagMap.get(gid)).filter(Boolean).join(', ') || 'Sem grupo';
        const interestNames = (data.interestIds || []).map((iid: string) => tagMap.get(iid)).filter(Boolean).join(', ') || 'Sem interesses';
          
        return {
          id: doc.id,
          name: data.name || 'Nome não informado',
          phone: data.whatsapp || 'N/A',
          groups: groupNames,
          interests: interestNames,
          rawData: {
            id: doc.id,
            name: data.name,
            phone: data.whatsapp,
            groupIds: data.groupIds || [],
            interestIds: data.interestIds || [],
          }
        };
      });
      
      setContacts(contactsData);

    } catch (error) {
      console.error("Error fetching data: ", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: 'Verifique as permissões do banco de dados.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // CORREÇÃO: Passando o objeto user completo para fetchData.
    if (!authLoading && user) {
      fetchData(user);
    }
     if (!authLoading && !user) {
      // Se não houver usuário após o carregamento, para de carregar.
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleSuccess = () => {
    setIsModalOpen(false);
    if(user) fetchData(user); // Recarrega os dados após adicionar um contato.
  };

  if (authLoading || !user) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
           <Heading title="Meus Contatos" description="Carregando seus contatos..."/>
           <Separator />
        </div>
      )
  }

  return (
    <>
      <AddContactModal 
        adminUid={user.id}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleSuccess}
        isSuperAdmin={user.role === 'superadmin'}
      />

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Contatos (${loading ? '...' : contacts.length})`}
            description="Gerencie seus contatos para facilitar o envio de mensagens."
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
          </Button>
        </div>
        <Separator />
        
        <ContactsDataTable
          columns={columns}
          data={contacts}
          searchKey="name"
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum contato encontrado. Adicione um para começar!"
        />
      </div>
    </>
  );
}
