// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProdutosPage from './components/produtos/ProdutosPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/produtos" replace />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        {/* Leva 3: rotas para Categorias e Detalhes */}
        {/* <Route path="/categorias" element={<CategoriasPage />} /> */}
        {/* <Route path="/detalhes" element={<DetalheProdutoPage />} /> */}
      </Route>
    </Routes>
  );
}

export default App;