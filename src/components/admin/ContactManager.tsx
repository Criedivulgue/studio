'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Search, Upload, Download, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import { useAuth } from '@/hooks/use-auth';
import { getContactsByOwner, getAllContacts } from '@/services/contactService';
import type { Contact } from '@/lib/types';
import { AddContactModal } from '@/components/admin/AddContactModal';
import { toast } from '@/hooks/use-toast';
import { ChatLinkSharer } from '@/components/admin/ChatLinkSharer';

type ContactManagerProps = {
  scope: 'user' | 'all';
  title: string;
  description: string;
};

export function ContactManager({ scope, title, description }: ContactManagerProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const adminUid = user?.id || '';

  // A função de busca de contatos foi movida para ser definida uma vez, com useCallback para estabilidade
  useEffect(() => {
    const fetchContacts = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const fetcher = scope === 'all' ? getAllContacts : () => getContactsByOwner(user.id);
        const fetchedContacts = await fetcher();
        setContacts(fetchedContacts.sort((a, b) => (a.name || '').localeCompare(b.name || '')));
      } catch (error) {
        console.error('Failed to fetch contacts:', error);
        toast({ variant: 'destructive', title: 'Erro ao carregar contatos', description: 'Não foi possível buscar os contatos. Tente recarregar a página.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchContacts();
  }, [user?.id, scope, toast]);

  // CORREÇÃO: Filtro robusto que não quebra se nome ou email forem nulos/undefined.
  const filteredContacts = contacts.filter(
    (contact) =>
      (contact.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='space-y-6'>
      <div className='flex items-start justify-between'>
        <header className='space-y-1.5'>
          <h1 className='text-2xl font-headline font-semibold'>{title}</h1>
          <p className='text-muted-foreground'>{description}</p>
        </header>
        <div className='flex items-center gap-2'>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          {user && scope === 'user' && <AddContactModal adminUid={user.id} onSuccess={() => {}} />}
        </div>
      </div>
      
      {adminUid && scope === 'user' && <ChatLinkSharer adminUid={adminUid} />}

      <Card>
        <CardHeader>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <CardTitle className='font-headline'>Sua Lista de Contatos</CardTitle>
              <CardDescription>{filteredContacts.length} contatos encontrados.</CardDescription>
            </div>
            <div className='relative'>
              <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
              <Input
                placeholder='Buscar por nome ou email...'
                className='pl-8 sm:w-[300px]'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex h-60 items-center justify-center'>
              <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>WhatsApp</TableHead>
                  <TableHead>Grupo</TableHead>
                  {scope === 'all' && <TableHead>Proprietário</TableHead>}
                  <TableHead className='text-center'>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length > 0 ? (
                  filteredContacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell className='font-medium'>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage src={`https://avatar.vercel.sh/${contact.email}.png`} />
                            {/* CORREÇÃO: Fallback robusto para o nome */}
                            <AvatarFallback>{(contact.name || ' ').charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {contact.name || 'Nome não informado'}
                        </div>
                      </TableCell>
                      <TableCell>{contact.email || 'Email não informado'}</TableCell>
                      <TableCell>{contact.whatsapp || '-'}</TableCell>
                      <TableCell>
                        <Badge variant='secondary'>{contact.group || '-'}</Badge>
                      </TableCell>
                      {scope === 'all' && (
                        <TableCell>
                          {/* CORREÇÃO: Renderização robusta que não quebra se ownerId for nulo/undefined */}
                           <Badge variant="outline">{contact.ownerId ? `${contact.ownerId.substring(0, 5)}...` : 'N/D'}</Badge>
                        </TableCell>
                      )}
                      <TableCell className='text-center'>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' className='h-8 w-8 p-0'>
                              <span className='sr-only'>Abrir menu</span>
                              <MoreHorizontal className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem>Editar</DropdownMenuItem>
                            <DropdownMenuItem>Ver Detalhes</DropdownMenuItem>
                            <DropdownMenuItem className='text-destructive'>Excluir</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={scope === 'all' ? 6 : 5} className='h-24 text-center'>
                      Nenhum contato encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
