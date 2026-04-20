// BrandLogo.jsx — imagem em public/cataneo-logo.png (object-contain para marcas largas ou altas).
import { useState } from 'react';
import { Film } from 'lucide-react';

const LOGO_SRC = '/cataneo-logo.png';

export default function BrandLogo({ className = 'h-10 w-10', roundedClassName = 'rounded-xl' }) {
  const [mostrarFallback, setMostrarFallback] = useState(false);

  if (mostrarFallback) {
    return (
      <div
        className={`flex flex-shrink-0 items-center justify-center bg-gradient-to-br from-rose-500 to-fuchsia-600 text-white ${roundedClassName} ${className}`}
      >
        <Film className="h-5 w-5" />
      </div>
    );
  }

  return (
    <img
      src={LOGO_SRC}
      alt="CataneoFilmes"
      decoding="async"
      onError={() => setMostrarFallback(true)}
      className={`flex-shrink-0 object-contain ${roundedClassName} ${className}`}
    />
  );
}
