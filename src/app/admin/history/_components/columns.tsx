'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { CellAction } from './cell-action';

// Define a estrutura de dados para uma entrada do histórico
export interface HistoryEntry {
  id: string;
  contactName: string;
  lastMessage: string;
  lastMessageTimestamp: string; // ISO string
}

export const columns: ColumnDef<HistoryEntry>[] = [
  {
    accessorKey: 'contactName',
    header: 'Contato',
  },
  {
    accessorKey: 'lastMessage',
    header: 'Última Mensagem',
    cell: ({ row }) => {
        const message = row.original.lastMessage;
        // Trunca a mensagem para não quebrar o layout da tabela
        return <p className="truncate max-w-xs">{message}</p>;
    }
  },
  {
    accessorKey: 'lastMessageTimestamp',
    header: 'Data',
    cell: ({ row }) => {
      const isoString = row.original.lastMessageTimestamp;
      // Formata a data para um formato legível
      const formattedDate = format(new Date(isoString), 'dd/MM/yyyy HH:mm');
      return <span>{formattedDate}</span>;
    },
  },
  {
    id: 'actions',
    // Renderiza o menu de ações para cada linha
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
