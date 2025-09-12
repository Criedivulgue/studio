'use client';

import { useState, useEffect } from 'react';
// CORREÇÃO: Remover import antigo do DB e adicionar os novos
import { doc, onSnapshot, setDoc, Firestore } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Heading } from "@/components/ui/heading";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const aiSettingsSchema = z.object({
  persona: z.string().min(1, 'A persona não pode estar vazia.'),
  prompt: z.string().min(1, 'O prompt não pode estar vazio.'),
});

type AISettingsFormValues = z.infer<typeof aiSettingsSchema>;

export default function GlobalAISettingsPage() {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();
  // CORREÇÃO: Adicionar estado para o DB
  const [db, setDb] = useState<Firestore | null>(null);

  const { control, handleSubmit, reset, formState: { errors, isDirty } } = useForm<AISettingsFormValues>({
    resolver: zodResolver(aiSettingsSchema),
    defaultValues: { persona: '', prompt: '' }
  });

  // CORREÇÃO: Efeito para inicializar o Firebase
  useEffect(() => {
    const initFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Firebase init error:", error);
        toast({ variant: 'destructive', title: 'Erro de Inicialização', description: 'Não foi possível carregar as configurações.' });
        setLoading(false);
      }
    };
    initFirebase();
  }, [toast]);

  // CORREÇÃO: Efeito para buscar os dados quando o DB estiver pronto
  useEffect(() => {
    if (!db) return;

    setLoading(true);
    const docRef = doc(db, 'system_settings', 'ai_global');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        reset({ persona: data.persona, prompt: data.prompt });
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching AI settings: ", error);
      toast({ variant: 'destructive', title: 'Erro', description: 'Falha ao carregar as configurações da IA.' });
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db, reset, toast]);

  const onSubmit = async (data: AISettingsFormValues) => {
    if (!db) {
        toast({ variant: 'destructive', title: 'Erro', description: 'A conexão com o banco de dados não foi estabelecida.' });
        return;
    }
    setIsSaving(true);
    try {
      const docRef = doc(db, 'system_settings', 'ai_global');
      await setDoc(docRef, data, { merge: true }); 
      toast({ title: 'Sucesso', description: 'Configurações da IA atualizadas com sucesso!' });
    } catch (error) {
      console.error("Error updating AI settings: ", error);
      toast({ variant: 'destructive', title: 'Erro ao Salvar', description: 'Falha ao salvar as configurações. Tente novamente.' });
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = loading || !db;

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-4 md:p-6">
      <Heading title="Configurações da IA Global" description="Gerencie a persona e o comportamento do assistente de IA público." />
      
      <div className="space-y-4">
          <div className='space-y-2'>
            <Label htmlFor="persona">Persona da IA</Label>
            <Controller
              name="persona"
              control={control}
              render={({ field }) => (
                <Input id="persona" placeholder="Ex: Assistente amigável e prestativo" {...field} disabled={isSaving} />
              )}
            />
            {errors.persona && <p className="text-sm text-destructive">{errors.persona.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor="prompt">Prompt do Sistema</Label>
            <Controller
              name="prompt"
              control={control}
              render={({ field }) => (
                <Textarea
                  id="prompt"
                  placeholder="Instruções detalhadas sobre como a IA deve se comportar, o que deve ou não fazer, etc."
                  className="min-h-[200px]"
                  {...field}
                  disabled={isSaving}
                />
              )}
            />
            {errors.prompt && <p className="text-sm text-destructive">{errors.prompt.message}</p>}
          </div>
      </div>

      <Button type="submit" disabled={isSaving || !isDirty}>
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
        Salvar Alterações
      </Button>
    </form>
  );
}
