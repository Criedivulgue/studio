'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action'; 

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  whatsapp: string; // Adicionando a propriedade whatsapp
  status: 'active' | 'inactive';
  role: string;
}

export const columns: ColumnDef<AdminUser>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
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
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
