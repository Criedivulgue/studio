'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from "@/hooks/use-toast";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { GroupColumn } from './columns';

interface GroupFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: GroupColumn | null;
}

export function GroupFormModal({ isOpen, onClose, onSuccess, initialData }: GroupFormModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!initialData;

  useEffect(() => {
    if (isEditing && initialData) {
      setName(initialData.name);
    } else {
      setName('');
    }
  }, [initialData, isEditing]);

  const title = isEditing ? "Editar Grupo" : "Criar Novo Grupo";
  const description = isEditing ? "Altere o nome do seu grupo." : "Dê um nome ao seu novo grupo de contatos.";
  const buttonText = isEditing ? "Salvar Alterações" : "Criar Grupo";
  const toastMessage = isEditing ? "Grupo atualizado com sucesso." : "Grupo criado com sucesso.";

  const handleSubmit = async () => {
    if (!user) {
      setError("Você precisa estar autenticado.");
      return;
    }
    if (!name.trim()) {
      setError("O nome do grupo não pode estar vazio.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing && initialData) {
        // CORREÇÃO: Substituindo user.uid por user.id
        const groupRef = doc(db, `users/${user.id}/groups`, initialData.id);
        await updateDoc(groupRef, {
          name: name.trim(),
          updatedAt: serverTimestamp(),
        });
      } else {
        // CORREÇÃO: Substituindo user.uid por user.id
        const newGroupRef = doc(collection(db, `users/${user.id}/groups`));
        await setDoc(newGroupRef, {
          id: newGroupRef.id,
          name: name.trim(),
          createdAt: serverTimestamp(),
          contacts: [],
        });
      }

      toast({ title: "Sucesso!", description: toastMessage });
      onSuccess();

    } catch (err) {
      console.error("Erro ao salvar grupo: ", err);
      const errorMessage = isEditing ? "atualizar" : "criar";
      setError(`Ocorreu um erro ao ${errorMessage} o grupo. Tente novamente.`);
      toast({ 
        title: "Erro",
        description: `Não foi possível ${errorMessage} o grupo.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name-form" className="text-right">Nome</Label>
            <Input 
              id="name-form" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="col-span-3" 
              placeholder="Ex: Clientes VIP"
            />
          </div>
        </div>

        {error && (<p className="text-sm text-red-500 pl-4">{error}</p>)} 

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && (<Loader2 className="mr-2 h-4 w-4 animate-spin" />)}
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
