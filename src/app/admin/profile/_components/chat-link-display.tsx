'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getAuth } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from 'lucide-react';

export function ChatLinkDisplay() {
  const [chatUrl, setChatUrl] = useState('');
  const { toast } = useToast();
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const url = `${window.location.origin}/chat/${user.uid}`;
      setChatUrl(url);
    }
  }, [user]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chatUrl).then(() => {
      toast({ title: 'Copiado!', description: 'O link do seu chat foi copiado para a área de transferência.' });
    }).catch(err => {
      console.error('Falha ao copiar: ', err);
      toast({ title: 'Erro', description: 'Não foi possível copiar o link.', variant: 'destructive' });
    });
  };

  if (!chatUrl) {
    return null; // Não renderiza nada se a URL ainda não foi gerada
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Link do seu Chat Público</CardTitle>
        <CardDescription>Compartilhe este link com seus clientes para que eles possam iniciar uma conversa com você.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Input value={chatUrl} readOnly />
          <Button variant="outline" size="icon" onClick={copyToClipboard}>
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
