'use client';

import { MoreHorizontal, Edit, Mail, MessageSquare, CalendarPlus, Trash2 } from 'lucide-react';
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
import { doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
// CORREÇÃO: Importando o tipo correto que é de fato exportado.
import { SuperAdminContactColumn } from './columns';

interface CellActionProps {
  // CORREÇÃO: Usando o tipo importado corretamente.
  data: SuperAdminContactColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const { toast } = useToast();

  const onEdit = () => {
    alert(`Funcionalidade de edição a ser implementada para: ${data.name}`);
  };
  
  const onSendEmail = () => {
    // A lógica atual não tem acesso ao email, precisa ser adicionado ao tipo se necessário.
    window.open(`mailto:`);
  };

  const onOpenWhatsApp = () => {
    // CORREÇÃO: A propriedade foi renomeada para 'whatsapp' no tipo.
    if (data.whatsapp && data.whatsapp !== 'N/A') {
      const phoneNumber = data.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'Número de WhatsApp não disponível.' });
    }
  };

  const onAddToCalendar = () => {
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Reunião com ${data.name}`;
    window.open(googleCalendarUrl, '_blank');
  };

  const onDelete = async () => {
    // CORREÇÃO: A propriedade adminId foi adicionada ao tipo e agora está disponível.
    if (!data.adminId) {
        toast({ variant: 'destructive', title: 'Erro', description: 'ID do administrador não encontrado para este contato.' });
        return;
    }
    try {
      // A referência ao documento agora usa o adminId para encontrar o contato na subcoleção correta.
      const contactRef = doc(db, `users/${data.adminId}/contacts`, data.id);
      await deleteDoc(contactRef);
      toast({ title: 'Sucesso', description: 'Contato excluído.' });
      // Idealmente, você também acionaria uma atualização da tabela aqui.
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir o contato.' });
      console.error('Error deleting contact:', error);
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
        <DropdownMenuItem onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Editar Contato
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onSendEmail}>
          <Mail className="mr-2 h-4 w-4" />
          Enviar Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onOpenWhatsApp}>
          <MessageSquare className="mr-2 h-4 w-4" />
          Abrir WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onAddToCalendar}>
          <CalendarPlus className="mr-2 h-4 w-4" />
          Agendar Reunião
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onDelete} className="text-red-500 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Excluir Contato
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
