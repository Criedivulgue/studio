'use client';
import ChatClient from './chat-client';
import { useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Componente de Cliente para a página de chat.
 * Usa o hook `useParams` para extrair o `adminUid` da URL no lado do cliente
 * e o passa para o `ChatClient`.
 */
export default function ChatPage() {
  const params = useParams();
  
  // O `useParams` pode retornar string | string[] | undefined.
  // Garantimos que temos uma string única.
  const adminUid = Array.isArray(params.adminUid) ? params.adminUid[0] : params.adminUid;

  // Se, por algum motivo, o adminUid não estiver disponível na URL, 
  // mostramos um estado de carregamento para evitar erros.
  if (!adminUid) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3">Carregando dados do chat...</p>
      </div>
    );
  }

  // Renderiza o componente de cliente, passando a ID do admin.
  return <ChatClient adminUid={adminUid} />;
}
