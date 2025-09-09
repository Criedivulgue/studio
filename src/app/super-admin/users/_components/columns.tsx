'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action'; // Componente para o menu de ações

// Define a estrutura de dados para o Usuário
export type User = {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'superadmin';
  // Adicione outros campos que possam vir do seu documento de usuário
};

// Define as colunas da tabela
export const columns: ColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Função',
    cell: ({ row }) => {
      const role = row.original.role;
      return <Badge variant={role === 'superadmin' ? 'default' : 'secondary'}>{role}</Badge>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
    header: 'Ações'
  },
];
