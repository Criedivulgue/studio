'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { createContact } from '@/services/contactService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// O componente TagInput permanece o mesmo
const TagInput: React.FC<any> = ({ value, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) { onChange([...value, inputValue.trim()]); }
      setInputValue('');
    }
  };
  const removeTag = (tagToRemove: string) => { onChange(value.filter((tag: string) => tag !== tagToRemove)); };
  return (
    <div className="col-span-3"><div className="flex flex-wrap items-center gap-1 rounded-md border border-input p-1">{value.map((tag: string) => (<div key={tag} className="flex items-center gap-1 rounded-sm bg-secondary px-2 py-0.5 text-sm">{tag}<button onClick={() => removeTag(tag)} className="ml-1 font-bold text-destructive text-xs hover:text-destructive/80">x</button></div>))}<input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={placeholder} className="flex-1 bg-transparent p-1 text-sm outline-none placeholder:text-muted-foreground"/></div></div>
  );
};

interface AddContactModalProps {
  adminUid: string;
  onSuccess: () => void;
}

export function AddContactModal({ adminUid, onSuccess }: AddContactModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState(''); // ADICIONADO: Campo para telefone
  const [status, setStatus] = useState<'active' | 'inactive'>('active'); // ADICIONADO: Campo para status
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setName('');
    setEmail('');
    setWhatsapp('');
    setPhone(''); // ADICIONADO: Reset do telefone
    setStatus('active'); // ADICIONADO: Reset do status
    setInterests([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !whatsapp) {
      toast({ variant: "destructive", title: "Campos obrigatórios", description: "Nome, email e WhatsApp são necessários." });
      return;
    }
    setIsLoading(true);
    try {
      // ATUALIZADO: Enviando o objeto de contato completo
      await createContact({ 
        name, 
        email, 
        whatsapp, 
        phone, // Adicionado
        status, // Adicionado
        interesses: interests, // Renomeado para consistência
        ownerId: adminUid, 
      });
      toast({ title: "Sucesso!", description: `Contato "${name}" foi adicionado.` });
      onSuccess();
      setOpen(false);
      resetForm();
    } catch (error) {
      console.error("Falha ao criar contato:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o contato. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
      <DialogTrigger asChild>
        <Button>Adicionar Contato</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Adicionar Novo Contato</DialogTitle>
          <DialogDescription>Insira os detalhes do contato que você deseja adicionar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Campos existentes: Nome, Email, WhatsApp */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Nome do Cliente" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="cliente@email.com" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
              <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="col-span-3" placeholder="+55 (XX) XXXXX-XXXX" />
            </div>
            
            {/* ADICIONADO: Campo de Telefone */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="(Opcional)" />
            </div>

            {/* ATUALIZADO: Campo de Status */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">Status</Label>
              <Select value={status} onValueChange={(value: 'active' | 'inactive') => setStatus(value)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Campo de Interesses (sem alteração funcional) */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="interests" className="text-right pt-2">Interesses</Label>
              <TagInput
                value={interests}
                onChange={setInterests}
                placeholder='Digite e pressione Enter...'
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isLoading} className='w-full'>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Contato
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
