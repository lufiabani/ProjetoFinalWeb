import { useEffect, useState } from 'react';
import { api } from '../../services/api';

export default function InicioPage() {
  const [perfil, setPerfil] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await api.get('/usuarios/me');
        if (ativo) setPerfil(data);
      } catch (e) {
        const msg =
          e.response?.data?.title ??
          e.response?.data?.mensagem ??
          e.response?.data ??
          e.message;
        if (ativo) setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
      } finally {
        if (ativo) setCarregando(false);
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (carregando) {
    return (
      <div className="p-8 text-gray-600">
        A sincronizar o perfil com a API…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="p-8 text-red-600">
        Não foi possível obter <code className="bg-red-50 px-1 rounded">/api/usuarios/me</code>
        : {erro}
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Filmoteca</h1>
      <p className="text-gray-600 mb-4">
        Sessão Keycloak ativa. Perfil correspondente na base PostgreSQL:
      </p>
      <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm overflow-auto">
        {JSON.stringify(perfil, null, 2)}
      </pre>
    </div>
  );
}
