'use client';

import { ColumnDef } from '@tanstack/react-table';

// Este tipo representa os dados para uma linha na tabela de histórico de conversas.
export type ConversationHistory = {
  id: string;
  contactName: string;
  adminName: string; // Nome do admin responsável
  lastMessage: string;
  lastMessageTimestamp: Date;
};

export const columns: ColumnDef<ConversationHistory>[] = [
  {
    accessorKey: 'contactName',
    header: 'Cliente',
  },
  {
    accessorKey: 'adminName',
    header: 'Admin',
  },
  {
    accessorKey: 'lastMessage',
    header: 'Última Mensagem',
  },
  {
    accessorKey: 'lastMessageTimestamp',
    header: 'Data',
    cell: ({ row }) => {
      const date = new Date(row.getValue('lastMessageTimestamp'));
      return date.toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },
  },
  // Você pode adicionar uma célula de ações aqui se necessário
];
