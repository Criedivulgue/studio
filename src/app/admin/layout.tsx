'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { useFirebaseMessaging } from "@/hooks/useFirebaseMessaging";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { LayoutDashboard, Users, Bot, Settings, LogOut, MessageSquare, Contact, History, Group, Loader2 } from "lucide-react";
import { logout } from "@/services/authService";
import { useToast } from "@/hooks/use-toast";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Painel" },
  { href: "/admin/live-chat", icon: MessageSquare, label: "Chat ao Vivo" },
  { href: "/admin/contacts", icon: Contact, label: "Meus Contatos" },
  { href: "/admin/groups", icon: Group, label: "Grupos" },
  { href: "/admin/history", icon: History, label: "Histórico" },
  { href: "/admin/ai-config", icon: Bot, label: "Config IA" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  useFirebaseMessaging();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (!loading && user && user.role !== 'admin') {
      toast({ variant: "destructive", title: "Acesso Negado" });
      router.push('/login');
    }
  }, [loading, user, router, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logout realizado com sucesso!" });
      router.push("/login");
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao fazer logout" });
    }
  };

  // LÓGICA DE RENDERIZAÇÃO CORRIGIDA E FINAL:
  // Passo 1: Mostrar o loader APENAS enquanto a autenticação estiver em andamento.
  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Passo 2: Se o carregamento terminou e NÃO HÁ usuário, não renderize nada.
  // O useEffect acima já disparou o redirecionamento para /login.
  // Isso impede que o layout quebre tentando acessar `user.name` e evita o loader infinito.
  if (!user) {
    return null;
  }
  
  // Se chegamos aqui, `loading` é false e `user` existe.
  // Podemos renderizar o layout com segurança.

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link href="/" className="flex items-center gap-3">
             <Logo />
             <span className="font-headline text-lg font-semibold text-sidebar-foreground">OmniFlow AI</span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href}>
                  <SidebarMenuButton isActive={pathname.startsWith(item.href)} tooltip={item.label}>
                    <item.icon />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4 flex flex-col gap-4">
           <div className="flex flex-col gap-2 p-3 rounded-lg bg-sidebar-accent">
            <h4 className="font-semibold text-sidebar-accent-foreground text-sm">Precisa de Ajuda?</h4>
            <p className="text-xs text-sidebar-foreground">Confira nossa documentação ou entre em contato com o suporte.</p>
            <Button size="sm" variant="outline" className="w-full mt-2 bg-transparent border-sidebar-foreground/50 text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">Suporte</Button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.avatar} />
              <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">{user.email}</p>
            </div>
            <Button onClick={handleLogout} variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-shrink-0">
                <LogOut className="w-4 h-4"/>
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="flex items-center justify-between border-b p-4 h-16">
          <SidebarTrigger />
          <div className="flex items-center gap-4">
             <Button variant="outline" size="icon">
                <Settings className="h-4 w-4" />
             </Button>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 bg-muted/30">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
