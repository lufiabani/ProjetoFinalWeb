import Keycloak from 'keycloak-js';

let client;

function normalizarUrlKeycloak(url) {
  return String(url ?? 'http://localhost:8080').replace(/\/+$/, '');
}

export function createKeycloakClient() {
  client = new Keycloak({
    url: normalizarUrlKeycloak(import.meta.env.VITE_KEYCLOAK_URL),
    realm: import.meta.env.VITE_KEYCLOAK_REALM ?? 'desenvweb',
    clientId: import.meta.env.VITE_KEYCLOAK_CLIENT_ID ?? 'desenvweb-spa',
  });
  return client;
}

export function getKeycloak() {
  return client;
}
