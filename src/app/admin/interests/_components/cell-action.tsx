'use client';

import { useState, useEffect } from 'react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuTrigger 
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
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Edit, MoreHorizontal, Trash, Copy, Loader2 } from 'lucide-react';
import { InterestColumn } from './columns';
import { doc, deleteDoc, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';

import { GroupModal } from '../../groups/_components/group-modal';

interface CellActionProps {
  data: InterestColumn;
  refetch: () => void;
}

export const CellAction: React.FC<CellActionProps> = ({ data, refetch }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [db, setDb] = useState<Firestore | null>(null);

  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Firebase init error in CellAction:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Ações indisponíveis no momento.' });
      }
    };
    initFirebase();
  }, [toast]);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: 'ID do Interesse Copiado!' });
  };

  const onDeleteConfirm = async () => {
    if (!db) {
      toast({ variant: 'destructive', title: 'Erro', description: 'Banco de dados não inicializado.' });
      return;
    }
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'tags', data.id));
      toast({ title: 'Interesse Excluído' });
      refetch();
    } catch (error) {
      console.error("Falha ao excluir interesse: ", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível remover o interesse.' });
    } finally {
      setLoading(false);
      setOpenAlert(false);
    }
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    refetch();
  };

  const actionsDisabled = loading || !db;

  return (
    <>
      <GroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        type="interest"
        initialData={data}
      />

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente o interesse.
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
          <DropdownMenuItem onClick={() => onCopy(data.id)}>
            <Copy className="mr-2 h-4 w-4" />
            Copiar ID
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setOpenAlert(true)} 
            className="text-destructive focus:text-destructive focus:bg-destructive/10"
          >
            <Trash className="mr-2 h-4 w-4" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
