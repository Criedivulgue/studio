'use client';

import { Chat } from "@/components/chat";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from 'lucide-react';

export default function AdminLiveChatPage() {
  const { user, loading } = useAuth();
  
  // Espera explicitamente o fim do carregamento da autenticação.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Se, após o carregamento, não houver usuário, informa o usuário.
  if (!user) {
    return <div>Usuário não encontrado. Por favor, faça login novamente.</div>;
  }

  // Só renderiza o Chat quando tivermos certeza de que o usuário está completo.
  return (
    <div className="h-full w-full">
      <Chat user={user} />
    </div>
  );
}
