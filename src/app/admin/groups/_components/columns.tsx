'use client';

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

// Definição da estrutura de dados para a coluna de grupos
export type GroupColumn = {
  id: string;
  name: string;
  contactCount: number; // Número de contatos no grupo
};

// Função factory para criar as colunas
export const createColumns = (refetch: () => void): ColumnDef<GroupColumn>[] => [
  {
    accessorKey: "name",
    header: "Nome do Grupo",
  },
  {
    accessorKey: "contactCount",
    header: "Nº de Contatos",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} refetch={refetch} />,
  },
];
