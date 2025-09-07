import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowRight, Bot, Zap } from "lucide-react";
import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="container mx-auto px-4 md:px-6 h-16 flex items-center">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <Logo />
          <span className="font-headline text-xl font-bold">OmniFlow AI</span>
        </Link>
      </header>
      <main className="flex-1">
        <section className="relative py-20 md:py-32 lg:py-40 bg-gradient-to-br from-background to-primary/10">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <div className="max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-headline font-bold tracking-tighter mb-4">
                Atendimento ao Cliente Mais Inteligente, Instantaneamente
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                O OmniFlow AI roteia dinamicamente os chats para a IA certa, configurada por seus administradores, para respostas hiper-relevantes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/login">
                    Acessar Painel <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/chat/super-admin">
                    Testar Chat de Demonstração <Bot className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">O Futuro da Interação com o Cliente</h2>
              <p className="text-muted-foreground mt-4">
                Do roteamento inteligente de chat a poderosas transmissões, o OmniFlow AI oferece um conjunto completo de ferramentas para elevar seu suporte ao cliente.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-semibold">Roteamento de Chat com IA</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Roteie dinamicamente os chats dos usuários para a configuração de IA apropriada com base no administrador atribuído para suporte personalizado.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-semibold">Transmissão Corporativa</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Envie anúncios, atualizações e campanhas de marketing para todos os usuários ou segmentos específicos por meio de vários canais.
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
                    Lista de contatos completa com importação/exportação, agrupamento de usuários e acesso a suporte multicanal.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted border-t">
        <div className="container mx-auto px-4 md:px-6 py-6 flex justify-between items-center text-muted-foreground">
          <p className="text-sm">&copy; {new Date().getFullYear()} OmniFlow AI. Todos os direitos reservados.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm hover:text-primary" prefetch={false}>
              Política de Privacidade
            </Link>
            <Link href="#" className="text-sm hover:text-primary" prefetch={false}>
              Termos de Serviço
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
