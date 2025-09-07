"use client"

import { usePathname } from "next/navigation";
import Link from "next/link";
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
import { LayoutDashboard, Users, Send, Bot, Settings, LifeBuoy, LogOut } from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/contacts", icon: Users, label: "Contacts" },
  { href: "/admin/broadcast", icon: Send, label: "Broadcasts" },
  { href: "/admin/ai-config", icon: Bot, label: "AI Config" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
             <Logo />
             <span className="font-headline text-lg font-semibold text-sidebar-foreground">OmniFlow AI</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} legacyBehavior passHref>
                  <SidebarMenuButton
                    isActive={pathname.startsWith(item.href)}
                    tooltip={item.label}
                  >
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
            <h4 className="font-semibold text-sidebar-accent-foreground text-sm">Need Help?</h4>
            <p className="text-xs text-sidebar-foreground">Check out our documentation or contact support.</p>
            <Button size="sm" variant="outline" className="w-full mt-2 bg-transparent border-sidebar-foreground/50 text-sidebar-foreground hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground">Support</Button>
          </div>
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src="https://picsum.photos/seed/admin/40/40" data-ai-hint="profile picture" />
              <AvatarFallback>SA</AvatarFallback>
            </Avatar>
            <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-sidebar-foreground truncate">Super Admin</p>
                <p className="text-xs text-sidebar-foreground/70 truncate">admin@omniflow.ai</p>
            </div>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex-shrink-0">
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
        <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
