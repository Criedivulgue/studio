'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collectionGroup, query, getDocs, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { DataTable } from '@/components/data-table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, Download, Copy, ShieldAlert } from 'lucide-react';
import { ContactColumn, columns } from './_components/columns';

// Componente da Página de Contatos do Super Admin
export default function SuperAdminContactsPage() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const [contacts, setContacts] = useState<ContactColumn[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // A busca só é acionada quando a autenticação termina e o usuário é um superadmin.
    if (!authLoading && isSuperAdmin) {
      const fetchAllContacts = async () => {
        setDataLoading(true);
        try {
          // 1. USA A CONSULTA `collectionGroup` CORRETA para buscar todos os contatos da plataforma.
          const contactsQuery = query(collectionGroup(db, 'contacts'));
          const querySnapshot = await getDocs(contactsQuery);

          // 2. Otimização: Cria um cache para armazenar os nomes dos admins já buscados.
          const usersCache = new Map<string, string>();

          // 3. Processa os contatos para enriquecê-los com os nomes dos admins.
          const allContacts: ContactColumn[] = await Promise.all(
            querySnapshot.docs.map(async (contactDoc) => {
              const contactData = contactDoc.data();
              const adminId = contactData.ownerId; // O `ownerId` do contato.
              let adminName = 'Admin não encontrado';

              // Busca o nome do admin, usando o cache para evitar buscas repetidas.
              if (adminId) {
                if (usersCache.has(adminId)) {
                  adminName = usersCache.get(adminId)!;
                } else {
                  const userDocRef = doc(db, 'users', adminId);
                  const userDocSnap = await getDoc(userDocRef);
                  if (userDocSnap.exists()) {
                    adminName = userDocSnap.data().name || 'Admin sem nome';
                    usersCache.set(adminId, adminName);
                  }
                }
              }

              // Retorna o objeto formatado para a tabela.
              return {
                id: contactDoc.id,
                name: contactData.name || 'Nome não informado',
                email: contactData.email || 'Email não informado',
                phone: contactData.phone || 'N/A',
                whatsapp: contactData.whatsapp || 'N/A',
                interesses: contactData.interesses || [],
                status: contactData.status || 'active',
                adminName: adminName,
                adminId: adminId,
              };
            })
          );

          setContacts(allContacts);

        } catch (error) {
          console.error("Erro ao buscar contatos com collectionGroup: ", error);
          toast({
            variant: "destructive",
            title: "Erro ao Carregar Contatos",
            description: "A consulta falhou. Verifique as regras de segurança do Firestore e o console.",
          });
        } finally {
          setDataLoading(false);
        }
      };

      fetchAllContacts();
    } else if (!authLoading) {
      // Se não for superadmin, para o loading.
      setDataLoading(false);
    }
  }, [authLoading, isSuperAdmin, toast]);

  // Demais funções e renderização do componente (sem alterações)

  const handleCopyChatLink = () => {
    if (!user) return;
    const chatUrl = `${window.location.origin}/chat/${user.id}`;
    navigator.clipboard.writeText(chatUrl).then(() => {
      toast({ title: "Link do Chat Copiado!", description: "O link foi copiado para a sua área de transferência." });
    }).catch(() => {
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível copiar o link.' });
    });
  };

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
          searchKey="email"
          placeholder="Filtrar por email do contato..."
          emptyMessage="Nenhum contato encontrado na plataforma."
        />
      )}
    </div>
  );
}
