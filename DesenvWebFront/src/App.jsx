// App.jsx — rotas do SPA: shell com Layout, redirecionamento da raiz para /inicio.
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import InicioPage from './components/inicio/InicioPage';
import ImportarFilmesPage from './components/importar/ImportarFilmesPage';
import MeusFilmesPage from './components/perfil/MeusFilmesPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<InicioPage />} />
        <Route path="/meus-filmes" element={<MeusFilmesPage />} />
        <Route path="/importar" element={<ImportarFilmesPage />} />
      </Route>
    </Routes>
  );
}

export default App;
