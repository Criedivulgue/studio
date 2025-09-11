'use client';

import { Chat } from "@/components/chat";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, AlertTriangle } from "lucide-react";

export default function SuperAdminLiveChatPage() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-destructive">
                <AlertTriangle className="h-8 w-8 mb-2" />
                <p>Erro: Usuário não autenticado.</p>
            </div>
        )
    }

    return (
        <div className="h-full">
            <Chat user={user} />
        </div>
    );
}
