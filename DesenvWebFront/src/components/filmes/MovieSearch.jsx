import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Loader2, Library } from 'lucide-react';
import { buscarFilmesLocais } from '../../services/filmesService';
import { posterUrl } from '../../services/tmdb';

function useDebouncedValue(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export default function MovieSearch() {
  const [q, setQ] = useState('');
  const debounced = useDebouncedValue(q, 380);
  const [aberto, setAberto] = useState(false);
  const [aCarregar, setACarregar] = useState(false);
  const [resultados, setResultados] = useState([]);
  const [erro, setErro] = useState(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  useEffect(() => {
    // Mesmo critério que a API: trim — evita pedir "a " (2 chars) e receber 400 porque o servidor exige 2+ após trim
    const termo = debounced.trim();
    if (termo.length < 2) {
      setResultados([]);
      setErro(null);
      setACarregar(false);
      return;
    }

    let cancelado = false;
    (async () => {
      setACarregar(true);
      setErro(null);
      try {
        const loc = await buscarFilmesLocais(termo);
        if (cancelado) return;
        setResultados(Array.isArray(loc) ? loc : []);
      } catch (e) {
        if (cancelado) return;
        const msg = e.response?.data?.mensagem ?? e.message ?? 'Erro na pesquisa';
        setErro(typeof msg === 'string' ? msg : JSON.stringify(msg));
        setResultados([]);
      } finally {
        if (!cancelado) setACarregar(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [debounced]);

  const termoPainel = q.trim();
  const termoDebounced = debounced.trim();

  const irParaFilme = useCallback((filmeId) => {
    setAberto(false);
    setQ('');
    requestAnimationFrame(() => {
      document.getElementById(`filme-${filmeId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }, []);

  const mostrarPainel = aberto && termoPainel.length >= 2;

  return (
    <div ref={wrapRef} className="relative w-full">
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 focus-within:border-fuchsia-400 focus-within:ring-2 focus-within:ring-fuchsia-500/20">
        <Search className="w-4 h-4 flex-shrink-0 text-slate-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setAberto(true);
          }}
          onFocus={() => setAberto(true)}
          placeholder="Procurar na base de filmes…"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 outline-none"
          autoComplete="off"
        />
        {aCarregar ? <Loader2 className="w-4 h-4 animate-spin text-fuchsia-500" /> : null}
      </div>

      {mostrarPainel ? (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[min(70vh,420px)] w-full min-w-0 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-xl sm:left-auto sm:right-0 sm:min-w-[280px] sm:max-w-[min(100vw-2rem,28rem)]">
          {erro ? <p className="px-4 py-3 text-sm text-red-600">{erro}</p> : null}
          {!aCarregar && !erro && resultados.length === 0 && termoDebounced.length >= 2 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500">
              Nenhum filme na base com esse nome. Só aparecem títulos já sincronizados na plataforma.
            </p>
          ) : null}

          {resultados.length > 0 ? (
            <div className="px-2 pb-2">
              <p className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                <Library className="w-3.5 h-3.5" />
                Na comunidade
              </p>
              <ul className="space-y-1">
                {resultados.map((f) => (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => irParaFilme(f.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
                    >
                      <div className="h-12 w-8 flex-shrink-0 overflow-hidden rounded bg-slate-200">
                        {f.posterPath ? (
                          <img
                            src={posterUrl(f.posterPath, 'w92')}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : null}
                      </div>
                      <span className="truncate text-sm font-medium text-slate-800">{f.titulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
