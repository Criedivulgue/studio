
import { useState, useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { doc, setDoc, arrayUnion } from 'firebase/firestore'; // Importa arrayUnion
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase'; 
import { useAuth } from './use-auth';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export function useFirebaseMessaging() {
  const { user } = useAuth();
  const [messaging, setMessaging] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState(null);

  useEffect(() => {
    const initializeFirebase = async () => {
      await ensureFirebaseInitialized();
      const { messaging: firebaseMessaging } = getFirebaseInstances();
      setMessaging(firebaseMessaging);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
      }
    };

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      initializeFirebase();
    }
  }, []);

  useEffect(() => {
    if (!messaging || !user || !user.uid) {
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
          console.log('Obtendo token FCM para o usuário:', user.uid);
          const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });

          if (currentToken) {
            console.log('Token FCM obtido:', currentToken);
            const { db } = getFirebaseInstances(); 
            const userDocRef = doc(db, 'users', user.uid);
            
            // CORREÇÃO: Usa arrayUnion para adicionar o token ao array 'fcmTokens'
            await setDoc(userDocRef, { fcmTokens: arrayUnion(currentToken) }, { merge: true });
            
            console.log('Token FCM salvo/atualizado no Firestore no formato de array.');
          } else {
            console.log('Não foi possível obter o token FCM.');
          }
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
