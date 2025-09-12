'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action'; 
import type { PlatformUser } from '@/lib/types';

export type { PlatformUser };

// Função para criar as colunas, agora aceita um callback para recarregar os dados
export const createColumns = (refreshUsers: () => void): ColumnDef<PlatformUser>[] => [
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
      // Mostra o papel do usuário com um estilo visual diferente para superadmin
      return <Badge variant={role === 'superadmin' ? 'default' : 'secondary'}>{role}</Badge>
    },
  },
  {
    id: 'actions',
    // Passa o callback para o componente de ações para poder recarregar a lista
    cell: ({ row }) => <CellAction data={row.original} />,
    header: 'Ações'
  },
];
