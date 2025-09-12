'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, Link as LinkIcon, Edit, Trash, UserCheck, UserX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
// CORREÇÃO: Remover import direto do db e adicionar os novos
import { doc, updateDoc, deleteDoc, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import type { PlatformUser } from '@/lib/types';

interface CellActionProps {
  data: PlatformUser;
  onSuccess: () => void; // Para recarregar os dados na página pai
}

export const CellAction: React.FC<CellActionProps> = ({ data, onSuccess }) => {
  const { toast } = useToast();
  // CORREÇÃO: Adicionar estados de loading, db e alerta
  const [loading, setLoading] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);
  const [openAlert, setOpenAlert] = useState(false);

  // CORREÇÃO: Efeito para inicializar o Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Firebase init error in CellAction:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Ações indisponíveis.' });
      }
    };
    initFirebase();
  }, [toast]);

  const onCopyLink = () => {
    const chatLink = `${window.location.origin}/chat/${data.id}`;
    navigator.clipboard.writeText(chatLink);
    toast({ title: 'Link Copiado!', description: 'O link de chat do usuário foi copiado.' });
  };

  const toggleStatus = async () => {
    if (!db) return;
    setLoading(true);
    const newStatus = data.status === 'active' ? 'inactive' : 'active';
    try {
      const userRef = doc(db, 'users', data.id);
      await updateDoc(userRef, { status: newStatus });
      toast({ title: 'Sucesso', description: `Status atualizado para ${newStatus}.` });
      onSuccess(); // Recarrega os dados
    } catch (error) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao atualizar o status.' });
    } finally {
      setLoading(false);
    }
  };

  const onDeleteConfirm = async () => {
    if (!db) return;
    setLoading(true);
    try {
        await deleteDoc(doc(db, 'users', data.id));
        toast({ title: 'Sucesso', description: 'Usuário excluído permanentemente.' });
        onSuccess(); // Recarrega os dados
    } catch (error) {
        toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao excluir o usuário.' });
    } finally {
        setLoading(false);
        setOpenAlert(false);
    }
  };

  const actionsDisabled = loading || !db;

  return (
    <>
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá excluir permanentemente o usuário {data.name} e todos os seus dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={loading} className="bg-destructive hover:bg-destructive/90">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Excluindo...</> : 'Continuar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0" disabled={actionsDisabled}>
            <span className="sr-only">Abrir menu</span>
            {actionsDisabled ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem onClick={onCopyLink} disabled={actionsDisabled}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Copiar Link do Chat
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => toast({title: 'Em breve', description: 'A funcionalidade de edição será implementada no futuro.'})} disabled={actionsDisabled}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={toggleStatus} disabled={actionsDisabled}>
            {data.status === 'active' ? 
              <><UserX className="mr-2 h-4 w-4" />Desativar</> : 
              <><UserCheck className="mr-2 h-4 w-4" />Ativar</>
            }
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenAlert(true)} className="text-red-500 focus:text-red-600 focus:bg-red-50" disabled={actionsDisabled}>
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
