'use client'

import { ColumnDef } from "@tanstack/react-table"
import { CellAction } from "./cell-action"

// Adaptado para Interesses
export type InterestColumn = {
  id: string
  name: string
}

export const columns: ColumnDef<InterestColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome do Interesse", // Título da coluna alterado
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
]
