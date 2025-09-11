'use client';

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { ShieldAlert } from 'lucide-react';

export default function SuperAdminHistoryPage() {

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <Heading 
        title="Histórico de Chats"
        description="Visualização de todas as conversas da plataforma."
      />
      <Separator />
      
      <div className="flex flex-col items-center justify-center h-64 bg-secondary/50 border border-dashed rounded-lg text-center p-8">
        <ShieldAlert className="h-16 w-16 text-primary mb-4" />
        <h2 className="text-2xl font-bold text-primary">Recurso Desativado por Design</h2>
        <p className="text-muted-foreground mt-2 max-w-md">
          Como Super Administrador, sua capacidade de visualizar o histórico de conversas de outros administradores foi intencionalmente desativada para garantir a privacidade e a confiança de cada usuário na plataforma.
        </p>
        <p className="text-sm text-muted-foreground mt-4 max-w-md">
          Esta medida está alinhada com nossa <a href="/legal/privacy-policy" className="underline hover:text-primary">Política de Privacidade</a> e reforça que os dados de cada administrador são confidenciais.
        </p>
      </div>

    </div>
  );
}
