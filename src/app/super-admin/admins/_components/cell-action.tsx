
'use client';

import { MoreHorizontal, Link as LinkIcon, Edit, Trash, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { PlatformUser } from '@/lib/types';

interface CellActionProps {
  data: PlatformUser;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const { toast } = useToast();

  // FUNCIONALIDADE RESTAURADA
  const onCopyLink = () => {
    const chatLink = `${window.location.origin}/chat/${data.id}`;
    navigator.clipboard.writeText(chatLink);
    toast({ title: 'Link Copiado!', description: 'O link de chat do usuário foi copiado para a área de transferência.' });
  };

  const toggleStatus = async () => {
    const newStatus = data.status === 'active' ? 'inactive' : 'active';
    try {
      const userRef = doc(db, 'users', data.id);
      await updateDoc(userRef, { status: newStatus });
      toast({ title: 'Sucesso', description: `Status do usuário atualizado para ${newStatus}.` });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar o status do usuário.' });
    }
  };

  const onDelete = async () => {
    if(confirm(`Tem certeza que deseja excluir o usuário ${data.name}? Esta ação é permanente.`)){
        try {
            await deleteDoc(doc(db, 'users', data.id));
            toast({ title: 'Sucesso', description: 'Usuário excluído permanentemente.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir o usuário.' });
        }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        {/* FUNCIONALIDADE RESTAURADA */}
        <DropdownMenuItem onClick={onCopyLink}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Copiar Link do Chat
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => toast({title: 'Em breve', description: 'A funcionalidade de edição será implementada no futuro.'})}>
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={toggleStatus}>
          {data.status === 'active' ? 
            <><UserX className="mr-2 h-4 w-4" />Desativar</> : 
            <><UserCheck className="mr-2 h-4 w-4" />Ativar</>
          }
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-600 focus:bg-red-50">
          <Trash className="mr-2 h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
