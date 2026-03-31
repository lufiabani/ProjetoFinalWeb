// src/main.jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './contexts/ToastContext';
import { KeycloakProvider } from './contexts/KeycloakContext';
import ToastContainer from './components/ui/ToastContainer';
import App from './App.jsx';
import { createKeycloakClient } from './keycloak';
import './index.css';

const keycloak = createKeycloakClient();

const redirectUri = `${window.location.origin}${window.location.pathname}`;

keycloak
  .init({
    onLoad: 'login-required',
    pkceMethod: 'S256',
    checkLoginIframe: false,
    redirectUri,
  })
  .then((authenticated) => {
    if (!authenticated) return;
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <KeycloakProvider client={keycloak}>
          <BrowserRouter>
            <ToastProvider>
              <App />
              <ToastContainer />
            </ToastProvider>
          </BrowserRouter>
        </KeycloakProvider>
      </StrictMode>,
    );
  })
  .catch((err) => {
    console.error(err);
    const root = document.getElementById('root');
    root.innerHTML = `<div style="font-family:system-ui;padding:2rem;color:#b91c1c">Falha ao iniciar o Keycloak (URL: ${import.meta.env.VITE_KEYCLOAK_URL}). Confirme que o Docker está a correr e abra a consola.</div>`;
  });
