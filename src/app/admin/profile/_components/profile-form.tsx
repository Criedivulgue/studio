'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import type { PublicProfile } from '@/lib/types';

// 1. ATUALIZAR O SCHEMA PARA TORNAR O AVATAR OBRIGATÓRIO
const profileFormSchema = z.object({
  displayName: z.string()
    .min(2, { message: 'O nome de exibição deve ter pelo menos 2 caracteres.' })
    .max(50, { message: 'O nome não pode ter mais de 50 caracteres.' }),
  greeting: z.string()
    .max(100, { message: 'A saudação não pode ter mais de 100 caracteres.' })
    .optional(),
  avatarUrl: z.string().min(1, { message: "A imagem de perfil é obrigatória." }).url({ message: "URL da imagem de perfil inválida." }),
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
      displayName: '',
      greeting: '',
      avatarUrl: '',
    },
    // 2. ADICIONAR MODO DE VALIDAÇÃO 'onChange'
    mode: 'onChange',
  });

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        setIsFetching(true);
        try {
          const publicProfileRef = doc(db, 'public_profiles', user.uid);
          const publicProfileSnap = await getDoc(publicProfileRef);

          if (publicProfileSnap.exists()) {
            const profileData = publicProfileSnap.data() as PublicProfile;
            form.reset({
              displayName: profileData.displayName || '',
              greeting: profileData.greeting || '',
              avatarUrl: profileData.avatarUrl || '',
            });
          } else {
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()){
                const userData = userDocSnap.data();
                form.reset({ 
                    displayName: userData.name || 'Novo Usuário', 
                    greeting: 'Olá! Como posso ajudar?', 
                    avatarUrl: userData.avatarUrl || '' 
                });
            }
            console.warn('Perfil público não encontrado, usando dados de fallback.');
          }
        } catch (error) {
          console.error("Erro ao buscar perfil público:", error);
          toast({ title: 'Erro', description: 'Não foi possível carregar seu perfil.', variant: 'destructive' });
        }
        setIsFetching(false);
      };
      fetchProfile();
    } else {
      setIsFetching(false);
    }
  }, [user, form, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user) {
      toast({ title: 'Erro de Autenticação', description: 'Você não está logado.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const publicProfileRef = doc(db, 'public_profiles', user.uid);
      const userRef = doc(db, 'users', user.uid);

      const publicProfileData: Partial<PublicProfile> = {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl || '',
        greeting: data.greeting || 'Olá! Como posso ajudar hoje?',
      };

      batch.set(publicProfileRef, publicProfileData, { merge: true });
      batch.update(userRef, { name: data.displayName });

      await batch.commit();

      toast({ title: 'Sucesso!', description: 'Seu perfil público foi atualizado.' });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({ title: 'Erro', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Perfil Público</CardTitle>
        <CardDescription>Estas informações serão exibidas aos visitantes na sua página de chat.</CardDescription>
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
                    <FormDescription>Faça o upload de uma imagem que será seu avatar no chat.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome de Exibição</FormLabel>
                    <FormControl>
                      <Input placeholder="Seu nome público" {...field} />
                    </FormControl>
                     <FormDescription>Este é o nome que aparecerá para seus clientes.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="greeting"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frase de Saudação</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Ex: Olá! Como posso te ajudar hoje?" {...field} />
                    </FormControl>
                    <FormDescription>Uma frase curta que aparecerá abaixo do seu nome no chat.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* 3. DESABILITAR O BOTÃO SE O FORMULÁRIO FOR INVÁLIDO */}
              <Button type="submit" disabled={isLoading || !form.formState.isValid}>
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
