'use client';

import { useEffect } from 'react';
import Link from "next/link";
import { useRouter } from 'next/navigation';
import {
  Menu,
  User,
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
import { CopyChatLinkButton } from '@/components/admin/CopyChatLinkButton';
import { Logo } from '@/components/logo'; // Importando o Logo

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  useFirebaseMessaging();
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'superadmin') {
      toast({ 
        variant: "destructive", 
        title: "Acesso Negado", 
        description: "Você não tem permissão para acessar esta área." 
      });
      router.push('/login');
    }
  }, [loading, user, router, toast]);

  const handleLogout = async () => {
    try {
      await logout();
      toast({ title: "Logout realizado com sucesso!" });
      window.location.href = "/login";
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao fazer logout" });
    }
  };

  if (loading || !user || user.role !== 'superadmin') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            {/* CORREÇÃO: Link e Logo para Desktop */}
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
                          <User className="mr-2 h-4 w-4" />
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
                 {/* CORREÇÃO: Link e Logo para Mobile */}
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Logo />
                  <span className="">WhatsAi</span>
                </Link>
                <SidebarNav navItems={superAdminNavItems} />
              </nav>
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1"></div>
          <CopyChatLinkButton />
          <NotificationBell />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
