'use client';

import { MoreHorizontal, FileText, Download, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { HistoryEntry } from './columns';

// Props para o componente de ação
interface CellActionProps {
  data: HistoryEntry;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const { toast } = useToast();

  const handleAction = (actionName: string) => {
    // Ações futuras serão implementadas aqui
    toast({
      title: 'Funcionalidade em Breve',
      description: `A ação de ${actionName} para a conversa com ${data.contactName} será implementada no futuro.`,
    });
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
        <DropdownMenuItem onClick={() => handleAction('Ver Chat')}>
          <FileText className="mr-2 h-4 w-4" />
          Ver Chat Completo
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleAction('Exportar')}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Histórico
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="text-red-300">
            <Trash className="mr-2 h-4 w-4" />
            Excluir (Desativado)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
