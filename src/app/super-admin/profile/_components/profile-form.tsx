'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
// CORREÇÃO: Importar o writeBatch para operações atômicas
import { doc, getDoc, updateDoc, setDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db, storage } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';

const profileFormSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }).max(50, { message: 'O nome não pode ter mais de 50 caracteres.' }),
  avatarUrl: z.string().url({ message: "URL do avatar inválida." }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();
  const auth = getAuth();
  const user = auth.currentUser;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: '',
      avatarUrl: '',
    },
  });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setIsFetching(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            form.reset({ 
              name: userData.name || '', 
              avatarUrl: userData.avatarUrl || '' 
            });
          } else {
            const initialProfile = { 
                name: user.displayName || 'Super Administrador', 
                email: user.email, 
                avatarUrl: '' 
            };
            await setDoc(userDocRef, initialProfile);
            form.reset(initialProfile);
          }
        } catch (error) {
          console.error("Erro ao buscar/criar perfil:", error);
          toast({ title: 'Erro', description: 'Não foi possível carregar seu perfil.', variant: 'destructive' });
        }
        setIsFetching(false);
      };
      fetchProfile();
    } else {
        setIsFetching(false);
    }
  }, [user, form, toast]);

  // CORREÇÃO: Função de salvar atualizada para sincronizar com o perfil público
  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
        toast({ title: 'Erro de Autenticação', description: 'Você não está logado.', variant: 'destructive' });
        return;
    }

    setIsLoading(true);
    try {
      // 1. Criar um batch para garantir a atomicidade da operação
      const batch = writeBatch(db);

      // 2. Referência para o documento PRIVADO do usuário
      const userDocRef = doc(db, 'users', user.uid);
      batch.update(userDocRef, {
        name: data.name,
        avatarUrl: data.avatarUrl,
      });

      // 3. Referência para o documento PÚBLICO do usuário
      const publicProfileRef = doc(db, 'public_profiles', user.uid);
      batch.set(publicProfileRef, {
        name: data.name,
        avatarUrl: data.avatarUrl,
      }, { merge: true }); // Usar merge para criar ou atualizar

      // 4. Executar a operação atômica
      await batch.commit();

      toast({ title: 'Sucesso!', description: 'Seu perfil foi atualizado.' });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({ title: 'Erro', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações da Conta</CardTitle>
      </CardHeader>
      <CardContent>
        {isFetching ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Imagem de Perfil</FormLabel>
                        <FormControl>
                           <ImageUploader 
                             storagePath={`avatars/${user?.uid}`}
                             initialImageUrl={field.value}
                             onUploadComplete={(url) => {
                                form.setValue('avatarUrl', url, { shouldValidate: true });
                             }}
                           />
                        </FormControl>
                        <FormDescription>Esta imagem de perfil é usada em todo o sistema.</FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Exibição</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}
