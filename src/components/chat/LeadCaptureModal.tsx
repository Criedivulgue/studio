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
  adminUid: string;
  onSuccess: (contact: Contact) => void;
}

export function LeadCaptureModal({ open, adminUid, onSuccess }: LeadCaptureModalProps) {
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
      // CORREÇÃO: Criando o objeto de acordo com o Modelo Canônico
      const newContactData = {
        ownerId: adminUid,
        name,
        email,
        whatsapp,
        phone: '', // Adicionado: Telefone é opcional e não coletado aqui
        status: 'active' as const, // Adicionado: Status padrão para novos leads
        interesses: [], // Adicionado: Interesses começa vazio
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
    <Dialog open={open}>
      <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className='font-headline'>Identifique-se</DialogTitle>
            <DialogDescription>
              Para uma melhor experiência, por favor, preencha seus dados abaixo para iniciar a conversa.
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
              Iniciar Conversa
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
