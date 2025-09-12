'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { MultiSelect, MultiSelectOption } from '@/components/ui/multi-select';
import { NewContactPayload } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';

// Esquema de validação com Zod
const formSchema = z.object({
  name: z.string().min(1, "O nome é obrigatório."),
  phone: z.string().min(10, "O telefone deve ter no mínimo 10 dígitos."),
  groupIds: z.array(z.string()).optional(),
  interestIds: z.array(z.string()).optional(),
});

interface AddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth(); // Hook para obter o usuário logado
  const [isLoading, setIsLoading] = useState(false);
  const [groupOptions, setGroupOptions] = useState<MultiSelectOption[]>([]);
  const [interestOptions, setInterestOptions] = useState<MultiSelectOption[]>([]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      phone: '',
      groupIds: [],
      interestIds: [],
    },
  });

  useEffect(() => {
    if (isOpen && user) { // Apenas busca se o modal estiver aberto e o usuário logado
      const fetchTags = async () => {
        const db = getFirestore();
        // Modifica a query para buscar apenas tags do usuário logado
        const q = query(collection(db, "tags"), where("ownerId", "==", user.id));
        const querySnapshot = await getDocs(q);
        const groups: MultiSelectOption[] = [];
        const interests: MultiSelectOption[] = [];
        querySnapshot.forEach((doc) => {
          const tag = doc.data();
          if (tag.type === 'group') {
            groups.push({ value: doc.id, label: tag.name });
          } else if (tag.type === 'interest') {
            interests.push({ value: doc.id, label: tag.name });
          }
        });
        setGroupOptions(groups);
        setInterestOptions(interests);
      };

      fetchTags();
    }
  }, [isOpen, user]); // Depende do estado de abertura do modal e do usuário

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para adicionar um contato.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const db = getFirestore();
      const newContact: NewContactPayload = {
        ...values,
        ownerId: user.id, // Adiciona o ID do usuário logado
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      await addDoc(collection(db, "contacts"), newContact);
      
      toast({ title: "Sucesso", description: "Contato adicionado com sucesso." });
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao adicionar contato: ", error);
      toast({ title: "Erro", description: "Não foi possível adicionar o contato.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adicionar Novo Contato</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do contato" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefone (com DDI)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: 5511999999999" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="groupIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grupos</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={groupOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Selecione os grupos..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="interestIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interesses</FormLabel>
                  <FormControl>
                    <MultiSelect
                      options={interestOptions}
                      selected={field.value || []}
                      onChange={field.onChange}
                      placeholder="Selecione os interesses..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Adicionar Contato
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
