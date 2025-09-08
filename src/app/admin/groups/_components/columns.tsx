
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export interface GroupColumn {
  id: string;
  name: string;
  memberCount: number;
}

export const columns: ColumnDef<GroupColumn>[] = [
  {
    accessorKey: 'name',
    header: 'Nome do Grupo',
  },
  {
    accessorKey: 'memberCount',
    header: 'Nº de Membros',
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
