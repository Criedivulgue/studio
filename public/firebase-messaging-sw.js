/*
  Este é o Service Worker para o Firebase Cloud Messaging.
  Ele roda em segundo plano, separado da janela principal do navegador, 
  para receber notificações push mesmo quando a aba do site está fechada.
*/

// Garante que o novo service worker substitua o antigo e assuma o controle rapidamente.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(self.clients.claim());
});

// 1. Importar os scripts do SDK MODULAR (v9+) do Firebase.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js');


// 2. Função de inicialização UNIFICADA E SEGURA
const initializeFirebase = async () => {
  // CORREÇÃO: Usar o namespace firebase.app
  if (firebase.app.getApps().length > 0) {
    return firebase.app.getApp();
  }

  try {
    // Busca a configuração da nossa API segura, assim como o app principal faz.
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Falha ao buscar a configuração do Firebase no Service Worker.');
    }
    const firebaseConfig = await response.json();
    
    console.log('Service Worker: Configuração recebida, inicializando o Firebase...');
    // CORREÇÃO: Usar o namespace firebase.app
    return firebase.app.initializeApp(firebaseConfig);

  } catch (error) {
    console.error('Service Worker: ERRO CRÍTICO ao inicializar o Firebase:', error);
    return null;
  }
};

// 3. Função para configurar o manipulador de mensagens em segundo plano
const setupBackgroundMessageHandler = async () => {
    // Garante que o Firebase esteja inicializado
    const app = await initializeFirebase();
    if (!app) {
        console.log("Service Worker: Falha na inicialização do Firebase, o manipulador de mensagens não será configurado.");
        return;
    }

    console.log("Service Worker: Firebase inicializado, configurando o manipulador de mensagens em segundo plano.");
    // CORREÇÃO: Usar o namespace firebase.messaging
    const messaging = firebase.messaging.getMessaging(app);

    // CORREÇÃO: Usar o namespace firebase.messaging
    firebase.messaging.onBackgroundMessage(messaging, (payload) => {
        console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);

        // Extrai o título e as opções da notificação
        const notificationTitle = payload.notification?.title || 'Nova Mensagem';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: payload.notification?.icon || '/favicon.ico'
        };

        // Exibe a notificação para o usuário
        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// Inicia a configuração do manipulador de mensagens
setupBackgroundMessageHandler();
