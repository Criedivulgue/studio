'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
// CORREÇÃO: Imports do Firebase ajustados
import { Functions, httpsCallable } from 'firebase/functions';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import type { ChatSession } from '@/lib/types';

interface LeadIdentificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  adminId: string;
}

// CORREÇÃO: A função será criada dinamicamente

export function LeadIdentificationModal({ isOpen, onClose, session, adminId }: LeadIdentificationModalProps) {
  // CORREÇÃO: Estado para a instância do Firebase Functions
  const [functions, setFunctions] = useState<Functions | null>(null);
  const [name, setName] = useState(session.visitorName || '');
  const [email, setEmail] = useState(session.visitorEmail || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  // CORREÇÃO: Efeito para inicializar o Firebase
  useEffect(() => {
    if (isOpen) { // Só inicializa se o modal estiver aberto
      const initFirebase = async () => {
        try {
          await ensureFirebaseInitialized();
          const { functions: firebaseFunctions } = getFirebaseInstances();
          setFunctions(firebaseFunctions);
        } catch (error) {
          console.error("Firebase init error in LeadIdentificationModal:", error);
          toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'A funcionalidade não está disponível. Tente novamente.' });
          onClose(); // Fecha o modal se o firebase falhar
        }
      };
      initFirebase();
    }
  }, [isOpen, onClose, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({ title: 'Erro de Validação', description: 'Por favor, forneça nome e email para o contato.', variant: 'destructive' });
      return;
    }
    // CORREÇÃO: Verifica se o functions está pronto
    if (!functions) {
        toast({ title: 'Aguarde', description: 'Inicializando... Por favor, tente novamente em alguns segundos.', variant: 'default' });
        return;
    }

    setIsProcessing(true);
    try {
      const identifyLeadFunction = httpsCallable(functions, 'identifyLead');
      await identifyLeadFunction({
        sessionId: session.id,
        adminId: adminId,
        contactData: {
          name: name,
          email: email,
        },
      });

      toast({ title: 'Sucesso', description: `Contato ${name} foi criado e a conversa foi migrada.` });
      onClose();

    } catch (error: any) {
      console.error("Error identifying lead:", error);
      toast({ title: 'Erro', description: error.message || 'Não foi possível identificar o lead. Tente novamente.', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setName(session.visitorName || '');
      setEmail(session.visitorEmail || '');
      setIsProcessing(false); // Reseta o estado de processamento
    }
  }, [session, isOpen]);

  const canSubmit = name && email && !isProcessing && functions;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Identificar Lead</DialogTitle>
          <DialogDescription>
            Crie um novo contato a partir deste chat anônimo. O histórico do chat será salvo permanentemente e associado a este novo contato.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required disabled={isProcessing} />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required disabled={isProcessing} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
            <Button type="submit" disabled={!canSubmit}>
              {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!functions ? 'Carregando...' : 'Criar Contato'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
