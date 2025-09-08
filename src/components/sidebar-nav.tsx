
'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@/lib/utils"
import { MessageSquare, Users, BookUser, Bot } from 'lucide-react';

const links = [
  {
    href: "/super-admin/live-chat",
    label: "Chat ao Vivo",
    icon: MessageSquare
  },
  {
    href: "/super-admin/admins",
    label: "Usuários (Admins)",
    icon: Users
  },
  {
    href: "/super-admin/contacts",
    label: "Contatos Globais",
    icon: BookUser
  },
  {
    href: "/super-admin/history",
    label: "Histórico",
    icon: Users
  },
  {
    href: "/super-admin/ai-settings",
    label: "Configurações da IA",
    icon: Bot
  }
];

export function SidebarNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()

  return (
    <nav
      className={cn(
        "grid items-start gap-1",
        className
      )}
      {...props}
    >
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
              pathname === link.href && "bg-muted text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  )
}
