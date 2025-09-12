'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
// CORREÇÃO: Remover import antigo do DB e adicionar os novos
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'group' | 'interest';
  initialData?: { id: string; name: string } | null;
}

export function GroupModal({ isOpen, onClose, onSuccess, type, initialData = null }: GroupModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isEditing = initialData !== null;
  const title = isEditing ? `Editar ${type === 'group' ? 'Grupo' : 'Interesse'}` : `Adicionar Novo ${type === 'group' ? 'Grupo' : 'Interesse'}`;
  const description = isEditing ? `Edite o nome abaixo.` : `Preencha o nome para criar um novo ${type}.`;
  const toastMessage = isEditing ? `${type === 'group' ? 'Grupo' : 'Interesse'} atualizado.` : `${type === 'group' ? 'Grupo' : 'Interesse'} criado.`;

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
    } else {
      setName('');
    }
  }, [initialData, isOpen]);

  const handleSuccess = () => {
    onSuccess();
    setName('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ variant: "destructive", title: "Não autenticado" });
      return;
    }
    if (!name.trim()) {
      toast({ variant: "destructive", title: "O nome é obrigatório" });
      return;
    }

    setLoading(true);
    try {
      // CORREÇÃO: Inicializar o Firebase e obter a instância do DB
      await ensureFirebaseInitialized();
      const { db } = getFirebaseInstances();

      if (isEditing) {
        const docRef = doc(db, 'tags', initialData!.id);
        await updateDoc(docRef, { name: name.trim() });
      } else {
        await addDoc(collection(db, 'tags'), {
          ownerId: user.id,
          name: name.trim(),
          type: type,
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: toastMessage });
      handleSuccess();

    } catch (err) {
      console.error("Erro ao salvar: ", err);
      toast({ variant: "destructive", title: "Erro ao salvar" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Nome</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="col-span-3" 
              placeholder={`Nome do ${type}`}
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
