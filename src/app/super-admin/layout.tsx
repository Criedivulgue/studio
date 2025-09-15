'use client';

import Link from "next/link";
import { useRouter } from 'next/navigation';
import {
  Menu,
  User as UserIcon,
  LogOut,
  Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationBell } from "@/components/notification-bell";
import { SidebarNav } from "@/components/sidebar-nav";
import { superAdminNavItems } from "@/config/nav-links";
import { useFirebaseMessaging } from '@/hooks/useFirebaseMessaging';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { logout } from '@/services/authService';
import { ShareChatLinkButton } from '@/components/admin/ShareChatLinkButton';
import { Logo } from '@/components/logo';

// Este componente de layout é o "guardião" de toda a área do Super Admin.
export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  console.log('--- SUPER ADMIN LAYOUT RENDERED --- Este log DEVE aparecer.');
  useFirebaseMessaging();
  const { toast } = useToast();
  // A chamada ao useAuth() obtém o estado de autenticação atual.
  const { user, loading } = useAuth();

  // CORREÇÃO: O bloco useEffect que fazia o redirecionamento foi removido.
  // A lógica de proteção de rota foi centralizada no bloco de retorno condicional abaixo,
  // que é mais seguro pois é executado ANTES da primeira renderização.

  // Esta é agora a ÚNICA fonte de verdade para a proteção da rota.
  // Se estiver carregando, ou não houver usuário, ou o usuário não for superadmin,
  // ele exibe uma tela de carregamento e impede a renderização do resto da página.
  // Isso resolve o loop ao garantir que nenhuma decisão de redirecionamento seja tomada
  // antes que o estado de autenticação esteja 100% resolvido.
  if (loading || !user || user.role !== 'superadmin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logout realizado com sucesso!" });
      // Redirecionamento seguro após o logout.
      window.location.href = "/login";
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao fazer logout" });
    }
  };

  // Se a verificação acima passar, o layout real é renderizado com segurança.
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Logo />
              <span className="">WhatsAi</span>
            </Link>
          </div>
          <div className="flex-1 overflow-y-auto">
            <SidebarNav navItems={superAdminNavItems} />
          </div>
          <div className="mt-auto p-4 border-t">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-3 cursor-pointer hover:bg-accent p-2 rounded-lg">
                      <Avatar className='h-9 w-9'>
                          <AvatarImage src={user.avatar} alt={user.name ?? 'Avatar'} />
                          <AvatarFallback>{user.name?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-foreground truncate">{user.name ?? 'Carregando...'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user.email ?? ''}</p>
                      </div>
                  </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2" side="top" align="start">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/super-admin/profile" passHref>
                      <DropdownMenuItem>
                          <UserIcon className="mr-2 h-4 w-4" />
                          <span>Editar Perfil</span>
                      </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sair</span>
                  </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <nav className="grid gap-2 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Logo />
                  <span className="">WhatsAi</span>
                </Link>
                <SidebarNav navItems={superAdminNavItems} />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1"></div>
          <ShareChatLinkButton />
          <NotificationBell />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
