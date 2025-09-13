import ChatClient from '@/app/chat/[adminUid]/chat-client';

// Este é o "Posto de Vigilância" (Server Component).
// Sua única função é extrair os parâmetros da URL no lado do servidor e passar para o componente cliente.
// Esta abordagem é a mais limpa e a correta arquiteturalmente.
// A única alteração necessária é usar um caminho absoluto na importação para contornar um bug do sistema de build.
export default function ChatPage({ params }: { params: { adminUid: string } }) {
  const { adminUid } = params;

  // Renderiza o componente de cliente puro, passando a adminUid como uma prop simples.
  // O ChatClient já tem o "'use client'" e cuidará de toda a lógica do lado do cliente.
  return <ChatClient adminUid={adminUid} />;
}
