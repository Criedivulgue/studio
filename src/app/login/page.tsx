"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { signIn, signUp } from "@/services/authService";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (action: "login" | "signup") => {
    setIsLoading(true);
    try {
      let user;
      if (action === "login") {
        user = await signIn(email, password);
      } else {
        // Para o cadastro, podemos pegar o nome do email por simplicidade
        const name = email.split('@')[0];
        // Por padrão, novos cadastros são 'Admin'
        user = await signUp(email, password, name, 'Admin');
      }
      
      toast({
        title: `Bem-vindo, ${user.name}!`,
        description: "Você será redirecionado para o seu painel.",
      });

      // Redireciona com base na função do usuário
      if (user.role === 'Super Admin') {
        router.push('/super-admin/dashboard');
      } else {
        router.push('/admin/dashboard');
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
      setIsLoading(false);
    }
  };


  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
                <Logo />
            </div>
          <CardTitle className="text-2xl font-headline">Acesse sua Conta</CardTitle>
          <CardDescription>
            Entre ou cadastre-se para gerenciar seus contatos
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
                disabled={isLoading}
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
                disabled={isLoading}
              />
            </div>
            <div className="flex gap-2">
                <Button onClick={() => handleAuth('login')} className="w-full" disabled={isLoading || !email || !password}>
                    {isLoading && <Loader2 className="animate-spin" />}
                    Login
                </Button>
                <Button onClick={() => handleAuth('signup')} variant="secondary" className="w-full" disabled={isLoading || !email || !password}>
                     {isLoading && <Loader2 className="animate-spin" />}
                    Cadastrar
                </Button>
            </div>
          </div>
           <div className="mt-4 text-center text-xs">
            <p className="font-semibold">Acesso Rápido (Demo):</p>
             <p className="text-muted-foreground">O acesso por link foi desativado por segurança.</p>
             <p className="text-muted-foreground">Use um email e senha para cadastrar/logar.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
