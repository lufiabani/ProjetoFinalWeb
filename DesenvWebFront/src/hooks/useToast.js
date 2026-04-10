// src/hooks/useToast.js
// Encapsula React Toastify para manter o mesmo hook nos componentes (padrão do .cursorrules).
import { useCallback } from 'react';
import { toast } from 'react-toastify';

export function useToast() {
  const success = useCallback((msg) => toast.success(msg), []);
  const error = useCallback((msg) => toast.error(msg), []);
  const info = useCallback((msg) => toast.info(msg), []);

  return { success, error, info };
}
