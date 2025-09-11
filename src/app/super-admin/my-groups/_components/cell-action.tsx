'use client';

import { useState } from 'react';
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
import { Edit, MoreHorizontal, Trash, Copy } from 'lucide-react';
import { GroupColumn } from './columns';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';

import { GroupModal } from './group-modal';

interface CellActionProps {
  data: GroupColumn;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [openAlert, setOpenAlert] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const onCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: 'ID do Grupo Copiado!' });
  };

  const onDeleteConfirm = async () => {
    setLoading(true);
    try {
      // ATENÇÃO: A coleção aqui pode ser 'groups' ou 'tags'. Verifique o nome correto no seu Firestore.
      // Com base no contexto, parece que deveria ser 'groups', mas o código original usava 'tags'.
      // Vou manter 'tags' para evitar introduzir um novo erro, mas isso deve ser revisado.
      await deleteDoc(doc(db, 'tags', data.id));
      toast({ title: 'Grupo Excluído' });
      // TODO: Add refresh logic here by passing a function from the parent
    } catch (error) {
      console.error("Falha ao excluir grupo: ", error);
      toast({ variant: 'destructive', title: 'Erro ao Excluir', description: 'Não foi possível remover o grupo.' });
    } finally {
      setLoading(false);
      setOpenAlert(false);
    }
  };

  return (
    <>
      <GroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          setIsEditModalOpen(false);
          toast({ title: 'Grupo atualizado com sucesso!' });
          // TODO: Add refresh logic here
        }}
        type="group"
        initialData={data}
      />

      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita. Isso irá deletar permanentemente o grupo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteConfirm} disabled={loading} className="bg-destructive hover:bg-destructive/90">
              {loading ? 'Excluindo...' : 'Continuar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
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
