'use client';

import { useParams } from 'next/navigation';
import { PublicChatView } from '@/components/chat/PublicChatView';

// A página agora é um container simples
export default function ChatPage() {
  // 1. Pega o ID do admin da URL, como antes
  const { adminUid: adminUidParam } = useParams();
  const adminUid = Array.isArray(adminUidParam) ? adminUidParam[0] : adminUidParam;

  // 2. Renderiza o componente reutilizável, passando o ID para ele
  return <PublicChatView adminUid={adminUid} />;
}
