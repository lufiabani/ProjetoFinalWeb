// src/components/ui/ToastContainer.jsx
import { useToast } from '../../hooks/useToast';
import Toast from './Toast';

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed left-3 right-3 top-3 z-[60] flex max-w-md flex-col gap-2 sm:left-auto sm:right-4 sm:top-4 sm:w-80 sm:max-w-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          type={toast.type}
          message={toast.message}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}

export default ToastContainer;