'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from '@/hooks/use-toast';
import { createContact } from '@/services/contactService';

interface ImportContactsModalProps {
  adminUid: string;
  onSuccess: () => void;
  isOpen: boolean;
  onClose: () => void;
}

export function ImportContactsModal({ adminUid, onSuccess, isOpen, onClose }: ImportContactsModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ processed: 0, total: 0 });
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  // Função simples para parsear CSV
  const parseCsv = (csvText: string) => {
    const lines = csvText.trim().split('\n');
    const header = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: { [key: string]: string } = {};
      header.forEach((key, i) => {
        obj[key] = values[i];
      });
      return obj;
    });
    return rows;
  };

  const handleSubmit = async () => {
    if (!file) {
      toast({ variant: "destructive", title: "Nenhum arquivo selecionado", description: "Por favor, selecione um arquivo CSV para importar." });
      return;
    }

    setIsLoading(true);
    setProgress({ processed: 0, total: 0 });

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const contactsToImport = parseCsv(text);
        const total = contactsToImport.length;
        setProgress({ processed: 0, total });

        if (total === 0) {
          throw new Error("O arquivo CSV está vazio ou em um formato inválido.");
        }

        let successCount = 0;
        let errorCount = 0;

        for (const [index, contact] of contactsToImport.entries()) {
          const name = contact.Nome || contact.name;
          const whatsapp = contact.Whatsapp || contact.whatsapp;

          if (!name || !whatsapp) {
            console.warn(`Registro ${index + 1} ignorado: Nome ou WhatsApp ausentes.`);
            errorCount++;
            setProgress({ processed: index + 1, total });
            continue;
          }

          const payload = {
            name,
            whatsapp,
            ownerId: adminUid,
            email: contact.Email || contact.email || '',
            phone: contact.Telefone || contact.phone || '',
            interesses: contact.Interesses ? contact.Interesses.split(' | ') : [],
          };

          try {
            await createContact(payload as any);
            successCount++;
          } catch (err) {
            console.error(`Falha ao importar contato ${name}:`, err);
            errorCount++;
          }
          setProgress({ processed: index + 1, total });
        }

        toast({ 
          title: "Importação Concluída", 
          description: `${successCount} contatos importados com sucesso. ${errorCount} falharam.`
        });
        onSuccess();
        handleClose();

      } catch (error: any) {
        console.error("Falha ao processar o arquivo CSV:", error);
        toast({ variant: "destructive", title: "Erro na importação", description: error.message || "Não foi possível ler o arquivo. Verifique o formato." });
      }
    };

    reader.onerror = () => {
        toast({ variant: "destructive", title: "Erro", description: "Falha ao ler o arquivo." });
    };

    reader.readAsText(file);
    setIsLoading(false);
  };

  const handleClose = () => {
    setFile(null);
    setIsLoading(false);
    setProgress({ processed: 0, total: 0 });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar Contatos de CSV</DialogTitle>
          <DialogDescription>
            Selecione um arquivo CSV com as colunas 'Nome' e 'Whatsapp'. Baixe um arquivo modelo{" "}
            <a href="/contatos_modelo.csv" download className="underline font-bold text-primary hover:text-primary/80">
                aqui
            </a>
            .
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
            <div className="space-y-2">
                <Label htmlFor="file">Arquivo CSV</Label>
                <Input id="file" type="file" accept=".csv" onChange={handleFileChange} disabled={isLoading} />
            </div>
            {isLoading && progress.total > 0 && (
                <div className="w-full text-center text-sm text-muted-foreground">
                    <p>Processando... {progress.processed} de {progress.total}</p>
                    <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                        <div className="bg-primary h-2.5 rounded-full" style={{ width: `${(progress.processed / progress.total) * 100}%` }}></div>
                    </div>
                </div>
            )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isLoading || !file}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Começar Importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
