'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { getAuth, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'; // CORREÇÃO APLICADA AQUI
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const accountSettingsSchema = z.object({
  email: z.string().email({ message: "Formato de e-mail inválido." }),
  currentPassword: z.string().min(1, { message: "A senha atual é obrigatória para alterações." }),
  newPassword: z.string().optional(),
}).refine(data => !data.newPassword || (data.newPassword && data.newPassword.length >= 6), {
  message: "A nova senha deve ter pelo menos 6 caracteres.",
  path: ["newPassword"],
});

type AccountSettingsValues = z.infer<typeof accountSettingsSchema>;

export function AccountSettingsForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const auth = getAuth();
  const user = auth.currentUser;

  const form = useForm<AccountSettingsValues>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
    },
  });

  const onSubmit = async (data: AccountSettingsValues) => {
    if (!user) {
      toast({ title: 'Erro de Autenticação', description: 'Sessão de usuário não encontrada.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email!, data.currentPassword);
      await reauthenticateWithCredential(user, credential);

      let changesMade = false;
      if (data.email && data.email !== user.email) {
        await updateEmail(user, data.email);
        toast({ title: 'E-mail atualizado!', description: 'Seu e-mail de login foi alterado com sucesso.' });
        changesMade = true;
      }

      if (data.newPassword) {
        await updatePassword(user, data.newPassword);
        toast({ title: 'Senha atualizada!', description: 'Sua senha foi alterada com sucesso.' });
        changesMade = true;
      }

      if (!changesMade) {
        toast({ title: 'Nenhuma alteração', description: 'Você não modificou o e-mail nem a senha.' });
      } else {
        form.reset({ ...form.getValues(), currentPassword: '', newPassword: '' });
      }

    } catch (error: any) {
      console.error("Erro ao atualizar configurações da conta:", error);
      if (error.code === 'auth/wrong-password') {
        toast({ title: 'Senha Incorreta', description: 'A senha atual que você digitou está incorreta.', variant: 'destructive' });
      } else {
        toast({ title: 'Erro', description: 'Não foi possível salvar as alterações.', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações da Conta</CardTitle>
        <CardDescription>Gerencie suas credenciais de login. Para alterar qualquer informação, você precisa fornecer sua senha atual.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail de Login</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="seu@email.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova Senha (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Deixe em branco para não alterar" {...field} />
                  </FormControl>
                  <FormDescription>Se desejar, digite uma nova senha com pelo menos 6 caracteres.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha Atual</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Sua senha atual para confirmar" {...field} />
                  </FormControl>
                   <FormDescription>Obrigatória para confirmar qualquer alteração.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Configurações da Conta
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
