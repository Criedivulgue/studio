
import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; 
import { useAuth } from './use-auth';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFirebaseMessaging() {
  const { user } = useAuth();
  const [messaging, setMessaging] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const firebaseMessaging = getMessaging();
      setMessaging(firebaseMessaging);
      setNotificationPermission(Notification.permission);

      const requestPermissionAndGetToken = async () => {
        try {
          // **CORREÇÃO: Verificação crucial!**
          // Só prossiga se o usuário estiver autenticado e tiver um UID.
          if (!user || !user.uid) {
            // console.log('Aguardando usuário autenticado para obter token FCM...');
            return; // Sai da função se o usuário não estiver pronto.
          }

          if (Notification.permission === 'default') {
            console.log('Solicitando permissão para notificações...');
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);
            if (permission !== 'granted') {
              console.log('Permissão para notificações não concedida.');
              return;
            }
          }
          
          if (Notification.permission === 'granted') {
            console.log('Obtendo token FCM para o usuário:', user.uid);
            const currentToken = await getToken(firebaseMessaging, {
              vapidKey: VAPID_KEY,
            });

            if (currentToken) {
              console.log('Token FCM obtido:', currentToken);
              const userDocRef = doc(db, 'users', user.uid);
              await setDoc(userDocRef, { fcmToken: currentToken }, { merge: true });
              console.log('Token FCM salvo no Firestore.');
            } else {
              console.log('Não foi possível obter o token FCM. A permissão foi concedida?');
            }
          }
        } catch (error) {
          console.error('Erro ao obter token FCM:', error);
        }
      };

      requestPermissionAndGetToken();

      const unsubscribe = onMessage(firebaseMessaging, (payload) => {
        console.log('Mensagem recebida em primeiro plano:', payload);
        window.dispatchEvent(new CustomEvent('new-fcm-message', { detail: payload }));
      });

      return () => unsubscribe();
    }
  }, [user]); // Removido `messaging` da dependência para evitar re-execuções desnecessárias

  return { notificationPermission };
}
