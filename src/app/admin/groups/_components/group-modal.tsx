'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
// CORREÇÃO: Remover import direto do db e adicionar os novos
import { collection, addDoc, doc, updateDoc, serverTimestamp, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  type: 'group' | 'interest';
  initialData?: { id: string; name: string, ownerId?: string } | null;
  ownerId?: string; // Obrigatório para criar um novo
}

export function GroupModal({ isOpen, onClose, onSuccess, type, initialData = null, ownerId }: GroupModalProps) {
  // CORREÇÃO: remover o useAuth, pois o ownerId agora é explícito
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  // CORREÇÃO: Adicionar estado para o DB
  const [db, setDb] = useState<Firestore | null>(null);

  const isEditing = initialData !== null;
  const title = isEditing ? `Editar ${type === 'group' ? 'Grupo' : 'Interesse'}` : `Adicionar Novo ${type === 'group' ? 'Grupo' : 'Interesse'}`;
  const description = isEditing ? `Edite o nome abaixo.` : `Preencha o nome para criar um novo ${type}.`;
  const toastMessage = isEditing ? `${type === 'group' ? 'Grupo' : 'Interesse'} atualizado.` : `${type === 'group' ? 'Grupo' : 'Interesse'} criado.`;

  // CORREÇÃO: Efeito para inicializar o Firebase
  useEffect(() => {
    if (!isOpen) return;
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Firebase init error:", error);
        toast({ variant: "destructive", title: "Erro de Inicialização" });
        onClose();
      }
    };
    initFirebase();
  }, [isOpen, toast, onClose]);


  useEffect(() => {
    if (isOpen) {
        if (initialData) {
            setName(initialData.name);
        } else {
            setName('');
        }
    }
  }, [initialData, isOpen]);
  
  // Função de reset e fechamento
  const handleClose = () => {
    setName('');
    onClose();
  }

  const handleSubmit = async () => {
    const currentOwnerId = initialData?.ownerId || ownerId;
    // CORREÇÃO: Verificações de segurança
    if (!db) {
      toast({ variant: "destructive", title: "Erro", description: "O banco de dados não está pronto." });
      return;
    }
    if (!currentOwnerId) {
      toast({ variant: "destructive", title: "Erro de Permissão", description: "A identidade do proprietário não foi encontrada." });
      return;
    }
    if (!name.trim()) {
      toast({ variant: "destructive", title: "O nome é obrigatório" });
      return;
    }

    setLoading(true);
    try {
      if (isEditing && initialData) {
        const docRef = doc(db, 'tags', initialData.id);
        await updateDoc(docRef, { name: name.trim() });
      } else {
        await addDoc(collection(db, 'tags'), {
          ownerId: currentOwnerId,
          name: name.trim(),
          type: type,
          createdAt: serverTimestamp(),
        });
      }

      toast({ title: toastMessage });
      onSuccess(); // Notifica o componente pai
      handleClose(); // Fecha o modal e reseta o estado

    } catch (err) {
      console.error("Erro ao salvar: ", err);
      toast({ variant: "destructive", title: "Erro ao salvar", description: "Ocorreu um problema ao tentar salvar os dados." });
    } finally {
      setLoading(false);
    }
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
          <Button variant="outline" onClick={handleClose} disabled={loading}>Cancelar</Button>
          {/* CORREÇÃO: Desabilitar o botão se o DB não estiver pronto */}
          <Button onClick={handleSubmit} disabled={loading || !db}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
