'use client';

import { PublicChatView } from "@/components/chat/PublicChatView";
import React from 'react'; // Importar React

// A definição de tipo para os parâmetros pode ser uma Promise agora
type Props = {
  params: Promise<{ adminUid: string }>;
};

// --- O COMPONENTE DA PÁGINA ATUALIZADO ---
export default function ChatPage({ params }: Props) {
  // Correção: Usando React.use() para desempacotar a Promise de parâmetros
  // Esta é a nova abordagem recomendada pelo Next.js
  const { adminUid } = React.use(params);

  return <PublicChatView adminUid={adminUid} />;
}
