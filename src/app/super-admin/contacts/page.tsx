'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, collectionGroup } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { createDataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus } from 'lucide-react';

import { SuperAdminContactColumn, columns } from './_components/columns';
import { AddContactModal } from '@/components/admin/AddContactModal';

const SuperAdminContactsDataTable = createDataTable<SuperAdminContactColumn, any>();

export default function SuperAdminContactsPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const [contacts, setContacts] = useState<SuperAdminContactColumn[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  const fetchAllData = async () => {
    if (!isSuperAdmin) return;
    setDataLoading(true);
    try {
      const usersSnapshot = await getDocs(query(collection(db, 'users')));
      const userMap = new Map<string, string>();
      usersSnapshot.forEach(doc => userMap.set(doc.id, doc.data().name || 'Admin s/ nome'));

      const contactsQuery = collectionGroup(db, 'contacts');
      const contactsSnapshot = await getDocs(contactsQuery);

      const allContactsPromises = contactsSnapshot.docs.map(async (contactDoc) => {
        const contactData = contactDoc.data();
        const parentUserRef = contactDoc.ref.parent.parent;

        // CORREÇÃO: Verifica se o contato está aninhado sob um usuário antes de prosseguir.
        // Isso evita o erro "Cannot read properties of null (reading 'id')" para contatos na raiz.
        if (!parentUserRef) {
          return null; 
        }

        const adminId = parentUserRef.id;
        const adminName = userMap.get(adminId) || 'Admin deletado';
        
        const groupNames = (contactData.groupIds || []).join(', ') || 'Sem grupo';
        const interestNames = (contactData.interestIds || []).join(', ') || 'Sem interesses';

        return {
          id: contactDoc.id,
          adminId: adminId,
          name: contactData.name || 'Nome não informado',
          whatsapp: contactData.whatsapp || 'N/A',
          adminName: adminName,
          groups: groupNames,
          interests: interestNames,
        } as SuperAdminContactColumn;
      });

      const allContacts = (await Promise.all(allContactsPromises)).filter(Boolean) as SuperAdminContactColumn[];

      setContacts(allContacts);

    } catch (error) {
      console.error("Erro ao buscar dados: ", error);
      toast({ variant: "destructive", title: "Erro ao Carregar Dados" });
    } finally {
      setDataLoading(false);
    }
  };
  
  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
        fetchAllData();
    } else if (!authLoading && !isSuperAdmin) {
        setDataLoading(false);
    }
  }, [authLoading, isSuperAdmin]);


  if (authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!isSuperAdmin || !user) {
    return <div className="flex justify-center items-center h-64">Acesso Negado</div>;
  }

  const handleSuccess = () => {
     setIsModalOpen(false);
     fetchAllData();
  }

  return (
    <>
      {user && (
        <AddContactModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={handleSuccess}
          adminUid={user.id}
          isSuperAdmin={true}
        />
      )}

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading
            title={`Contatos Globais (${dataLoading ? '...' : contacts.length})`}
            description="Visualize e gerencie todos os contatos da plataforma."
          />
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
          </Button>
        </div>
        <Separator />
        
        <SuperAdminContactsDataTable
          columns={columns}
          data={contacts}
          searchKey="name"
          placeholder="Filtrar por nome do contato..."
          emptyMessage="Nenhum contato encontrado na plataforma."
        />
      </div>
    </>
  );
}
