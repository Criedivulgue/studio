'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Importa o useRouter
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

const ContactsDataTable = createDataTable<ContactColumn, any>();

export default function SuperAdminMyContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter(); // Inicializa o router
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactColumn[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async (currentUser: PlatformUser) => {
    setLoading(true);
    try {
      const contactsCollection = collection(db, 'contacts');
      // LÓGICA CORRIGIDA: Filtra contatos pelo ID do Super Admin
      const contactsQuery = query(contactsCollection, where('ownerId', '==', currentUser.id));

      const tagsCollection = collection(db, 'tags');
      const tagsQuery = query(tagsCollection, where('ownerId', '==', currentUser.id));

      const [contactsSnapshot, tagsSnapshot] = await Promise.all([
        getDocs(contactsQuery),
        getDocs(tagsQuery),
      ]);

      const tagMap = new Map<string, string>();
      tagsSnapshot.forEach(doc => tagMap.set(doc.id, doc.data().name));

      const contactsData: ContactColumn[] = contactsSnapshot.docs.map(doc => {
        const data = doc.data();
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
      toast({ variant: 'destructive', title: 'Erro ao carregar contatos' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData(user);
    }
     if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

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
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Contatos (${loading ? '...' : contacts.length})`}
            description="Gerencie seus contatos para facilitar o envio de mensagens."
          />
          {/* BOTÃO AJUSTADO para navegar para a página de criação */}
          <Button onClick={() => router.push('/super-admin/my-contacts/new')}>
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
