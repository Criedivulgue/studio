'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2 } from 'lucide-react';

// Supondo que a estrutura do perfil público seja esta
interface PublicProfile {
  name: string;
  avatar?: string;
  companyName?: string;
}

export default function PublicChatPage() {
  const params = useParams();
  const adminId = params.adminId as string;
  const [adminProfile, setAdminProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!adminId) {
      setLoading(false);
      setError("ID do administrador não fornecido.");
      return;
    }

    const fetchAdminProfile = async () => {
      try {
        const profileDocRef = doc(db, 'public_profiles', adminId);
        const profileDoc = await getDoc(profileDocRef);

        if (profileDoc.exists()) {
          setAdminProfile(profileDoc.data() as PublicProfile);
        } else {
          setError("Administrador não encontrado.");
        }
      } catch (err) {
        console.error("Erro ao buscar perfil do administrador:", err);
        setError("Ocorreu um erro ao carregar a página.");
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [adminId]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
        <h1 className="text-xl font-semibold text-destructive">{error}</h1>
        <p className="text-muted-foreground">Por favor, verifique o link ou tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col items-center mb-6">
            <Avatar className="h-20 w-20 mb-4">
                <AvatarImage src={adminProfile?.avatar} alt={adminProfile?.name} />
                <AvatarFallback className="text-3xl">{adminProfile?.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-center">{adminProfile?.name}</h2>
            {adminProfile?.companyName && <p className="text-muted-foreground text-center">{adminProfile.companyName}</p>}
        </div>

        {/* O componente do chat será inserido aqui */}
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">O widget de chat será carregado aqui em breve.</p>
        </div>
      </div>
       <footer className="mt-8 text-center">
         <p className="text-sm text-gray-500">Powered by OmniFlow AI</p>
       </footer>
    </div>
  );
}
