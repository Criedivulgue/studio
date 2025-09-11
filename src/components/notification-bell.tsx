
'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth'; // Hook para obter o usuário logado
import { db } from '@/lib/firebase'; // Instância do Firestore
import {
  collection, query, where, onSnapshot, doc, writeBatch 
} from 'firebase/firestore';

// A interface da notificação agora corresponde ao documento do Firestore
interface Notification {
  id: string; // ID do documento do Firestore
  title: string;
  body: string;
  url: string;
  isRead: boolean;
}

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth(); // Obtém o usuário logado
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return; // Se não houver usuário, não faz nada

    // Query para buscar notificações não lidas para o usuário logado
    const q = query(
      collection(db, 'notifications'),
      where('adminId', '==', user.id), // CORREÇÃO: user.uid -> user.id
      where('isRead', '==', false)
    );

    // Listener em tempo real
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Notification, 'id'>),
      }));
      
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
    });

    // Limpa o listener ao desmontar o componente
    return () => unsubscribe();
  }, [user]); // Reexecuta se o usuário mudar

  // Marca as notificações como lidas quando o popover é aberto
  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && notifications.length > 0) {
      const batch = writeBatch(db);
      notifications.forEach(notif => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
      // O listener onSnapshot irá automaticamente limpar a lista
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    router.push(notification.url);
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 justify-center p-0 text-xs bg-red-500 text-white">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="grid gap-4">
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Notificações</h4>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? `Você tem ${unreadCount} novas notificações.` : 'Nenhuma nova notificação.'}
            </p>
          </div>
          <div className="grid gap-2">
            {notifications.length > 0 ? (
              // Mostra as notificações não lidas mais recentes primeiro
              notifications.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className="flex items-start gap-3 p-2 text-left hover:bg-muted/50 transition-colors rounded-md"
                >
                    <div className="pt-1">
                       <MessageSquare className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-semibold truncate">{item.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{item.body}</p>
                    </div>
                </button>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">Tudo em dia!</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
