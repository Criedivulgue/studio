'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowRight, Bot, Zap } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useAuth } from '@/hooks/use-auth';
// CORREÇÃO: Removida a importação direta de 'db' e adicionadas as funções de inicialização.
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';

// A página inicial agora é apenas para marketing.
export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [superAdminLink, setSuperAdminLink] = useState('#');
  const [linkLoading, setLinkLoading] = useState(true);

  useEffect(() => {
    const fetchSuperAdminId = async () => {
      setLinkLoading(true);
      try {
        // CORREÇÃO: Garante que o Firebase está inicializado e obtém a instância do DB.
        await ensureFirebaseInitialized();
        const { db } = getFirebaseInstances();

        const configDocRef = doc(db, "public_config", "global");
        const docSnap = await getDoc(configDocRef);

        if (docSnap.exists()) {
          const superAdminId = docSnap.data().superAdminId;
          if (superAdminId) {
            setSuperAdminLink(`/chat/${superAdminId}`);
          } else {
            console.error("ERRO: O campo 'superAdminId' não foi encontrado no documento de configuração.");
            setSuperAdminLink('#');
          }
        } else {
          console.error("ERRO: O documento 'public_config/global' não foi encontrado.");
          setSuperAdminLink('#');
        }
      } catch (error) {
        console.error("ERRO ao buscar a configuração pública:", error);
        setSuperAdminLink('#');
      } finally {
        setLinkLoading(false);
      }
    };

    fetchSuperAdminId();
  }, []);

  const getDashboardLink = () => {
    if (!user) return "/login";
    return user.role === 'superadmin' ? '/super-admin/dashboard' : '/admin/dashboard';
  };

  const isChatDisabled = authLoading || linkLoading || !!user || superAdminLink === '#';

  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 md:px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2" prefetch={false}>
          <Logo />
          <span className="font-headline text-xl font-bold">WhatsAi</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background to-primary/10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter mb-4">
                Bem Vindo(a)
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                O Complemento para seu WhatsApp Profissional
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isChatDisabled ? (
                  <Button size="lg" className="font-bold" disabled>
                    {authLoading || linkLoading ? "Carregando..." : "Iniciar Atendimento"} <Bot className="ml-2" />
                  </Button>
                ) : (
                  <Button asChild size="lg" className="font-bold">
                    <Link href={superAdminLink}>
                      Iniciar Atendimento <Bot className="ml-2" />
                    </Link>
                  </Button>
                )}
                <Button asChild size="lg" variant="outline">
                  <Link href={getDashboardLink()}>
                    {user ? "Ir para o Painel" : "Acessar Painel"} <ArrowRight className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">A Resposta Humana e Inteligente!</h2>
              <p className="text-muted-foreground mt-4">
                O WhatsAI transforma o WhatsApp de uma ferramenta de mensagens caótica em um canal de negócios organizado, inteligente e proativo
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-semibold">Atendimento Personalizado</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Tudo que você e seu cliente tem interesse será sempre lembrado pra responder cada vêz melhor!
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-semibold">Respostas Rápidas a Qualquer Hora</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Não importa onde você esteja e quando, você sempre será atendido e sempre receberá a mensagem de seu cliente!
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <h3 className="text-xl font-headline font-semibold">Gerenciamento de Contatos</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Organize seus contatos por interesses e grupos, conheça e atenda cada um deles de forma única, organizada e prática!                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted border-t">
        <div className="container mx-auto px-4 md:px-6 py-6 flex justify-between items-center text-muted-foreground">
          <p className="text-sm">&copy; {new Date().getFullYear()} WhatsAi. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="/legal/privacy-policy" className="text-sm hover:text-primary" prefetch={false}>
              Política de Privacidade
            </Link>
            <Link href="/legal/terms-of-service" className="text-sm hover:text-primary" prefetch={false}>
              Termos de Serviço
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
