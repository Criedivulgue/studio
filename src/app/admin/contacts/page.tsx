'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { PlatformUser } from '@/lib/types';
import type { ContactColumn } from './_components/columns'; // CORREÇÃO APLICADA AQUI

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ContactManager } from '@/components/admin/ContactManager';

export default function AdminContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const fetchData = async (currentUser: PlatformUser) => {
    setLoading(true);
    try {
      const contactsCollection = collection(db, 'contacts');
      const contactsQuery = currentUser.role === 'superadmin' 
        ? query(contactsCollection) 
        : query(contactsCollection, where('ownerId', '==', currentUser.id));

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

  const handleExport = () => {
    if (contacts.length === 0) {
        toast({ variant: "destructive", title: 'Nenhum Contato', description: 'Não há contatos para exportar.' });
        return;
    }
    const dataToExport = contacts.map(c => ({
        Nome: c.name,
        Whatsapp: c.phone,
        Grupos: c.groups,
        Interesses: c.interests,
    }));

    const separator = ',';
    const keys = Object.keys(dataToExport[0]);
    const csvContent = 
        keys.join(separator) + 
        '\n' + 
        dataToExport.map(row => {
            return keys.map(k => {
                let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
                cell = cell instanceof Array ? cell.join(' | ') : cell.toString();
                cell = cell.replace(/"/g, '""');
                if (cell.search(/([",\n])/g) >= 0) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", 'contatos.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: 'Exportação Concluída', description: 'O arquivo CSV com seus contatos foi baixado.' });
  };

  useEffect(() => {
    if (!authLoading && user) {
      fetchData(user);
    }
    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const handleModalSuccess = () => {
    setIsAddModalOpen(false);
    setIsImportModalOpen(false);
    if(user) fetchData(user);
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
    <div className="p-4 md:p-8">
      <ContactManager 
        user={user}
        contacts={contacts}
        loading={loading}
        isAddModalOpen={isAddModalOpen}
        setIsAddModalOpen={setIsAddModalOpen}
        isImportModalOpen={isImportModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        handleExport={handleExport}
        handleModalSuccess={handleModalSuccess}
      />
    </div>
  );
}
