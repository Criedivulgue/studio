
import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Verifique se o caminho para o firebase está correto
import { useAuth } from './use-auth'; // Hook de autenticação que já usamos

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFirebaseMessaging() {
  const { user } = useAuth();
  const [messaging, setMessaging] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);

  useEffect(() => {
    // Este código só roda no navegador
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const firebaseMessaging = getMessaging();
      setMessaging(firebaseMessaging);

      // 1. Verifica a permissão atual
      setNotificationPermission(Notification.permission);

      // 2. Lógica para solicitar permissão e obter o token
      const requestPermissionAndGetToken = async () => {
        try {
          if (Notification.permission === 'default') {
            console.log('Solicitando permissão para notificações...');
            const permission = await Notification.requestPermission();
            setNotificationPermission(permission);

            if (permission !== 'granted') {
              console.log('Permissão para notificações não concedida.');
              return;
            }
          }
          
          if (Notification.permission === 'granted' && user) {
            console.log('Obtendo token FCM...');
            const currentToken = await getToken(firebaseMessaging, {
              vapidKey: VAPID_KEY,
            });

            if (currentToken) {
              console.log('Token FCM obtido:', currentToken);
              // 3. Salva o token no documento do usuário no Firestore
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

      // 4. Lida com mensagens recebidas enquanto o app está em primeiro plano
      const unsubscribe = onMessage(firebaseMessaging, (payload) => {
        console.log('Mensagem recebida em primeiro plano:', payload);
        // Aqui podemos acionar um toast, um som, ou o "sininho" que o senhor mencionou
        // Por enquanto, apenas logamos no console.
        // Disparar um evento customizado para o sininho ouvir
        window.dispatchEvent(new CustomEvent('new-fcm-message', { detail: payload }));
      });

      return () => unsubscribe();

    } 
  }, [user, messaging]);

  return { notificationPermission };
}
