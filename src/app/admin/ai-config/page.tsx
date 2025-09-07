"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export default function AiConfigPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-headline font-semibold">Configuração da IA</h1>
        <p className="text-muted-foreground">
          Personalize o comportamento e o estilo de resposta do seu assistente de IA.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Configurações do Seu Assistente</CardTitle>
          <CardDescription>
            Estas configurações se aplicam apenas aos chats iniciados através do seu link de atendimento exclusivo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4 rounded-md border p-4">
            <div className="flex-1 space-y-1">
              <Label htmlFor="use-custom-info" className="font-semibold">
                Usar Informações Personalizadas do Usuário
              </Label>
              <p className="text-sm text-muted-foreground">
                Permita que a IA use informações personalizadas para produzir melhores conversas de suporte.
              </p>
            </div>
            <Switch id="use-custom-info" defaultChecked />
          </div>
          <div className="space-y-2">
            <Label htmlFor="custom-instructions" className="font-semibold">
              Suas Instruções Personalizadas
            </Label>
            <Textarea
              id="custom-instructions"
              placeholder="ex: Seja sempre amigável e use emojis. Priorize problemas relacionados à cobrança."
              className="min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              Forneça diretrizes ou contexto específicos para o seu assistente de IA. Isso será incluído em cada prompt para seus clientes.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button>Salvar Alterações</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
