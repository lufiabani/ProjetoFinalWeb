/* eslint-disable react-refresh/only-export-components -- hook exportado junto do provider (padrão do projeto) */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { adicionarFavorito, listarFavoritos, removerFavorito } from '../services/favoritosService';

const FavoritosContext = createContext(null);

export function FavoritosProvider({ children }) {
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    setErro(null);
    try {
      const data = await listarFavoritos();
      setLista(Array.isArray(data) ? data : []);
    } catch (e) {
      const msg =
        e.response?.data?.mensagem ??
        e.response?.data?.title ??
        e.message ??
        'Falha ao carregar favoritos';
      setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
      setLista([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const idsPorFilme = useMemo(() => {
    const m = new Map();
    lista.forEach((item) => {
      const fid = item.filme?.id;
      if (fid != null) m.set(fid, item.favoritoId);
    });
    return m;
  }, [lista]);

  const isFavorito = useCallback((filmeId) => idsPorFilme.has(filmeId), [idsPorFilme]);

  const alternar = useCallback(
    async (filmeId) => {
      if (idsPorFilme.has(filmeId)) {
        await removerFavorito(filmeId);
      } else {
        await adicionarFavorito(filmeId);
      }
      await recarregar();
    },
    [idsPorFilme, recarregar],
  );

  const value = useMemo(
    () => ({
      lista,
      carregando,
      erro,
      recarregar,
      isFavorito,
      alternar,
    }),
    [lista, carregando, erro, recarregar, isFavorito, alternar],
  );

  return <FavoritosContext.Provider value={value}>{children}</FavoritosContext.Provider>;
}

export function useFavoritos() {
  const ctx = useContext(FavoritosContext);
  if (!ctx) throw new Error('useFavoritos deve estar dentro de FavoritosProvider');
  return ctx;
}
