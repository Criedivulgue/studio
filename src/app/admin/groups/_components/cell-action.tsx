
'use client';

import { MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { GroupColumn } from './columns';

interface CellActionProps {
  data: GroupColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const onDelete = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Você precisa estar logado.' });
      return;
    }
    try {
      const groupRef = doc(db, `users/${user.uid}/groups`, data.id);
      await deleteDoc(groupRef);
      toast({ title: 'Sucesso', description: 'Grupo excluído permanentemente.' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir o grupo.' });
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
        <DropdownMenuItem onClick={() => { /* TODO: Implementar edição/visualização do grupo */ }}>
          Gerenciar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-600">
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
