'use client';

import { useState, useEffect } from 'react';
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
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface Tag {
  id: string;
  name: string;
}

interface AdminUser {
  uid: string;
  name: string;
}

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
  isOpen: boolean;
  onClose: () => void;
  isSuperAdmin?: boolean;
}

export function AddContactModal({ adminUid, onSuccess, isOpen, onClose, isSuperAdmin = false }: AddContactModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [phone, setPhone] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [groups, setGroups] = useState<Tag[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(undefined);
  const [isLoadingGroups, setIsLoadingGroups] = useState(false);

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [selectedAdminId, setSelectedAdminId] = useState<string | undefined>(undefined);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  const { toast } = useToast();

  const ownerIdForQuery = isSuperAdmin ? selectedAdminId : adminUid;

  useEffect(() => {
    if (isOpen && isSuperAdmin) {
      setIsLoadingAdmins(true);
      const adminsQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
      getDocs(adminsQuery)
        .then(snapshot => {
          const fetchedAdmins = snapshot.docs.map(doc => ({ uid: doc.id, name: doc.data().name as string }));
          setAdmins(fetchedAdmins);
        })
        .catch(error => {
          console.error("Erro ao buscar admins: ", error);
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os administradores." });
        })
        .finally(() => setIsLoadingAdmins(false));
    }
  }, [isOpen, isSuperAdmin, toast]);

  useEffect(() => {
    if (isOpen && ownerIdForQuery) {
      setIsLoadingGroups(true);
      const groupsQuery = query(collection(db, 'tags'), where('ownerId', '==', ownerIdForQuery), where('type', '==', 'group'));
      getDocs(groupsQuery)
        .then(snapshot => {
          const fetchedGroups = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name as string }));
          setGroups(fetchedGroups);
        })
        .catch(error => {
          console.error("Erro ao buscar grupos: ", error);
          toast({ variant: "destructive", title: "Erro", description: "Não foi possível carregar os grupos." });
        })
        .finally(() => setIsLoadingGroups(false));
    } else {
        setGroups([]);
    }
  }, [isOpen, ownerIdForQuery, toast]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setWhatsapp('');
    setPhone('');
    setInterests([]);
    setSelectedGroupId(undefined);
    if (isSuperAdmin) setSelectedAdminId(undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalOwnerId = isSuperAdmin ? selectedAdminId : adminUid;
    if (!name || !whatsapp) { 
        toast({ variant: "destructive", title: "Campos obrigatórios", description: "Nome e WhatsApp são necessários." }); return; 
    }
    if (isSuperAdmin && !finalOwnerId) {
        toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione um administrador para associar o contato." }); return;
    }
    setIsLoading(true);

    const payload = {
      name,
      email,
      whatsapp,
      phone,
      interesses: interests,
      ownerId: finalOwnerId!,
      groupId: selectedGroupId, 
    };

    try {
      await createContact(payload as any);
      toast({ title: "Sucesso!", description: `Contato "${name}" foi adicionado.` });
      onSuccess();
      resetForm();
    } catch (error) { 
      console.error("Falha ao criar contato:", error);
      toast({ variant: "destructive", title: "Erro", description: "Não foi possível salvar o contato. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { resetForm(); onClose(); } }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-headline">Adicionar Novo Contato</DialogTitle>
          <DialogDescription>Insira os detalhes e associe a um grupo ou administrador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {isSuperAdmin && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="admin" className="text-right">Admin</Label>
                <Select value={selectedAdminId} onValueChange={setSelectedAdminId} disabled={isLoadingAdmins}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder={isLoadingAdmins ? "Carregando..." : "Selecione um administrador"} />
                  </SelectTrigger>
                  <SelectContent>
                    {admins.map(admin => <SelectItem key={admin.uid} value={admin.uid}>{admin.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">Nome</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" placeholder="Nome do Cliente" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" placeholder="cliente@email.com (Opcional)" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
              <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="col-span-3" placeholder="+55 (XX) XXXXX-XXXX" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">Telefone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="col-span-3" placeholder="(Opcional)" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="group" className="text-right">Grupo</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isLoadingGroups || (isSuperAdmin && !selectedAdminId)}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder={isLoadingGroups ? "Carregando..." : "Selecione um grupo"} />
                </SelectTrigger>
                <SelectContent>
                  {groups.length > 0 ? (
                    groups.map(group => <SelectItem key={group.id} value={group.id}>{group.name}</SelectItem>)
                  ) : (
                    <SelectItem value="disabled" disabled>Nenhum grupo encontrado</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="interests" className="text-right pt-2">Interesses</Label>
              <TagInput value={interests} onChange={setInterests} placeholder='Digite e pressione Enter...' />
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
