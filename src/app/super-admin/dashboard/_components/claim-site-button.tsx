'use client';

import { useState, useEffect } from 'react';
// CORREÇÃO: Importar Firestore e funções de inicialização
import { Firestore, doc, setDoc, getDoc } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Loader2, CheckCircle } from 'lucide-react';

type Status = 'loading' | 'claimed' | 'unclaimed';

export function ClaimSiteButton() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>('loading');
  const [isUpdating, setIsUpdating] = useState(false);
  // CORREÇÃO: Estado para a instância do DB
  const [db, setDb] = useState<Firestore | null>(null);

  // CORREÇÃO: Inicializa o Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Firebase init error:", error);
        toast({ title: 'Erro de Inicialização', description: 'Não foi possível conectar ao banco de dados.', variant: 'destructive'});
      }
    };
    initFirebase();
  }, [toast]);

  useEffect(() => {
    // CORREÇÃO: Aguarda o DB e o usuário estarem prontos
    if (!user || !db) return;

    const checkClaimStatus = async () => {
      try {
        const configDocRef = doc(db, 'public_config', 'global');
        const docSnap = await getDoc(configDocRef);

        if (docSnap.exists() && docSnap.data().superAdminId === user.id) {
          setStatus('claimed');
        } else {
          setStatus('unclaimed');
        }
      } catch (error) {
        console.error("Erro ao verificar status de reivindicação:", error);
        setStatus('unclaimed');
      }
    };

    checkClaimStatus();
  }, [user, db]); // CORREÇÃO: Adicionada dependência do DB

  const handleClaimSite = async () => {
    if (!user || user.role !== 'superadmin') {
      toast({ title: 'Erro de Permissão', description: 'Apenas o Super Administrador pode executar esta ação.', variant: 'destructive' });
      return;
    }

    if (!user.id) {
        toast({ title: 'Erro Crítico', description: 'O ID do usuário não foi encontrado.', variant: 'destructive' });
        return;
    }

    // CORREÇÃO: Verifica se o DB está pronto
    if (!db) {
        toast({ title: 'Erro', description: 'O banco de dados não está pronto.', variant: 'destructive' });
        return;
    }

    setIsUpdating(true);
    try {
      const configRef = doc(db, 'public_config', 'global');
      await setDoc(configRef, { superAdminId: user.id }); 
      setStatus('claimed');
      toast({
        title: 'Site Reivindicado com Sucesso!',
        description: 'O chat principal do site agora está vinculado ao seu perfil.',
      });
    } catch (error) {
      console.error("Erro ao reivindicar o site:", error);
      toast({ title: 'Erro', description: 'Não foi possível concluir a operação.', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  // CORREÇÃO: o status de loading agora depende da inicialização do DB também
  if (status === 'loading' || !db) {
    return (
      <Card>
        <CardHeader>
            <CardTitle>Configuração do Chat Principal</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-24">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (status === 'claimed') {
    return (
      <Card className="bg-green-500/10 border-green-500/30">
        <CardHeader>
          <CardTitle className="flex items-center"><CheckCircle className="mr-2 text-green-500" /> Chat Principal Ativado</CardTitle>
          <CardDescription>
            O chat da página inicial do site já está configurado e vinculado corretamente ao seu perfil de Super Administrador.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle>Ativar Chat Principal do Site</CardTitle>
        <CardDescription>
          Clique no botão abaixo para vincular o chat da página inicial ao seu perfil. Esta ação é necessária para habilitar o atendimento principal do site.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClaimSite} disabled={isUpdating}>
          {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Globe className="mr-2 h-4 w-4" />}
          Reivindicar Chat Principal
        </Button>
      </CardContent>
    </Card>
  );
}
