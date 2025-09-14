'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Search, UserPlus, Zap, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Functions, httpsCallable } from 'firebase/functions';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import type { ChatSession, Contact } from '@/lib/types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useDebounce } from '@/hooks/use-debounce';

const VISITOR_ID_KEY = 'plataforma_visitor_id';

interface LeadIdentificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ChatSession;
  adminId: string;
}

// Tipagens para os retornos das funções de backend
interface IdentificationResult { status: string; conversationId: string; contactId: string; anonymousVisitorId: string; }
interface ConnectionResult { status: string; conversationId: string; anonymousVisitorId: string; }

export function LeadIdentificationModal({ isOpen, onClose, session, adminId }: LeadIdentificationModalProps) {
  const [functions, setFunctions] = useState<Functions | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [name, setName] = useState(session.visitorName || '');
  const [email, setEmail] = useState(session.visitorEmail || '');
  const [whatsapp, setWhatsapp] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const [showFullForm, setShowFullForm] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      const initFirebase = async () => {
        try {
          await ensureFirebaseInitialized();
          const { functions: firebaseFunctions } = getFirebaseInstances();
          setFunctions(firebaseFunctions);
        } catch (error) {
          console.error("Firebase init error in Modal:", error);
          toast({ variant: 'destructive', title: 'Erro de Inicialização' });
          onClose();
        }
      };
      initFirebase();
    }
  }, [isOpen, onClose, toast]);

  useEffect(() => {
    if (debouncedSearchTerm && functions) {
      setIsSearching(true);
      httpsCallable(functions, 'searchContacts')({ searchTerm: debouncedSearchTerm })
        .then(result => setSearchResults((result.data as { contacts: Contact[] }).contacts))
        .catch(() => toast({ variant: 'destructive', title: 'Erro na Busca'}))
        .finally(() => setIsSearching(false));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchTerm, functions, toast]);

  const handleConnectContact = async (contactId: string) => {
    if (!functions) return;
    setIsProcessing(true);
    try {
      const connectFunction = httpsCallable(functions, 'connectSessionToContact');
      // CORREÇÃO: Usa asserção de tipo no `result.data`
      const result = await connectFunction({ sessionId: session.id, contactId });
      const { anonymousVisitorId } = result.data as ConnectionResult;

      if (anonymousVisitorId) localStorage.setItem(VISITOR_ID_KEY, anonymousVisitorId);
      toast({ title: 'Sucesso', description: 'A conversa foi conectada ao contato existente.' });
      onClose();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !functions) return;
    setIsProcessing(true);
    try {
      const identifyLeadFunction = httpsCallable(functions, 'identifyLead');
      // CORREÇÃO: Usa asserção de tipo no `result.data`
      const result = await identifyLeadFunction({ sessionId: session.id, adminId, contactData: { name, email, whatsapp } });
      const { anonymousVisitorId } = result.data as IdentificationResult;

      if (anonymousVisitorId) localStorage.setItem(VISITOR_ID_KEY, anonymousVisitorId);
      toast({ title: 'Sucesso', description: `Contato ${name} criado e conversa associada.` });
      onClose();
    } catch (error: any) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' });
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      const initialName = (session.probableContactId && session.visitorName) ? '' : (session.visitorName || '');
      setName(initialName);
      setEmail(session.visitorEmail || '');
      setWhatsapp('');
      setSearchTerm('');
      setSearchResults([]);
      setIsProcessing(false);
      // Garante que a visão de confirmação apareça primeiro se aplicável
      setShowFullForm(session.probableContactId ? false : true);
    }
  }, [session, isOpen]);

  const renderContent = () => {
    if (session.probableContactId && !showFullForm) {
      return (
        <div className="pt-4 text-center">
          <Zap className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h3 className="text-lg font-semibold">Visitante Reconhecido!</h3>
          <p className="text-muted-foreground mt-2 mb-6">Este visitante provavelmente é <span className="font-bold text-foreground">{session.visitorName?.replace('Provavelmente ', '')}</span>. Deseja conectar esta sessão ao contato dele?</p>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" onClick={() => setShowFullForm(true)} disabled={isProcessing}>Não, buscar/criar outro</Button>
            <Button onClick={() => handleConnectContact(session.probableContactId!)} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4"/>}
              Sim, conectar
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="pt-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input placeholder="Buscar por nome, email ou WhatsApp..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" disabled={!functions || isProcessing}/>
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin" />}
            </div>

            {searchResults.length > 0 && (
                <ScrollArea className="mt-4 border rounded-md max-h-40"><div className="p-2">
                    {searchResults.map(contact => (
                        <div key={contact.id} className="flex items-center justify-between p-2 hover:bg-muted rounded-md">
                            <div><p className="font-semibold">{contact.name}</p><p className="text-sm text-muted-foreground">{contact.email}</p></div>
                            <Button size="sm" variant="outline" onClick={() => handleConnectContact(contact.id)} disabled={isProcessing}>Conectar</Button>
                        </div>
                    ))}
                </div></ScrollArea>
            )}
        </div>

        <Separator className="my-4" />

        <form onSubmit={handleCreateContact}>
            <div className="grid gap-4">
                <h3 className="text-md font-semibold text-foreground">Ou Crie um Novo Contato</h3>
                 <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nome</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required disabled={isProcessing} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="col-span-3" required disabled={isProcessing} />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="whatsapp" className="text-right">WhatsApp</Label>
                    <Input id="whatsapp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="col-span-3" disabled={isProcessing} />
                </div>
            </div>
            <DialogFooter className="mt-6">
                <Button type="button" variant="ghost" onClick={onClose} disabled={isProcessing}>Cancelar</Button>
                <Button type="submit" disabled={!name || !email || isProcessing || !functions}>
                    {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <UserPlus className="mr-2 h-4 w-4" />
                    {!functions ? 'Carregando...' : 'Criar e Conectar'}
                </Button>
            </DialogFooter>
        </form>
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Identificar / Conectar Contato</DialogTitle>
          <DialogDescription>
            {session.probableContactId && !showFullForm 
                ? "O sistema reconheceu um visitante recorrente."
                : "Busque um contato existente para conectar esta conversa ou crie um novo abaixo."}
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
