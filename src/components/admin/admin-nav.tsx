'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessageSquare, Users, History, Bot, Users2 } from 'lucide-react'; // Adicionado Users2

// Links de navegação definidos de forma clara e correta
const navLinks = [
  {
    href: "/admin/chat",
    label: "Chat",
    icon: <MessageSquare className="mr-2 h-4 w-4" />
  },
  {
    href: "/admin/contacts",
    label: "Contatos",
    icon: <Users className="mr-2 h-4 w-4" />
  },
  // --- ADICIONADO LINK DE GRUPOS ---
  {
    href: "/admin/groups",
    label: "Grupos",
    icon: <Users2 className="mr-2 h-4 w-4" />
  },
  {
    href: "/admin/history",
    label: "Histórico",
    icon: <History className="mr-2 h-4 w-4" />
  },
  {
    href: "/admin/ai-config",
    label: "Configurações de IA",
    icon: <Bot className="mr-2 h-4 w-4" />
  }
];

export function AdminNav({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname.startsWith(link.href) ? "text-primary" : "text-muted-foreground"
          )}
        >
          <span className="hidden md:inline">{link.label}</span>
          <span className="md:hidden">{link.icon}</span>
        </Link>
      ))}
    </nav>
  );
}
