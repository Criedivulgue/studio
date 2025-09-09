'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth"; // Importado
import { signIn, signUp, checkSuperAdminExists } from "@/services/authService";
import { User } from "@/lib/types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false); // Renomeado para clareza
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isAuthLoading } = useAuth(); // Hook de autenticação em uso

  // Efeito para redirecionar usuários já logados
  useEffect(() => {
    if (!isAuthLoading && user) {
      toast({ title: "Você já está logado!", description: "Redirecionando para o seu painel..." });
      if (user.role === 'superadmin') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/admin/dashboard');
      }
    }
  }, [isAuthLoading, user, router, toast]);

  const handleAuth = async (action: "login" | "signup") => {
    setIsSubmitting(true);
    try {
      let loggedInUser: User | null = null;
      if (action === "login") {
        loggedInUser = await signIn(email, password);
      } else {
        const name = email.split('@')[0];
        const superAdminExists = await checkSuperAdminExists();
        const role = superAdminExists ? 'admin' : 'superadmin';

        loggedInUser = await signUp(email, password, name, role);
        
        toast({
          title: `Cadastro realizado com sucesso!`,
          description: `Sua conta foi criada com a função de ${role}.`,
        });
      }
      
      if (loggedInUser) {
        toast({
          title: `Bem-vindo, ${loggedInUser.name}!`,
          description: "Você será redirecionado para o seu painel.",
        });

        if (loggedInUser.role === 'superadmin') {
          router.push('/super-admin/dashboard');
        } else {
          router.push('/admin/dashboard');
        }
      }

    } catch (error: any) {
      const firebaseError = error.code || 'auth/unknown-error';
      let message = "Ocorreu um erro. Tente novamente.";
      switch (firebaseError) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = "Email ou senha inválidos.";
          break;
        case 'auth/email-already-in-use':
          message = "Este email já está cadastrado. Tente fazer login.";
          break;
        case 'auth/weak-password':
          message = "Sua senha é muito fraca. Use pelo menos 6 caracteres.";
          break;
        case 'auth/invalid-email':
            message = "O email fornecido não é válido.";
            break;
        default:
          console.error("Firebase Auth Error:", error);
          break;
      }
      toast({
        variant: "destructive",
        title: "Falha na Autenticação",
        description: message,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Mostra um loader em tela cheia enquanto verifica a sessão ou se o usuário já está logado e sendo redirecionado
  if (isAuthLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Só mostra o formulário se a autenticação terminou e não há usuário
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Link href="/">
                <Logo />
              </Link>
            </div>
          <CardTitle className="text-2xl font-headline">Acesse sua Conta</CardTitle>
          <CardDescription>
            Entre com suas credenciais ou cadastre-se para criar a conta de Super Admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nome@exemplo.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
            <div className="flex gap-2">
                <Button onClick={() => handleAuth('login')} className="w-full" disabled={isSubmitting || !email || !password}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Login
                </Button>
                <Button onClick={() => handleAuth('signup')} variant="secondary" className="w-full" disabled={isSubmitting || !email || !password}>
                     {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} 
                    Cadastrar
                </Button>
            </div>
          </div>
           <div className="mt-4 text-center text-xs">
             <p className="text-muted-foreground">O primeiro usuário cadastrado será o Super Admin.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
