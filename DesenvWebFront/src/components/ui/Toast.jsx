// src/components/ui/Toast.jsx
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

const config = {
  success: {
    icon: CheckCircle,
    bg: 'bg-green-50 border-green-400',
    text: 'text-green-800',
    iconColor: 'text-green-500',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-50 border-red-400',
    text: 'text-red-800',
    iconColor: 'text-red-500',
  },
  info: {
    icon: Info,
    bg: 'bg-blue-50 border-blue-400',
    text: 'text-blue-800',
    iconColor: 'text-blue-500',
  },
};

function Toast({ type, message, onClose }) {
  const { icon: Icon, bg, text, iconColor } = config[type] || config.info;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border-l-4 shadow-lg ${bg} animate-slide-in`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
      <span className={`flex-1 text-sm font-medium ${text}`}>{message}</span>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Toast;