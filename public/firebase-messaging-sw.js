
// Scripts de importação para o Firebase Service Worker (sintaxe de compatibilidade)
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// A configuração do Firebase que você já tinha.
const firebaseConfig = {
  apiKey: "AIzaSyB3qOq0uWY2DnmmN08A6L8Gn0_qYvfIatI",
  authDomain: "omniflow-ai-mviw9.firebaseapp.com",
  projectId: "omniflow-ai-mviw9",
  storageBucket: "omniflow-ai-mviw9.appspot.com",
  messagingSenderId: "904294888593",
  appId: "1:904294888593:web:2b8ad0686d59f65d07bb30"
};

// Inicializa o Firebase usando a API de compatibilidade.
firebase.initializeApp(firebaseConfig);

// Obtém a instância do Messaging para lidar com mensagens em segundo plano.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ',
    payload
  );

  // Extrai o título e as opções da notificação do payload.
  const notificationTitle = payload.notification.title || 'Nova Mensagem';
  const notificationOptions = {
    body: payload.notification.body || 'Você tem uma nova mensagem.',
    icon: '/favicon.ico' // Ícone padrão
  };

  // Mostra a notificação usando a API do Service Worker.
  self.registration.showNotification(notificationTitle, notificationOptions);
});
