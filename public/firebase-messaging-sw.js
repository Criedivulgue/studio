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
  if (firebase.app.getApps().length > 0) {
    return firebase.app.getApp();
  }

  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Falha ao buscar a configuração do Firebase no Service Worker.');
    }
    const firebaseConfig = await response.json();
    
    console.log('Service Worker: Configuração recebida, inicializando o Firebase...');
    return firebase.app.initializeApp(firebaseConfig);

  } catch (error) {
    console.error('Service Worker: ERRO CRÍTICO ao inicializar o Firebase:', error);
    return null;
  }
};

// 3. Função para configurar o manipulador de mensagens em segundo plano
const setupBackgroundMessageHandler = async () => {
    const app = await initializeFirebase();
    if (!app) {
        console.log("Service Worker: Falha na inicialização do Firebase, o manipulador de mensagens não será configurado.");
        return;
    }

    console.log("Service Worker: Firebase inicializado, configurando o manipulador de mensagens em segundo plano.");
    const messaging = firebase.messaging.getMessaging(app);

    firebase.messaging.onBackgroundMessage(messaging, (payload) => {
        console.log('[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ', payload);

        const notificationTitle = payload.notification?.title || 'Nova Mensagem';
        const notificationOptions = {
            body: payload.notification?.body || '',
            icon: payload.notification?.icon || '/favicon.ico',
            // CORREÇÃO: Armazena a URL do campo 'data' na própria notificação
            data: { 
              url: payload.data?.url || '/' 
            }
        };

        self.registration.showNotification(notificationTitle, notificationOptions);
    });
}

// 4. CORREÇÃO: Adiciona o event listener para o clique na notificação
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada!');
  
  // Fecha a notificação que foi clicada
  event.notification.close();

  // Obtém a URL que foi armazenada no campo 'data'
  const urlToOpen = event.notification.data.url;

  // Abre a URL em uma nova aba ou foca em uma já existente
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Se uma janela com a mesma URL já estiver aberta, foque nela.
      for (const client of clientList) {
        // Extrai o pathname para comparar, ignorando a origem
        const clientPath = new URL(client.url).pathname;
        const targetPath = new URL(urlToOpen, self.location.origin).pathname;

        if (clientPath === targetPath && 'focus' in client) {
          return client.focus();
        }
      }
      // Se nenhuma janela correspondente for encontrada, abra uma nova.
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});


// Inicia a configuração do manipulador de mensagens
setupBackgroundMessageHandler();
