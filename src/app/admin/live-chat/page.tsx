'use client';

import { Chat } from "@/components/chat";
import { useAuth } from "@/hooks/use-auth";

export default function AdminLiveChatPage() {
  const { user } = useAuth();
  
  if (!user) {
    return <div>Carregando...</div>; // Ou um esqueleto de UI
  }

  return (
    <div className="h-full w-full">
      <Chat user={user} />
    </div>
  );
}
