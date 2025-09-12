'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action'; // Componente para o menu de ações
import type { PlatformUser } from '@/lib/types';

// Re-exporta PlatformUser para ser usado em page.tsx
export type { PlatformUser };

// Define as colunas da tabela usando PlatformUser
export const columns: ColumnDef<PlatformUser>[] = [
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
