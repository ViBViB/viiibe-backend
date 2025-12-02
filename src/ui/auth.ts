import { showView } from './views';

let isAuthInProgress = false;

export function startAuthFlow() {
  // Prevenir múltiples llamadas simultáneas
  if (isAuthInProgress) {
    console.log('Auth already in progress, skipping...');
    return;
  }

  isAuthInProgress = true;

  // Generate unique session ID
  const sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  console.log('Starting auth flow with sessionId:', sessionId);

  // Show connecting screen
  showView('authorization');

  // Tell code.js to open the auth window
  parent.postMessage(
    {
      pluginMessage: {
        type: 'connect-pinterest',
        sessionId: sessionId
      }
    },
    '*'
  );

  // Start polling for the token
  pollForToken(sessionId);
}

function pollForToken(sessionId: string) {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(
        `https://viiibe-backend.vercel.app/api/check-auth?state=${sessionId}`
      );

      const data = await response.json();

      console.log('Polling response:', data);

      if (data.ready && data.token) {
        clearInterval(pollInterval);
        isAuthInProgress = false;

        // Save token
        parent.postMessage(
          {
            pluginMessage: {
              type: 'token-received',
              token: data.token
            }
          },
          '*'
        );

        console.log('Auth successful! Token received.');

        // ELIMINADO: showView('search');
        // El plugin (code.js) enviará el mensaje 'show-view' cuando guarde el token
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, 2000);

  // Stop polling after 5 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
    isAuthInProgress = false;
    console.log('Polling timeout');
  }, 300000);
}