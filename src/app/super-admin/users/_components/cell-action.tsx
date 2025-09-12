'use client';

import { useState } from 'react';
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
import { PlatformUser } from './columns';

interface CellActionProps {
  data: PlatformUser;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const { toast } = useToast();

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: 'ID do Usuário copiado para a área de transferência.' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir Menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => onCopy(data.id)}>
          Copiar ID
        </DropdownMenuItem>
        {/* Adicione outras ações como Editar ou Excluir aqui */}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
