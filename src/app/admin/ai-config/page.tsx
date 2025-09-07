"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { getAiConfig, saveAiConfig } from "@/services/configService";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

// ID do usuário logado (deve vir da autenticação no futuro)
const ADMIN_ID = "admin-vendas";

export default function AiConfigPage() {
  const [instructions, setInstructions] = useState("");
  const [useCustomInfo, setUseCustomInfo] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const config = await getAiConfig(ADMIN_ID);
        setInstructions(config.customInstructions);
        setUseCustomInfo(config.useCustomInformation);
      } catch (error) {
        toast({
          variant: "destructive",
          title: "Erro ao Carregar",
          description: "Não foi possível carregar as configurações de IA.",
        });
      } finally {
        setIsLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await saveAiConfig(ADMIN_ID, {
        customInstructions: instructions,
        useCustomInformation: useCustomInfo,
      });
      toast({
        title: "Sucesso!",
        description: "Suas configurações de IA foram salvas.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as alterações.",
      });
    } finally {
      setIsSaving(false);
    }
  };

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
            Estas configurações se aplicam apenas aos chats iniciados através do seu link de atendimento exclusivo: `/chat/${ADMIN_ID}`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isLoading ? (
             <div className="flex items-center justify-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <>
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="use-custom-info" className="font-semibold">
                    Usar Informações Personalizadas do Usuário
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permita que a IA use informações personalizadas para produzir melhores conversas de suporte.
                  </p>
                </div>
                <Switch 
                  id="use-custom-info" 
                  checked={useCustomInfo}
                  onCheckedChange={setUseCustomInfo}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom-instructions" className="font-semibold">
                  Suas Instruções Personalizadas
                </Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="ex: Seja sempre amigável e use emojis. Priorize problemas relacionados à cobrança."
                  className="min-h-[120px]"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Forneça diretrizes ou contexto específicos para o seu assistente de IA. Isso será incluído em cada prompt para seus clientes.
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={isLoading || isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
