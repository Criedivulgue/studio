'use client';

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Badge } from "@/components/ui/badge";

// A definição do tipo permanece a mesma
export type ContactColumn = {
  id: string;
  name: string;
  phone: string;
  groups: string;      
  interests: string;  
  rawData: { 
    id: string;
    name: string;
    phone: string;
    groupIds?: string[];
    interestIds?: string[];
  };
};

export const columns: ColumnDef<ContactColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome",
  },
  {
    accessorKey: "phone",
    header: "WhatsApp",
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
    // Passando o objeto original completo, que corresponde ao tipo ContactColumn
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
