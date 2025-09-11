'use client';

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Definição de tipo para as entradas do histórico, alinhada com o histórico do admin normal.
export interface HistoryEntry {
  id: string;
  contactName: string;
  summary: string;
  archivedAt: string;
}

export const columns: ColumnDef<HistoryEntry>[] = [
  {
    accessorKey: "contactName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Contato
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    accessorKey: "summary",
    header: "Resumo da IA",
    cell: ({ row }) => {
        return <div className="line-clamp-2 text-sm text-muted-foreground">{row.original.summary}</div>
    }
  },
  {
    accessorKey: "archivedAt",
    header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Arquivado em
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        );
    },
    cell: ({ row }) => {
        const date = new Date(row.original.archivedAt);
        return <div>{date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const entry = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(entry.id)}>
              Copiar ID da Conversa
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
              Ver Detalhes (em breve)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
