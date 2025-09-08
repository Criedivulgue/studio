
'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action'; // Importando o componente reutilizável

// A interface para o contato
export interface ContactColumn {
  id: string;
  name: string;
  phone: string;
  status: 'active' | 'inactive';
}

export const columns: ColumnDef<ContactColumn>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: 'phone',
    header: 'Telefone',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge variant={status === 'active' ? 'default' : 'outline'}>
          {status === 'active' ? 'Ativo' : 'Inativo'}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    // Usando o componente CellAction para renderizar o menu de ações
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
