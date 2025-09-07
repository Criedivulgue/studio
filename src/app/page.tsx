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
                Smarter Customer Service, Instantly
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                OmniFlow AI dynamically routes chats to the right AI, configured by your admins, for hyper-relevant responses.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild size="lg">
                  <Link href="/admin/dashboard">
                    Go to Dashboard <ArrowRight className="ml-2" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/chat/super-admin">
                    Try Demo Chat <Bot className="ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-headline font-bold">The Future of Customer Interaction</h2>
              <p className="text-muted-foreground mt-4">
                From intelligent chat routing to powerful broadcasting, OmniFlow AI provides a comprehensive suite of tools to elevate your customer support.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Bot className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-semibold">AI Chat Routing</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Dynamically route user chats to the appropriate AI configuration based on the assigned admin for personalized support.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <Zap className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-headline font-semibold">Corporate Broadcasting</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Send announcements, updates, and marketing campaigns to all users or specific segments via multiple channels.
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300">
                <CardHeader className="flex flex-row items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  </div>
                  <h3 className="text-xl font-headline font-semibold">Contact Management</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Full-featured contact list with import/export, user grouping, and multi-channel support access.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="bg-muted border-t">
        <div className="container mx-auto px-4 md:px-6 py-6 flex justify-between items-center text-muted-foreground">
          <p className="text-sm">&copy; {new Date().getFullYear()} OmniFlow AI. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm hover:text-primary" prefetch={false}>
              Privacy Policy
            </Link>
            <Link href="#" className="text-sm hover:text-primary" prefetch={false}>
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}