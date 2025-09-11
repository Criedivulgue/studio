
'use client';

import { useState } from 'react';
// CORREÇÃO: Remover `getStorage` e importar a instância `storage` compartilhada
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase"; 
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploaderProps {
  initialImageUrl?: string;
  onUploadComplete: (downloadUrl: string) => void;
  storagePath: string; // Ex: 'avatars/userId'
}

// --- Função de Upload para Firebase Storage (CORRIGIDA) ---
async function uploadFile(file: File, path: string): Promise<string> {
    // REMOVIDO: const storage = getStorage();
    // A instância `storage` agora é importada e usada diretamente.
    const fileName = `${Date.now()}-${file.name}`;
    const storageRef = ref(storage, `${path}/${fileName}`);

    const uploadResult = await uploadBytes(storageRef, file);
    const downloadUrl = await getDownloadURL(uploadResult.ref);

    return downloadUrl;
}

export function ImageUploader({ initialImageUrl, onUploadComplete, storagePath }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(initialImageUrl);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      const downloadUrl = await uploadFile(file, storagePath);
      
      setPreviewUrl(downloadUrl);
      onUploadComplete(downloadUrl);

      toast({ title: 'Sucesso!', description: 'Sua imagem foi enviada. Lembre-se de salvar o perfil para aplicar a mudança.' });
    } catch (error) {
      console.error("Erro no upload:", error);
      toast({ title: 'Erro de Upload', description: 'Não foi possível enviar sua imagem.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-4">
      {/* CORREÇÃO: Erro de digitação de <Avoatar> para </Avatar> */}
      <Avatar className="h-20 w-20 border">
        <AvatarImage src={previewUrl} />
        <AvatarFallback>IMG</AvatarFallback>
      </Avatar>
      <div className="relative">
        <Button asChild variant="outline">
          <label htmlFor="avatar-upload" className="cursor-pointer">
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
          disabled={isUploading}
        />
      </div>
    </div>
  );
}
