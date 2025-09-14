'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { FaWhatsapp } from 'react-icons/fa';
import { Check } from 'lucide-react';

export function ShareChatLinkButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [shared, setShared] = useState(false);

  const handleShare = () => {
    if (!user || !user.id) {
      toast({ variant: "destructive", title: "Erro", description: "ID do usuário não encontrado." });
      return;
    }

    const chatUrl = `${window.location.origin}/chat/${user.id}`;
    const message = `Olá! Inicie uma conversa comigo através deste link: ${chatUrl}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;

    // 1. ABRIR O WHATSAPP PRIMEIRO
    // Esta é a ação principal e deve acontecer imediatamente após o clique.
    window.open(whatsappUrl, '_blank');

    // 2. COPIAR O LINK EM SEGUNDO PLANO
    // Esta é uma ação de conveniência.
    navigator.clipboard.writeText(chatUrl).then(() => {
      toast({ title: "Link Copiado!", description: "O WhatsApp está abrindo em uma nova aba." });
      setShared(true);
      setTimeout(() => setShared(false), 2500);
    }).catch(err => {
      // Este erro só afeta a cópia, não a abertura do WhatsApp.
      console.error('Falha ao copiar o link: ', err);
      toast({ variant: "destructive", title: "Falha ao copiar", description: "Não foi possível copiar o link automaticamente." });
    });
  };

  if (!user) return null;

  return (
    <Button onClick={handleShare} variant="outline" size="sm" className="bg-green-500 text-white hover:bg-green-600">
      {shared ? 
        <Check className="mr-2 h-4 w-4" /> : 
        <FaWhatsapp className="mr-2 h-4 w-4" />
      }
      Divulgar no WhatsApp
    </Button>
  );
}
