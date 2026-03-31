import { createContext, useContext } from 'react';

const KeycloakContext = createContext(null);

export function KeycloakProvider({ client, children }) {
  return (
    <KeycloakContext.Provider value={client}>{children}</KeycloakContext.Provider>
  );
}

export function useKeycloakContext() {
  const kc = useContext(KeycloakContext);
  if (!kc) {
    throw new Error('useKeycloakContext deve ser usado dentro de KeycloakProvider');
  }
  return kc;
}
