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
import type { Contact } from '@/lib/types';
import { AddContactModal } from '@/components/admin/AddContactModal';
import { toast } from '@/hooks/use-toast';

type ContactManagerProps = {
  title: string;
  description: string;
};

export function ContactManager({ title, description }: ContactManagerProps) {
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDummyData = () => {
        setIsLoading(true);
        setContacts([]);
        setIsLoading(false);
    }
    fetchDummyData();
  }, [user?.id]);

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
          {user && <AddContactModal adminUid={user.id} onSuccess={() => {}} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-col justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <CardTitle className='font-headline'>Teste de Cache - Você Vê Isso?</CardTitle>
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
                            <AvatarFallback>{(contact.name || ' ').charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          {contact.name || 'Nome não informado'}
                        </div>
                      </TableCell>
                      <TableCell>{contact.email || 'Email não informado'}</TableCell>
                      <TableCell>{contact.whatsapp || '-'}</TableCell>
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
                    <TableCell colSpan={4} className='h-24 text-center'>
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
