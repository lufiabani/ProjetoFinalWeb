// src/components/produtos/ProdutoFormModal.jsx
import { useState, useEffect } from 'react';
import Modal from '../ui/Modal';

function ProdutoFormModal({ isOpen, onClose, produtoEditando, onSalvar }) {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [quantidade, setQuantidade] = useState('');

  // Preenche ou limpa o formulário quando o modal abre
  useEffect(() => {
    if (isOpen) {
      if (produtoEditando) {
        setNome(produtoEditando.nome || '');
        setDescricao(produtoEditando.descricao || '');
        setPreco(produtoEditando.preco?.toString() || '');
        setQuantidade(produtoEditando.quantidade?.toString() || '');
      } else {
        setNome('');
        setDescricao('');
        setPreco('');
        setQuantidade('');
      }
    }
  }, [isOpen, produtoEditando]);

  const handleSubmit = (e) => {
    e.preventDefault();

    const produto = {
      nome,
      descricao,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade),
    };

    if (produtoEditando) {
      produto.id = produtoEditando.id;
    }

    onSalvar(produto);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={produtoEditando ? 'Editar Produto' : 'Novo Produto'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome do Produto
          </label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Notebook Dell XPS 15"
            required
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>

        <div>
          <label htmlFor="descricao" className="block text-sm font-medium text-gray-700 mb-1">
            Descrição <span className="text-gray-400 font-normal">(opcional)</span>
          </label>
          <input
            id="descricao"
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Ex: 16GB RAM, SSD 512GB"
            className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="preco" className="block text-sm font-medium text-gray-700 mb-1">
              Preço (R$)
            </label>
            <input
              id="preco"
              type="number"
              step="0.01"
              min="0"
              value={preco}
              onChange={(e) => setPreco(e.target.value)}
              placeholder="0.00"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade
            </label>
            <input
              id="quantidade"
              type="number"
              min="0"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              required
              className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Botões do formulário */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            {produtoEditando ? 'Atualizar' : 'Cadastrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default ProdutoFormModal;