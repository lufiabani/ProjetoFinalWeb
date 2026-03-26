// src/components/produtos/ProdutosPage.jsx
import { useState, useEffect } from 'react';
import { Plus, RefreshCw, ShoppingCart } from 'lucide-react';
import {
  getProdutos,
  criarProduto,
  atualizarProduto,
  deletarProduto,
} from '../../services/produtoService';
import { useToast } from '../../hooks/useToast';
import ProdutoTable from './ProdutoTable';
import ProdutoFormModal from './ProdutoFormModal';
import ProdutoDeleteDialog from './ProdutoDeleteDialog';

function ProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Controle dos modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [produtoDeletando, setProdutoDeletando] = useState(null);

  const toast = useToast();

  // Carrega produtos ao montar o componente
  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      const data = await getProdutos();
      setProdutos(data);
    } catch (error) {
      toast.error('Não foi possível carregar os produtos. Verifique se a API está rodando.');
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Abre o modal para criar novo produto
  const handleNovo = () => {
    setProdutoEditando(null);
    setIsFormModalOpen(true);
  };

  // Abre o modal para editar um produto existente
  const handleEditar = (produto) => {
    setProdutoEditando(produto);
    setIsFormModalOpen(true);
  };

  // Salva (cria ou atualiza) um produto
  const handleSalvar = async (produto) => {
    try {
      if (produtoEditando) {
        await atualizarProduto(produto);
        toast.success(`Produto "${produto.nome}" atualizado com sucesso!`);
      } else {
        await criarProduto(produto);
        toast.success(`Produto "${produto.nome}" cadastrado com sucesso!`);
      }
      setIsFormModalOpen(false);
      setProdutoEditando(null);
      await carregarProdutos();
    } catch (error) {
      toast.error('Erro ao salvar o produto. Verifique os dados e tente novamente.');
      console.error('Erro ao salvar:', error);
    }
  };

  // Abre o diálogo de confirmação para deletar
  const handleConfirmarDelete = (produto) => {
    setProdutoDeletando(produto);
    setIsDeleteDialogOpen(true);
  };

  // Executa a deleção após confirmação
  const handleDeletar = async () => {
    try {
      await deletarProduto(produtoDeletando.id);
      toast.success(`Produto "${produtoDeletando.nome}" removido com sucesso!`);
      setIsDeleteDialogOpen(false);
      setProdutoDeletando(null);
      await carregarProdutos();
    } catch (error) {
      toast.error('Erro ao deletar o produto.');
      console.error('Erro ao deletar:', error);
    }
  };

  return (
    <div className="p-6">
      {/* Header da página */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">Produtos</h1>
            <p className="text-sm text-gray-500">
              {produtos.length}{' '}
              {produtos.length === 1 ? 'produto cadastrado' : 'produtos cadastrados'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={carregarProdutos}
            title="Recarregar lista"
            className="p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleNovo}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Novo Produto
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
          <span className="ml-3 text-gray-500">Carregando produtos...</span>
        </div>
      ) : (
        <ProdutoTable
          produtos={produtos}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEditar={handleEditar}
          onDeletar={handleConfirmarDelete}
        />
      )}

      {/* Modal de formulário (criar/editar) */}
      <ProdutoFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setProdutoEditando(null);
        }}
        produtoEditando={produtoEditando}
        onSalvar={handleSalvar}
      />

      {/* Diálogo de confirmação de exclusão */}
      <ProdutoDeleteDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => {
          setIsDeleteDialogOpen(false);
          setProdutoDeletando(null);
        }}
        onConfirm={handleDeletar}
        produto={produtoDeletando}
      />
    </div>
  );
}

export default ProdutosPage;