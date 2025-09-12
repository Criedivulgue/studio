'use client';

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

// Definição da estrutura de dados para a coluna de interesses
export type InterestColumn = {
  id: string;
  name: string;
};

// Função factory para criar as colunas de interesses
export const createColumns = (refetch: () => void): ColumnDef<InterestColumn>[] => [
  {
    accessorKey: "name",
    header: "Nome do Interesse",
  },
  {
    id: "actions",
    // Passa a função de refetch para o componente de ação
    cell: ({ row }) => <CellAction data={row.original} refetch={refetch} />,
  },
];
