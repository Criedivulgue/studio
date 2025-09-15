'use client';

import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore';
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { useAuth } from './use-auth';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFirebaseMessaging() {
  const { user } = useAuth();
  const [messaging, setMessaging] = useState<Messaging | null>(null);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      try {
        await ensureFirebaseInitialized();
        const { messaging: firebaseMessaging } = getFirebaseInstances();
        setMessaging(firebaseMessaging);
        if (typeof window !== 'undefined' && 'Notification' in window) {
          setNotificationPermission(Notification.permission);
        }
      } catch (error) {
        console.error("[useFirebaseMessaging] Erro na inicialização do Firebase:", error);
      }
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      initializeFirebase();
    } else {
        console.log("[useFirebaseMessaging] Service Worker não é suportado neste navegador.");
    }
  }, []);

  useEffect(() => {
    // A condição de guarda agora verifica explicitamente a propriedade 'uid'
    if (!messaging || !user || !('uid' in user)) {
      return;
    }

    const requestPermissionAndGetToken = async () => {
      try {
        let permission = notificationPermission;
        if (permission === 'default') {
          console.log('Solicitando permissão para notificações...');
          permission = await Notification.requestPermission();
          setNotificationPermission(permission);
        }

        if (permission === 'granted') {
          // TypeScript agora sabe que user.uid é seguro para acessar aqui
          console.log('Obtendo token FCM para o usuário:', user.uid);
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

          if (currentToken) {
            console.log('Token FCM obtido:', currentToken);
            const { db } = getFirebaseInstances();
            // E aqui também
            const userDocRef = doc(db, 'users', user.uid);

            await setDoc(userDocRef, { fcmTokens: arrayUnion(currentToken) }, { merge: true });

            console.log('Token FCM salvo/atualizado no Firestore.');
          } else {
            console.log('Não foi possível obter o token FCM.');
          }
        } else {
            console.log(`Permissão de notificação não concedida: ${permission}`);
        }
      } catch (error) {
        console.error('Erro ao obter token FCM:', error);
      }
    };

    requestPermissionAndGetToken();

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Mensagem recebida em primeiro plano:', payload);
      window.dispatchEvent(new CustomEvent('new-fcm-message', { detail: payload }));
    });

    return () => unsubscribe();
  }, [user, messaging, notificationPermission]);

  return { notificationPermission };
}
