'use client';

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";

// CORREÇÃO: Adicionado adminId e renomeado phone para whatsapp
export type SuperAdminContactColumn = {
  id: string;
  adminId: string; // Necessário para a ação de exclusão
  name: string;
  whatsapp: string; // Renomeado de 'phone' para consistência
  groups: string;
  interests: string;
  adminName: string;
};

export const columns: ColumnDef<SuperAdminContactColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    // CORREÇÃO: Atualizado para 'whatsapp'
    accessorKey: "whatsapp",
    header: "WhatsApp",
  },
  {
    accessorKey: "adminName",
    header: "Admin Proprietário",
  },
  {
    accessorKey: "groups",
    header: "Grupos",
    cell: ({ row }) => {
      const groups = row.original.groups;
      if (!groups) return <div className="text-center">-</div>;
      return (
        <div className="flex flex-wrap gap-1">
          {groups.split(', ').map(group => (
            <Badge key={group} variant="secondary">{group}</Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "interests",
    header: "Interesses",
    cell: ({ row }) => {
      const interests = row.original.interests;
      if (!interests) return <div className="text-center">-</div>;
      return (
        <div className="flex flex-wrap gap-1">
          {interests.split(', ').map(interest => (
            <Badge key={interest} variant="outline">{interest}</Badge>
          ))}
        </div>
      );
    },
  },
  {
    id: "actions",
    // CORREÇÃO: Passando os dados para o componente de ação da célula
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
