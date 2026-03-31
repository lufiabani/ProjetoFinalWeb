// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import InicioPage from './components/inicio/InicioPage';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Navigate to="/inicio" replace />} />
        <Route path="/inicio" element={<InicioPage />} />
      </Route>
    </Routes>
  );
}

export default App;
