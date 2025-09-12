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
import { useAuth } from "@/hooks/use-auth";
import { signIn, signUp, getUserProfile } from "@/services/authService";
import { PlatformUser } from "@/lib/types";

const handleAuthError = (error: any, toast: any) => {
  const firebaseError = error.code || 'auth/unknown-error';
  let message = "Ocorreu um erro. Tente novamente.";
  switch (firebaseError) {
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
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
      message = error.message || message;
      console.error("Auth Error:", error);
      break;
  }
  toast({
    variant: "destructive",
    title: "Falha na Autenticação",
    description: message,
  });
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: isAuthLoading } = useAuth();

  useEffect(() => {
    if (!isAuthLoading && user) {
      const targetUrl = user.role === 'superadmin' ? '/super-admin/dashboard' : '/admin/dashboard';
      window.location.href = targetUrl;
    }
  }, [isAuthLoading, user]);

  const redirectToDashboard = (loggedInUser: PlatformUser) => {
    toast({
      title: `Bem-vindo, ${loggedInUser.name}!`,
      description: "Você será redirecionado para o seu painel.",
    });
    const targetUrl = loggedInUser.role === 'superadmin' ? '/super-admin/dashboard' : '/admin/dashboard';
    window.location.href = targetUrl;
  }

  const handleLogin = async () => {
    setIsSubmitting(true);
    try {
      const firebaseUser = await signIn(email, password);
      if (firebaseUser) {
        const userProfile = await getUserProfile(firebaseUser.uid);
        if (userProfile) {
          redirectToDashboard(userProfile);
        } else {
          throw new Error("Perfil de usuário não encontrado.");
        }
      }
    } catch (error) {
      handleAuthError(error, toast);
      setIsSubmitting(false); // Manter o formulário ativo em caso de erro
    }
  };

  const handleSignUp = async () => {
    setIsSubmitting(true);
    try {
      const name = email.split('@')[0] || 'Novo Usuário';
      const newUser = await signUp(email, password, name);
      
      toast({
        title: `Cadastro realizado com sucesso!`,
        description: `Sua conta foi criada com a função de ${newUser.role}.`,
      });

      redirectToDashboard(newUser);
      
    } catch (error) {
      handleAuthError(error, toast);
      setIsSubmitting(false); // Manter o formulário ativo em caso de erro
    }
  };

  if (isAuthLoading || user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
              <h1 className="text-2xl font-bold font-headline">WhatsAi</h1>
            </Link>
          </div>
          <CardDescription>
            Entre com suas credenciais para acessar seu painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="nome@exemplo.com" required value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting}/>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting}/>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleLogin} className="w-full" disabled={isSubmitting || !email || !password}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Login
              </Button>
              <Button onClick={handleSignUp} variant="secondary" className="w-full" disabled={isSubmitting || !email || !password}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Cadastrar
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
