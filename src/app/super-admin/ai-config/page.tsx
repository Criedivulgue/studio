'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { getAiConfig, saveAiConfig } from '@/services/configService';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth'; // 1. Importar useAuth
import { Loader2, ShieldAlert } from 'lucide-react'; // 2. Importar ShieldAlert
import { Heading } from '@/components/ui/heading';

export default function SuperAdminAiConfigPage() {
  const SUPER_ADMIN_ID = 'super-admin';
  const { user, loading: authLoading, isSuperAdmin } = useAuth(); // 3. Usar o hook completo
  const [instructions, setInstructions] = useState('');
  const [useCustomInfo, setUseCustomInfo] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // 4. Carregar a config somente se a auth estiver concluída E for superadmin
    if (!authLoading && isSuperAdmin) {
      async function loadConfig() {
        setDataLoading(true);
        try {
          const config = await getAiConfig(SUPER_ADMIN_ID);
          if (config) {
            setInstructions(config.customInstructions);
            setUseCustomInfo(config.useCustomInformation);
          }
        } catch (error) {
          toast({
            variant: 'destructive',
            title: 'Erro ao Carregar',
            description: 'Não foi possível carregar as configurações globais de IA.',
          });
        } finally {
          setDataLoading(false);
        }
      }
      loadConfig();
    } else if (!authLoading) {
      // Se não for superadmin, apenas para de carregar os dados
      setDataLoading(false);
    }
  }, [authLoading, isSuperAdmin, toast]); // 5. Adicionar dependências

  const handleSaveChanges = async () => {
    if (!isSuperAdmin) { // Segurança extra
      toast({ variant: 'destructive', title: 'Acesso Negado' });
      return;
    }
    setIsSaving(true);
    try {
      await saveAiConfig(SUPER_ADMIN_ID, {
        customInstructions: instructions,
        useCustomInformation: useCustomInfo,
      });
      toast({
        title: 'Sucesso!',
        description: 'As configurações globais da IA foram salvas.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar as alterações.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // 6. Loader enquanto a autenticação é verificada
  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 7. Mensagem de acesso negado se não for superadmin
  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-background rounded-md border">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4" />
        <Heading title="Acesso Negado" description="Você não tem permissão para acessar esta página." />
        <p className="text-muted-foreground mt-2">Esta área é restrita aos super administradores.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h1 className="text-2xl font-headline font-semibold">Configuração da IA Global</h1>
        <p className="text-muted-foreground">
          Personalize o comportamento padrão do assistente de IA para toda a plataforma.
        </p>
      </header>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Configurações Padrão e Pessoais</CardTitle>
          <CardDescription>
            Estas configurações se aplicam a todos os chats que não possuem um administrador específico. Elas também definem o comportamento para seu chat pessoal, acessível em:
            <code className="font-mono text-sm bg-muted p-1 rounded ml-1">{`/chat/${SUPER_ADMIN_ID}`}</code>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dataLoading ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="flex items-center space-x-4 rounded-md border p-4">
                <div className="flex-1 space-y-1">
                  <Label htmlFor="use-custom-info" className="font-semibold">
                    Usar Informações Personalizadas (Global)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Permitir que a IA use informações do perfil do cliente para melhores respostas.
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
                  Instruções Personalizadas (Global)
                </Label>
                <Textarea
                  id="custom-instructions"
                  placeholder="Ex: Você é a IA da OmniFlow. Seja prestativo e cordial..."
                  className="min-h-[120px]"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Forneça as diretrizes e o contexto que a IA usará como base para todos os administradores.
                </p>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={handleSaveChanges} disabled={dataLoading || isSaving || !isSuperAdmin}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
