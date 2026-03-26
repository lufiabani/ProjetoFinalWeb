// src/components/produtos/ProdutoDeleteDialog.jsx
import ConfirmDialog from '../ui/ConfirmDialog';

function ProdutoDeleteDialog({ isOpen, onClose, onConfirm, produto }) {
  return (
    <ConfirmDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title="Deletar Produto"
      message={
        produto
          ? `Tem certeza que deseja excluir o produto "${produto.nome}"? Esta ação não pode ser desfeita.`
          : ''
      }
    />
  );
}

export default ProdutoDeleteDialog;