'use client';

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Link as LinkIcon } from "lucide-react";

export function UserNav() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  if (!user) {
    return null;
  }

  const handleShareLink = () => {
    if (!user) return;
    const chatUrl = `${window.location.origin}/chat/${user.id}`;

    // Tenta usar a API moderna (pode falhar em http ou por políticas de segurança)
    navigator.clipboard.writeText(chatUrl).then(() => {
      toast({
        title: "Link do Chat Copiado!",
        description: "O link foi copiado para a sua área de transferência.",
      });
    }).catch(() => {
      // Fallback para o método clássico (mais compatível)
      try {
        const textArea = document.createElement('textarea');
        textArea.value = chatUrl;
        textArea.style.position = 'fixed'; // Impede o scroll da página
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        document.execCommand('copy');

        document.body.removeChild(textArea);

        toast({
          title: "Link do Chat Copiado!",
          description: "O link foi copiado para a sua área de transferência (modo de compatibilidade).",
        });
      } catch (err) {
        console.error('Falha ao copiar o link (ambos os métodos): ', err);
        toast({ 
          variant: 'destructive', 
          title: 'Erro', 
          description: 'Não foi possível copiar o link. Por favor, copie manualmente.' 
        });
      }
    });
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.avatar || undefined} alt={user.name || 'Avatar'} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem onClick={handleShareLink}>
            <LinkIcon className="mr-2 h-4 w-4" />
            <span>Compartilhar Chat</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
