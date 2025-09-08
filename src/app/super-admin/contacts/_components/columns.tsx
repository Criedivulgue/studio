'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action';

// 1. Interface atualizada para incluir EMAIL
export interface ContactColumn {
  id: string;
  name: string;
  email: string; // Adicionado
  phone: string;
  whatsapp: string;
  interesses: string;
  status: 'active' | 'inactive';
  adminName: string;
  adminId: string;
}

// 2. Definição de colunas atualizada e reordenada
export const columns: ColumnDef<ContactColumn>[] = [
  {
    accessorKey: 'name',
    header: 'Nome do Contato',
  },
  {
    accessorKey: 'email', // Adicionado
    header: 'Email',
  },
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
  },
  {
    accessorKey: 'phone', // Adicionado
    header: 'Telefone',
  },
  {
    accessorKey: 'interesses',
    header: 'Interesses',
  },
  {
    accessorKey: 'adminName',
    header: 'Admin Proprietário',
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
    header: 'Ações',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
