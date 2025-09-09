'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { createContact } from '@/services/contactService';
import type { Contact } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface LeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void; // <-- ADICIONADO: Permite que o componente pai controle o estado.
  adminUid: string;
  onSuccess: (contact: Contact) => void;
}

export function LeadCaptureModal({ open, onOpenChange, adminUid, onSuccess }: LeadCaptureModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha pelo menos o nome e o e-mail.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const newContactData = {
        ownerId: adminUid,
        name,
        email,
        whatsapp,
        phone: '',
        status: 'active' as const,
        interesses: [],
      };
      
      const contactId = await createContact(newContactData);

      const finalContact: Contact = {
        id: contactId,
        ...newContactData,
        createdAt: new Date(),
      };

      toast({ title: 'Sucesso!', description: 'Seus dados foram salvos. Conectando ao chat...' });
      onSuccess(finalContact);
      
    } catch (error) {
      console.error("Falha ao criar contato: ", error);
      toast({
        variant: 'destructive',
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar seus dados. Tente novamente.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // O `onOpenChange` é passado aqui. O Dialog agora notificará o pai quando deve ser fechado.
    // A propriedade `onInteractOutside` foi removida para permitir o fechamento ao clicar fora.
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className='font-headline'>Identifique-se para Atendimento</DialogTitle>
            <DialogDescription>
              Para falar com um de nossos atendentes, por favor, informe seus dados.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="name"
              placeholder="Seu nome completo *"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
            />
            <Input
              id="email"
              type="email"
              placeholder="Seu melhor e-mail *"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
            <Input
              id="whatsapp"
              placeholder="Seu WhatsApp (opcional)"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="submit" className='w-full' disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Falar com Atendente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
