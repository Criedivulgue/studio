
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';

import { Button } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Plus, Loader2 } from 'lucide-react';
import { DataTable } from '@/components/data-table'; // Reutilizando o componente de tabela
import { columns } from './_components/columns'; // Colunas específicas para contatos

// Definindo a interface para um contato
interface Contact {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
}

export default function AdminContactsPage() {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, `users/${user.uid}/contacts`));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsData: Contact[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<Contact, 'id'>),
      }));
      setContacts(contactsData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching contacts: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <Heading 
          title={`Contatos (${contacts.length})`}
          description="Gerencie a sua lista de contatos/clientes."
        />
        <Button onClick={() => { /* TODO: Implementar modal de adição */ }}>
          <Plus className="mr-2 h-4 w-4" /> Adicionar Contato
        </Button>
      </div>
      <Separator />
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={contacts}
          searchKey="name"
          placeholder="Filtrar por nome..."
          emptyMessage="Nenhum contato encontrado."
        />
      )}
    </div>
  );
}
