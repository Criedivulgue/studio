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
  onOpenChange: (open: boolean) => void;
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
    if (!name || !email || !whatsapp) { // GARANTIDO: WhatsApp agora é obrigatório
      toast({
        variant: 'destructive',
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha nome, e-mail e WhatsApp.', // GARANTIDO: Mensagem de erro atualizada
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
        phone: '', // O tipo Contact espera um campo `phone`, então mantemos como string vazia por enquanto
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
              placeholder="Seu WhatsApp *" // GARANTIDO: Placeholder atualizado
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
