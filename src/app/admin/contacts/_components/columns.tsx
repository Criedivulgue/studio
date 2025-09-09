'use client';

import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { CellAction } from './cell-action'; 
import { Contact } from '@/lib/types'; // Importa o tipo canônico

// CORREÇÃO: A interface agora é um "pick" do tipo Contact canônico, garantindo 100% de compatibilidade.
// Isso remove a necessidade de manter uma interface local separada e evita erros de tipo.
export type ContactColumn = Pick<Contact, 'id' | 'name' | 'email' | 'whatsapp' | 'status'>;

export const columns: ColumnDef<ContactColumn>[] = [
  {
    accessorKey: 'name',
    header: 'Nome',
    cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
  },
  {
    accessorKey: 'email',
    header: 'E-mail',
  },
  {
    accessorKey: 'whatsapp',
    header: 'WhatsApp',
    cell: ({ row }) => row.original.whatsapp || 'N/A', // Exibe N/A se o whatsapp não existir
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status;
      let variant: "default" | "outline" | "secondary" = 'secondary';
      if (status === 'active') variant = 'default';
      if (status === 'inactive') variant = 'outline';

      return (
        <Badge variant={variant}>
          {status.charAt(0).toUpperCase() + status.slice(1)} 
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
