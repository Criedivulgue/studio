'use client';

import { ColumnDef } from '@tanstack/react-table';
import { format } from 'date-fns';
import { CellAction } from './cell-action';

// ETAPA 3: ATUALIZAR A ESTRUTURA DE DADOS E COLUNAS
// A estrutura de dados agora reflete uma conversa arquivada.
export interface HistoryEntry {
  id: string;
  contactName: string;
  summary: string; // O resumo gerado pela IA
  archivedAt: string; // ISO string da data de arquivamento
  adminName?: string; // Opcional, para a visão do Super Admin
}

export const columns: ColumnDef<HistoryEntry>[] = [
  {
    accessorKey: 'contactName',
    header: 'Contato',
  },
  {
    // Nova coluna para o resumo.
    accessorKey: 'summary',
    header: 'Resumo da IA',
    cell: ({ row }) => {
        const summary = row.original.summary;
        // Trunca o resumo para manter a tabela limpa, mas o resumo completo pode ser visto em um modal/detalhe.
        return <p className="truncate max-w-md">{summary}</p>;
    }
  },
  {
    // A coluna de data agora se refere à data de arquivamento.
    accessorKey: 'archivedAt',
    header: 'Data do Arquivamento',
    cell: ({ row }) => {
      const isoString = row.original.archivedAt;
      if (!isoString) return "N/A";
      const formattedDate = format(new Date(isoString), 'dd/MM/yyyy HH:mm');
      return <span>{formattedDate}</span>;
    },
  },
  // A coluna 'adminName' pode ser adicionada dinamicamente na página do Super Admin.
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
