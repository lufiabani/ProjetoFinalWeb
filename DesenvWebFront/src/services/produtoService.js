// src/services/produtoService.js
import axios from 'axios';

// ATENÇÃO: substitua a porta abaixo pela porta onde a SUA API está rodando.
// Verifique o terminal do dotnet run para confirmar.
const API_URL = 'http://localhost:5113/api/produtos';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProdutos = async () => {
  const response = await api.get('/');
  return response.data;
};

export const getProduto = async (id) => {
  const response = await api.get(`/${id}`);
  return response.data;
};

export const criarProduto = async (produto) => {
  const response = await api.post('/', produto);
  return response.data;
};

export const atualizarProduto = async (produto) => {
  const response = await api.put(`/${produto.id}`, produto);
  return response.data;
};

export const deletarProduto = async (id) => {
  const response = await api.delete(`/${id}`);
  return response.data;
};