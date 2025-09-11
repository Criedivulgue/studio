'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

// 1. Definição do tipo para um item de navegação
export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// 2. Props do componente agora esperam um array de NavItems
interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  navItems: NavItem[];
}

export function SidebarNav({ className, navItems, ...props }: SidebarNavProps) {
  const pathname = usePathname();

  // 3. Verifica se a lista de itens foi fornecida. Se não, não renderiza nada.
  if (!navItems || navItems.length === 0) {
    return null;
  }

  return (
    <nav
      className={cn(
        "grid items-start gap-1 px-2 text-sm font-medium lg:px-4",
        className
      )}
      {...props}
    >
      {/* 4. Mapeia a lista recebida via props */}
      {navItems.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              // Lógica de ativação melhorada para corresponder a sub-rotas
              pathname.startsWith(link.href) && "bg-muted text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
