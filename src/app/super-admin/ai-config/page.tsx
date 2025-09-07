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
        <h1 className="text-2xl font-headline font-semibold">Configuração da IA Global</h1>
        <p className="text-muted-foreground">
          Personalize o comportamento e o estilo de resposta da IA padrão.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Configurações da IA Padrão</CardTitle>
          <CardDescription>
            Essas configurações se aplicam a todos os chats que não possuem um administrador específico.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="custom-instructions" className="font-semibold">
              Instruções Globais
            </Label>
            <Textarea
              id="custom-instructions"
              placeholder="ex: Você é o assistente geral da OmniFlow AI. Seja prestativo e informativo."
              className="min-h-[120px]"
            />
            <p className="text-sm text-muted-foreground">
              Forneça diretrizes ou contexto para a IA padrão do sistema.
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
