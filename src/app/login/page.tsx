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
import { signIn, signUp, checkSuperAdminExists } from "@/services/authService";
import { User } from "@/lib/types";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (action: "login" | "signup") => {
    setIsLoading(true);
    try {
      let user: User | null = null;
      if (action === "login") {
        user = await signIn(email, password);
      } else {
        const name = email.split('@')[0];
        
        // Verifica se o Super Admin já existe
        const superAdminExists = await checkSuperAdminExists();
        const role = superAdminExists ? 'Admin' : 'Super Admin';

        user = await signUp(email, password, name, role);
        
        toast({
          title: `Cadastro realizado com sucesso!`,
          description: `Sua conta foi criada com a função de ${role}.`,
        });
      }
      
      if (user) {
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
             <p className="text-muted-foreground">O primeiro usuário cadastrado será o Super Admin.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
