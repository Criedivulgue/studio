
'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
// CORREÇÃO: Importar funções de inicialização em vez de 'db' diretamente.
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import {
  collection, query, where, onSnapshot, doc, writeBatch, Firestore
} from 'firebase/firestore';

interface Notification {
  id: string;
  title: string;
  body: string;
  url: string;
  isRead: boolean;
}

export function NotificationBell() {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // CORREÇÃO: Estado para a instância do Firestore.
  const [db, setDb] = useState<Firestore | null>(null);

  // CORREÇÃO: useEffect para inicializar o Firebase e obter a instância do db.
  useEffect(() => {
    const initDb = async () => {
      try {
        await ensureFirebaseInitialized();
        const { db: firestoreDb } = getFirebaseInstances();
        setDb(firestoreDb);
      } catch (error) {
        console.error("Erro ao inicializar o Firestore no NotificationBell:", error);
      }
    };
    initDb();
  }, []);

  useEffect(() => {
    // CORREÇÃO: Só executa se o usuário e o db existirem.
    if (!user || !db) return;

    const q = query(
      collection(db, 'notifications'),
      where('adminId', '==', user.id),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotifications: Notification[] = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as Omit<Notification, 'id'>),
      }));
      
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.length);
    });

    return () => unsubscribe();
  // CORREÇÃO: Adicionar 'db' como dependência.
  }, [user, db]);

  const handleOpenChange = async (isOpen: boolean) => {
    if (isOpen && notifications.length > 0 && db) {
      const batch = writeBatch(db);
      notifications.forEach(notif => {
        const notifRef = doc(db, 'notifications', notif.id);
        batch.update(notifRef, { isRead: true });
      });
      await batch.commit();
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
