// main.jsx — arranque: Keycloak (login obrigatório) antes de montar React, Router e notificações.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import App from './App.jsx';
import { createKeycloakClient } from './keycloak';
import 'react-toastify/dist/ReactToastify.css';
import './index.css';

const keycloak = createKeycloakClient();

// redirectUri estável evita mismatch com o client configurado no Keycloak (SPA).
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
          <BrowserRouter>
            <App />
            <ToastContainer position="top-right" autoClose={3000} />
          </BrowserRouter>
      </StrictMode>,
    );
  })
  .catch((err) => {
    console.error(err);
    const root = document.getElementById('root');
    // Mensagem visível quando o realm/client não responde (ex.: stack Docker parada).
    root.innerHTML = `<div style="font-family:system-ui;padding:2rem;color:#b91c1c">Falha ao iniciar o Keycloak (URL: ${import.meta.env.VITE_KEYCLOAK_URL}). Confirme que o Docker está a correr e abra a consola.</div>`;
  });
