'use client';

import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";

// 1. Definir a estrutura de dados para uma linha da tabela de grupos.
export type GroupColumn = {
  id: string;
  name: string;
  contactCount: number; // Número de contatos no grupo
};

// 2. Definir as colunas para o DataTable.
export const columns: ColumnDef<GroupColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome do Grupo",
  },
  {
    accessorKey: "contactCount",
    header: "Nº de Contatos",
    // Exibe o número de contatos.
    cell: ({ row }) => <div>{row.original.contactCount}</div>,
  },
  {
    id: "actions",
    // Renderiza o componente de ações (menu suspenso) para cada linha.
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
