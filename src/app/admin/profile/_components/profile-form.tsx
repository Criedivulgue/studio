'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Firestore, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Auth, onAuthStateChanged } from 'firebase/auth';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { ImageUploader } from '@/components/ui/image-uploader';
import type { PublicProfile, PlatformUser } from '@/lib/types';

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
  
  const [db, setDb] = useState<Firestore | null>(null);
  const [auth, setAuth] = useState<Auth | null>(null);
  const [user, setUser] = useState<PlatformUser | null>(null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { displayName: '', greeting: '', avatarUrl: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    const initialize = async () => {
      setIsFetching(true);
      try {
        await ensureFirebaseInitialized();
        const { auth: authInstance, db: dbInstance } = getFirebaseInstances();
        setAuth(authInstance);
        setDb(dbInstance);

        const unsubscribe = onAuthStateChanged(authInstance, async (firebaseUser) => {
          if (firebaseUser) {
            const userDocRef = doc(dbInstance, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
              setUser({ ...userDocSnap.data(), id: firebaseUser.uid } as PlatformUser);
            }
          } else {
            setUser(null);
            setIsFetching(false);
          }
        });
        return unsubscribe;
      } catch (error) {
        console.error("Erro de inicialização do Firebase:", error);
        toast({ title: 'Erro', description: 'Falha ao carregar. Recarregue a página.', variant: 'destructive' });
        setIsFetching(false);
      }
    };
    initialize();
  }, [toast]);

  useEffect(() => {
    if (user && db) {
      const fetchProfile = async () => {
        try {
          const publicProfileRef = doc(db, 'public_profiles', user.id);
          const publicProfileSnap = await getDoc(publicProfileRef);

          if (publicProfileSnap.exists()) {
            const profileData = publicProfileSnap.data() as PublicProfile;
            form.reset(profileData);
          } else {
            form.reset({ 
                displayName: user.name || 'Novo Usuário', 
                greeting: 'Olá! Como posso ajudar?', 
                avatarUrl: user.avatar || '' 
            });
            console.warn('Perfil público não encontrado, usando dados de fallback.');
          }
        } catch (error) {
          console.error("Erro ao buscar perfil público:", error);
          toast({ title: 'Erro', description: 'Não foi possível carregar seu perfil.', variant: 'destructive' });
        } finally {
          setIsFetching(false);
        }
      };
      fetchProfile();
    } else if (!user) {
        setIsFetching(false);
    }
  }, [user, db, form, toast]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !db) {
      toast({ title: 'Erro de Autenticação', description: 'Você não está logado ou o serviço não está pronto.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const batch = writeBatch(db);
      const publicProfileRef = doc(db, 'public_profiles', user.id);
      const userRef = doc(db, 'users', user.id);

      const publicProfileData: Partial<PublicProfile> = {
        displayName: data.displayName,
        avatarUrl: data.avatarUrl,
        greeting: data.greeting,
      };

      batch.set(publicProfileRef, publicProfileData, { merge: true });
      batch.update(userRef, { name: data.displayName, avatarUrl: data.avatarUrl });

      await batch.commit();

      toast({ title: 'Sucesso!', description: 'Seu perfil público foi atualizado.' });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast({ title: 'Erro', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const canSubmit = !isLoading && !isFetching && form.formState.isValid && db && user;

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
                        storagePath={`avatars/${user?.id}`}
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
              <Button type="submit" disabled={!canSubmit}>
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
