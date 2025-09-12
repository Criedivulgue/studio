'use client';

import { useState, useEffect, useCallback } from 'react';
import { Firestore, collection, query, where, getDocs } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import type { PlatformUser } from '@/lib/types';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, ArrowUpFromLine, ArrowDownToLine } from 'lucide-react';
import { createDataTable } from '@/components/data-table';
import { columns, ContactColumn } from './_components/columns';
import { AddContactModal } from '@/components/admin/AddContactModal';
import { ImportContactsModal } from '@/components/admin/ImportContactsModal';

function exportToCsv(filename: string, rows: object[]) {
    if (!rows || rows.length === 0) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent = 
        keys.join(separator) + '\n' + 
        rows.map(row => {
            return keys.map(k => {
                let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
                cell = cell instanceof Array ? cell.join(' | ') : cell.toString();
                cell = cell.replace(/"/g, '""');
                if (cell.search(/([",\n])/g) >= 0) cell = `"${cell}"`;
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const ContactsDataTable = createDataTable<ContactColumn, any>();

export default function SuperAdminMyContactsPage() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<ContactColumn[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);

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
      const contactsCollection = collection(firestoreDb, 'contacts');
      const contactsQuery = query(contactsCollection, where('ownerId', '==', currentUser.id));

      const tagsCollection = collection(firestoreDb, 'tags');
      const tagsQuery = query(tagsCollection, where('ownerId', '==', currentUser.id));

      const [contactsSnapshot, tagsSnapshot] = await Promise.all([ getDocs(contactsQuery), getDocs(tagsQuery) ]);

      const tagMap = new Map<string, string>();
      tagsSnapshot.forEach(doc => tagMap.set(doc.id, doc.data().name));

      const contactsData: ContactColumn[] = contactsSnapshot.docs.map(doc => {
        const data = doc.data();
        const groupNames = (data.groupIds || []).map((gid: string) => tagMap.get(gid)).filter(Boolean).join(', ') || 'Sem grupo';
        const interestNames = (data.interestIds || []).map((iid: string) => tagMap.get(iid)).filter(Boolean).join(', ') || 'Sem interesses';
          
        return {
          id: doc.id, name: data.name || 'Nome não informado', phone: data.whatsapp || 'N/A', groups: groupNames, interests: interestNames,
          rawData: { id: doc.id, name: data.name, phone: data.whatsapp, groupIds: data.groupIds || [], interestIds: data.interestIds || [] }
        };
      });
      setContacts(contactsData);
    } catch (error) {
      console.error("Error fetching data: ", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar dados', description: 'Verifique as permissões do banco de dados.' });
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
  
  const handleExport = () => {
    if (contacts.length === 0) {
        toast({ variant: "destructive", title: 'Nenhum Contato', description: 'Não há contatos para exportar.' });
        return;
    }
    const dataToExport = contacts.map(c => ({ Nome: c.name, Whatsapp: c.phone, Grupos: c.groups, Interesses: c.interests }));
    exportToCsv('meus-contatos.csv', dataToExport);
    toast({ title: 'Exportação Concluída', description: 'O arquivo CSV com seus contatos foi baixado.' });
  };

  const handleModalSuccess = () => {
    setIsAddModalOpen(false);
    setIsImportModalOpen(false);
    if(user && db) fetchData(user, db);
  };

  if (authLoading || !db) {
      return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
           <Heading title="Meus Contatos" description="Carregando seus contatos..."/>
           <Separator />
        </div>
      )
  }
  
  return (
    <>
      {user && (
          <>
            <AddContactModal 
              isOpen={isAddModalOpen} 
              onClose={() => setIsAddModalOpen(false)} 
              onSuccess={handleModalSuccess}
            />
            <ImportContactsModal 
              adminUid={user.id}
              isOpen={isImportModalOpen}
              onClose={() => setIsImportModalOpen(false)}
              onSuccess={handleModalSuccess}
            />
        </>
      )}

      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <Heading 
            title={`Meus Contatos (${loading ? '...' : contacts.length})`}
            description="Gerencie seus contatos para facilitar o envio de mensagens."
          />
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} disabled={!user}>
                <ArrowUpFromLine className="mr-2 h-4 w-4" /> Importar
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={!user}>
                <ArrowDownToLine className="mr-2 h-4 w-4" /> Exportar
            </Button>
            <Button onClick={() => setIsAddModalOpen(true)} disabled={!user}>
                <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
            </Button>
          </div>
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
