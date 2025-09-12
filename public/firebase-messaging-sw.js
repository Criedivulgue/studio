self.addEventListener('install', (event) => {
  self.skipWaiting(); // Garante que o novo service worker ative imediatamente
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim()); // Torna o service worker ativo o controlador da página imediatamente
});

// Importa os scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.1/firebase-messaging-compat.js');

// Variável para guardar a configuração do Firebase
let firebaseConfig = null;

// Função para buscar a configuração do servidor
const fetchFirebaseConfig = async () => {
  try {
    // O caminho é relativo à origem do site
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      throw new Error('Failed to fetch Firebase config');
    }
    firebaseConfig = await response.json();
  } catch (error) {
    console.error('Error fetching Firebase config:', error);
    return null;
  }
};

// Função de inicialização do Firebase
const initializeFirebase = async () => {
  if (!firebaseConfig) {
    await fetchFirebaseConfig();
  }

  if (firebaseConfig && firebase.apps.length === 0) {
    console.log('Service Worker: Initializing Firebase with fetched config.');
    firebase.initializeApp(firebaseConfig);
    const messaging = firebase.messaging();

    messaging.onBackgroundMessage((payload) => {
      console.log(
        '[firebase-messaging-sw.js] Received background message ',
        payload
      );
      // TODO: Customize notification here
      const notificationTitle = payload.notification.title || 'Nova Mensagem';
      const notificationOptions = {
        body: payload.notification.body || '',
        icon: payload.notification.icon || '/firebase-logo.png',
      };

      self.registration.showNotification(notificationTitle, notificationOptions);
    });
  } else {
    console.log('Service Worker: Firebase already initialized or config fetch failed.');
  }
};

// Inicializa o Firebase ao carregar o script
initializeFirebase();
