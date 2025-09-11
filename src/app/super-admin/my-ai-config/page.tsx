'use client';

import { useEffect, useState } from 'react';
import { useAuth } from "@/hooks/use-auth";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { updateUserSettings } from '@/services/userService';

export default function SuperAdminMyAiConfigPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  const [prompt, setPrompt] = useState('');
  const [useCustomInfo, setUseCustomInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setPrompt(user.aiPrompt || 'Seja um assistente prestativo.');
      setUseCustomInfo(user.useCustomInfo ?? true);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const handleSave = async () => {
    if (!user) {
        toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
        return;
    }
    setIsLoading(true);
    try {
      await updateUserSettings(user.id, { 
        aiPrompt: prompt,
        useCustomInfo: useCustomInfo 
      });
      toast({ title: "Salvo com sucesso!", description: "Suas configurações de IA foram atualizadas." });
    } catch (error) {
      console.error("Erro ao salvar configurações de IA:", error);
      toast({ title: "Erro ao Salvar", description: "Não foi possível salvar suas alterações.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-8 pt-6">
      <div>
        <Heading title="Minha Configuração de IA" description="Personalize o comportamento do seu assistente de IA pessoal." />
        <p className="text-sm text-muted-foreground pt-2">
          Estas instruções são apenas para o seu usuário (Super Admin) e não afetarão outros administradores.
        </p>
        <Separator className="mt-4" />
      </div>
      <div className="space-y-8">
        
        <div className="flex items-center space-x-4 rounded-md border p-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="use-custom-info" className="font-semibold">
              Usar Informações do Cliente
            </Label>
            <p className="text-sm text-muted-foreground">
              Permitir que a IA acesse o nome, tags e histórico do cliente para fornecer respostas mais personalizadas e relevantes.
            </p>
          </div>
          <Switch
            id="use-custom-info"
            checked={useCustomInfo}
            onCheckedChange={setUseCustomInfo}
            aria-readonly={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-prompt">Meu Prompt Personalizado</Label>
          <p className="text-sm text-muted-foreground">
            Adicione aqui suas instruções específicas. Elas complementarão as diretrizes globais da plataforma para dar uma personalidade única ao seu assistente.
          </p>
          <Textarea
            id="ai-prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ex: Você é o assistente pessoal do Super Admin. Use um tom formal e sempre verifique os logs do sistema..."
            className="min-h-[200px]"
            disabled={isLoading}
          />
        </div>
        
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
