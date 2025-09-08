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
import { ContactColumn } from './columns';

interface CellActionProps {
  data: ContactColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const { toast } = useToast();

  // Placeholder para edição
  const onEdit = () => {
    // Lógica para abrir modal/página de edição
    alert(`Editar contato: ${data.name}`);
  };
  
  // Abrir cliente de email
  const onSendEmail = () => {
    // Supondo que o contato tenha um email, que não está na interface atual.
    // Se não tiver, o campo 'para' ficará em branco.
    window.open(`mailto:`);
  };

  // Abrir link do WhatsApp
  const onOpenWhatsApp = () => {
    if (data.whatsapp && data.whatsapp !== 'N/A') {
      // Remove caracteres não numéricos
      const phoneNumber = data.whatsapp.replace(/\D/g, '');
      window.open(`https://wa.me/${phoneNumber}`, '_blank');
    } else {
      toast({ variant: 'destructive', title: 'Erro', description: 'Número de WhatsApp não disponível.' });
    }
  };

  // Criar evento no Google Calendar
  const onAddToCalendar = () => {
    const googleCalendarUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=Reunião com ${data.name}`;
    window.open(googleCalendarUrl, '_blank');
  };

  // Excluir o contato
  const onDelete = async () => {
    if (!data.adminId || data.adminId === 'N/A') {
        toast({ variant: 'destructive', title: 'Erro', description: 'ID do administrador não encontrado.' });
        return;
    }
    try {
      const contactRef = doc(db, `users/${data.adminId}/contacts`, data.id);
      await deleteDoc(contactRef);
      toast({ title: 'Sucesso', description: 'Contato excluído.' });
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
