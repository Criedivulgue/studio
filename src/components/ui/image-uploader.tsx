'use client';

import { useState, useEffect } from 'react';
// CORREÇÃO: Adicionar tipos do Storage e funções de inicialização
import { FirebaseStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { ensureFirebaseInitialized, getFirebaseInstances } from "@/lib/firebase"; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  initialImageUrl?: string;
  onUploadComplete: (downloadUrl: string) => void;
  storagePath: string; 
  storage?: FirebaseStorage; // CORREÇÃO: Aceitar a instância do storage como prop opcional
}

// --- Função de Upload para Firebase Storage (CORRIGIDA) ---
async function uploadFile(file: File, path: string, storageInstance: FirebaseStorage): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storageInstance, `${path}/${fileName}`);

    const uploadResult = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(uploadResult.ref);

    return downloadUrl;
}

export function ImageUploader({ initialImageUrl, onUploadComplete, storagePath, storage: propStorage }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialImageUrl);
  // CORREÇÃO: Estado para a instância do Storage
  const [storage, setStorage] = useState<FirebaseStorage | null>(propStorage || null);
  const { toast } = useToast();

  // CORREÇÃO: Inicializa o Firebase se a instância não for passada via props
  useEffect(() => {
      const initFirebase = async () => {
        if (propStorage) return; // Não inicializa se já recebeu a instância
        try {
          await ensureFirebaseInitialized();
          const { storage: firebaseStorage } = getFirebaseInstances();
          setStorage(firebaseStorage);
        } catch (error) {
            console.error("Firebase init error in ImageUploader:", error);
            toast({ variant: 'destructive', title: 'Erro de Upload', description: 'O serviço de armazenamento não pôde ser iniciado.'});
        }
      };
      initFirebase();
  }, [propStorage, toast]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // CORREÇÃO: Verifica se a instância do storage está pronta
    if (!storage) {
        toast({ title: 'Serviço Indisponível', description: 'O armazenamento de arquivos não está pronto.', variant: 'destructive' });
        return;
    }

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Tipo de arquivo inválido', description: 'Por favor, selecione uma imagem.', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // 2MB
      toast({ title: 'Arquivo muito grande', description: 'A imagem não pode ter mais de 2MB.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    try {
      // CORREÇÃO: Passa a instância do storage para a função de upload
      const downloadUrl = await uploadFile(file, storagePath, storage);
      
      setPreviewUrl(downloadUrl);
      onUploadComplete(downloadUrl);

      toast({ title: 'Sucesso!', description: 'Sua imagem foi enviada. Lembre-se de salvar para aplicar a mudança.' });
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({ title: 'Erro de Upload', description: 'Não foi possível enviar sua imagem.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      <Avatar className="h-20 w-20 border">
        <AvatarImage src={previewUrl} />
        <AvatarFallback>IMG</AvatarFallback>
      </Avatar>
      <div className="relative">
        <Button asChild variant="outline">
          {/* CORREÇÃO: Desabilitar o botão se o storage não estiver pronto */}
          <label htmlFor="avatar-upload" className={`cursor-pointer ${!storage ? 'cursor-not-allowed opacity-50' : ''}`}>
            {isUploading 
                ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                : <Pencil className="mr-2 h-4 w-4" />
            }
            Alterar Imagem
          </label>
        </Button>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          disabled={isUploading || !storage} // CORREÇÃO: Desabilitar se o storage não estiver pronto
        />
      </div>
    </div>
  );
}
