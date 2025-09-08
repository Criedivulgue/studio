'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Copy } from 'lucide-react';

interface ChatLinkSharerProps {
  adminUid: string;
}

export function ChatLinkSharer({ adminUid }: ChatLinkSharerProps) {
  const { toast } = useToast();
  const [chatUrl, setChatUrl] = useState('');

  useEffect(() => {
    // Garante que o window.location só seja acessado no lado do cliente
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/chat/${adminUid}`;
      setChatUrl(url);
    }
  }, [adminUid]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(chatUrl).then(() => {
      toast({ title: 'Sucesso!', description: 'O link do seu chat foi copiado para a área de transferência.' });
    }).catch(err => {
      console.error('Falha ao copiar o link: ', err);
      toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível copiar o link.' });
    });
  };

  if (!adminUid) return null;

  return (
    <Card className="bg-muted/40 border-dashed">
      <CardHeader>
        <CardTitle className="font-headline text-lg">Seu Link de Chat Pessoal</CardTitle>
        <CardDescription>
          Compartilhe este link com seus clientes para que eles possam iniciar uma conversa diretamente com seu assistente de IA.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-2">
          <Input value={chatUrl} readOnly className="flex-1 bg-background" />
          <Button size="icon" onClick={copyToClipboard} aria-label="Copiar link do chat">
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
