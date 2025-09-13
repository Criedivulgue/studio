'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';

export function CopyChatLinkButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!user || !user.id) {
      toast({ variant: "destructive", title: "Erro", description: "ID do usuário não encontrado." });
      return;
    }

    const chatUrl = `${window.location.origin}/?adminId=${user.id}`;
    navigator.clipboard.writeText(chatUrl).then(() => {
      toast({ title: "Link Copiado!", description: "Divulgue para iniciar novas conversas." });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset  icon after 2 seconds
    }, (err) => {
      console.error('Could not copy text: ', err);
      toast({ variant: "destructive", title: "Falha ao copiar", description: "Não foi possível copiar o link." });
    });
  };

  if (!user) return null; // Don't render if no user

  return (
    <Button onClick={handleCopy} variant="outline" size="sm">
      {copied ? 
        <Check className="mr-2 h-4 w-4 text-green-500" /> : 
        <Share2 className="mr-2 h-4 w-4" />
      }
      Divulgar Chat
    </Button>
  );
}
