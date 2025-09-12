import ChatClient from './chat-client';

// Este é o "Posto de Vigilância" (Server Component).
// Sua única função é extrair os parâmetros e passar para o cliente.
export default function ChatPage({ params }: { params: { adminUid: string } }) {
  const { adminUid } = params;

  // Renderiza o componente de cliente puro, passando a adminUid como uma prop simples.
  return <ChatClient adminUid={adminUid} />;
}
