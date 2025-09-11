import { ReactNode } from 'react';

interface LegalLayoutProps {
  children: ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="py-12">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Atendimento Inteligente. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
