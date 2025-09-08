
'use client';

import { useState, useEffect } from 'react';
import { Bell, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';

interface Notification {
  id: string;
  title: string;
  body: string;
  url: string;
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const handleNewMessage = (event: CustomEvent) => {
      const { notification, webpush } = event.detail;
      const newNotification: Notification = {
        id: event.detail.messageId || new Date().toISOString(),
        title: notification.title,
        body: notification.body,
        url: webpush.fcm_options.link,
      };

      setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // Mantém as últimas 5
      setUnreadCount(prev => prev + 1);
    };

    window.addEventListener('new-fcm-message', handleNewMessage as EventListener);
    return () => window.removeEventListener('new-fcm-message', handleNewMessage as EventListener);
  }, []);

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setUnreadCount(0); // Marca como lido ao abrir o popover
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    router.push(notification.url); // Redireciona para o chat
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
              Você tem {unreadCount} novas mensagens.
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
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma nova notificação.</p>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
