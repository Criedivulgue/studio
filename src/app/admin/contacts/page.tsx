'use client';

import { useState, useEffect } from 'react';
// CORREÇÃO: Remover import antigo do DB e adicionar os novos
import { collection, query, where, getDocs, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { PlatformUser } from '@/lib/types';
import type { ContactColumn } from './_components/columns';

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
  // CORREÇÃO: Adicionar estado para o DB
  const [db, setDb] = useState<Firestore | null>(null);

  // CORREÇÃO: Efeito para inicializar o Firebase
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

  const fetchData = async (currentUser: PlatformUser, dbInstance: Firestore) => {
    setLoading(true);
    try {
      const contactsCollection = collection(dbInstance, 'contacts');
      const contactsQuery = currentUser.role === 'superadmin' 
        ? query(contactsCollection) 
        : query(contactsCollection, where('ownerId', '==', currentUser.id));

      const tagsCollection = collection(dbInstance, 'tags');
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
  
  // CORREÇÃO: Adicionar `db` como dependência e passá-lo para `fetchData`
  useEffect(() => {
    if (!authLoading && user && db) {
      fetchData(user, db);
    }
    if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading, db, toast]);
  
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

  const handleModalSuccess = () => {
    setIsAddModalOpen(false);
    setIsImportModalOpen(false);
    if(user && db) fetchData(user, db); // CORREÇÃO: Passar o `db` aqui também
  };

  if (authLoading || !user || !db) {
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
        setIsImportModalOpen={setIsImportModalOpen} // Error fix: Added the missing prop
        handleExport={handleExport}
        handleModalSuccess={handleModalSuccess}
      />
    </div>
  );
}
