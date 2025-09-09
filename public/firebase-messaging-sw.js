
// Importa os scripts do Firebase necessários para o service worker.
// Usar `importScripts` é a maneira padrão de carregar dependências em um Service Worker.
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.15.0/firebase-messaging-compat.js');

// INÍCIO: Configuração do Firebase com chaves estáticas
// Estas chaves foram copiadas diretamente do seu arquivo `src/lib/firebase.ts`.
// O Service Worker não tem acesso ao `process.env`, então as chaves devem ser explícitas.
const firebaseConfig = {
  apiKey: "AIzaSyB3qOq0uWY2DnmmN08A6L8Gn0_qYvfIatI",
  authDomain: "omniflow-ai-mviw9.firebaseapp.com",
  projectId: "omniflow-ai-mviw9",
  storageBucket: "omniflow-ai-mviw9.firebasestorage.app",
  messagingSenderId: "904294888593",
  appId: "1:904294888593:web:2b8ad0686d59f65d07bb30"
};
// FIM: Configuração do Firebase

// Inicializa o Firebase no escopo do service worker.
firebase.initializeApp(firebaseConfig);

// Obtém uma instância do Firebase Messaging para lidar com mensagens em segundo plano.
const messaging = firebase.messaging();

// Adiciona um manipulador para quando uma mensagem push é recebida enquanto 
// o aplicativo está em segundo plano ou fechado.
// Isso permite que você mostre uma notificação ao usuário.
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Mensagem recebida em segundo plano: ',
    payload,
  );

  // O `payload` contém a notificação enviada pelo seu servidor.
  // Você pode usar esses dados para construir a notificação que será exibida.
  const notificationTitle = payload.notification.title || 'Nova Mensagem';
  const notificationOptions = {
    body: payload.notification.body || 'Você tem uma nova mensagem.',
    icon: '/favicon.ico' // Ícone que aparecerá na notificação
  };

  // `self.registration.showNotification` é a API do navegador para exibir a notificação.
  self.registration.showNotification(notificationTitle, notificationOptions);
});
