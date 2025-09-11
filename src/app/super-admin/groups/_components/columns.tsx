'use client'

import { ColumnDef } from "@tanstack/react-table"

// Definição da estrutura de dados para as colunas
export type SuperAdminGroupColumn = {
  id: string
  name: string
  memberCount: number
  adminName: string // Nome do administrador dono do grupo
}

// Definição das colunas da tabela
export const columns: ColumnDef<SuperAdminGroupColumn>[] = [
  {
    accessorKey: "name",
    header: "Nome do Grupo",
  },
  {
    accessorKey: "adminName",
    header: "Administrador",
  },
  {
    accessorKey: "memberCount",
    header: "Nº de Membros",
  },
]
