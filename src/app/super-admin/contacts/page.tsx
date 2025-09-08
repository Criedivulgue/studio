'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, collectionGroup, query } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Download, Copy, ShieldAlert } from 'lucide-react';
import { ContactColumn, columns } from './_components/columns';

export default function SuperAdminContactsPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const [contacts, setContacts] = useState<ContactColumn[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && isSuperAdmin) {
      const fetchContactsAndUsers = async () => {
        setDataLoading(true);
        try {
          const usersSnapshot = await getDocs(collection(db, 'users'));
          const userMap = new Map(usersSnapshot.docs.map(doc => [doc.id, doc.data().name]));

          const contactsQuery = query(collectionGroup(db, 'contacts'));
          const contactsSnapshot = await getDocs(contactsQuery);

          const contactsData: ContactColumn[] = contactsSnapshot.docs.map(doc => {
            const contactData = doc.data();
            const userPath = doc.ref.parent.parent;
            const userId = userPath ? userPath.id : 'N/A';
            const userName = userMap.get(userId) || 'Usuário Desconhecido';
            
            return {
              id: doc.id,
              name: contactData.name,
              phone: contactData.phone,
              whatsapp: contactData.whatsapp || 'N/A',
              interesses: contactData.interesses || 'N/A',
              status: contactData.status,
              adminName: userName,
              adminId: userId,
            };
          });

          setContacts(contactsData);
        } catch (error) {
          console.error("Error fetching global contacts: ", error);
          toast({ variant: 'destructive', title: 'Erro ao Buscar Contatos', description: 'Verifique as permissões do Firestore e tente novamente.' });
        } finally {
          setDataLoading(false);
        }
      };

      fetchContactsAndUsers();
    } else if (!authLoading) {
      setDataLoading(false);
    }
  }, [authLoading, isSuperAdmin, toast]);
  
  const handleCopyChatLink = () => {
    const chatLink = `${window.location.origin}/chat/super-admin`;
    navigator.clipboard.writeText(chatLink);
    toast({ title: 'Sucesso', description: 'Link do chat copiado para a área de transferência.' });
  };

  const handleImport = () => alert('Funcionalidade de Importar a ser implementada.');
  const handleExport = () => alert('Funcionalidade de Exportar a ser implementada.');

  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
        <div className="flex flex-col items-center justify-center h-64 bg-background rounded-md border">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
            <Heading title="Acesso Negado" description="Você não tem permissão para acessar esta página." />
            <p className="text-muted-foreground mt-2">Esta área é restrita aos super administradores.</p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
        <div className="flex items-center justify-between">
            <Heading 
                title={`Contatos Globais (${dataLoading ? '...' : contacts.length})`}
                description="Visualize e gerencie todos os contatos da plataforma."
            />
            <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCopyChatLink}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copiar Link do Chat
                </Button>
                <Button variant="outline" onClick={handleImport}>
                    <Upload className="mr-2 h-4 w-4" />
                    Importar
                </Button>
                <Button variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar
                </Button>
            </div>
        </div>
      <Separator />
      {dataLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={contacts}
          searchKey="name"
          placeholder="Filtrar por nome do contato..."
          emptyMessage="Nenhum contato encontrado na plataforma."
        />
      )}
    </div>
  );
}
