import { useEffect } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

// Toast simples - Grug gosta: direto, sem complexidade
export default function Toast({ message, type = 'info', onClose, duration = 4000 }) {
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(onClose, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle size={20} className="text-green-600" />,
        error: <AlertCircle size={20} className="text-red-600" />,
        info: <AlertCircle size={20} className="text-blue-600" />
    };

    const styles = {
        success: 'bg-green-50 border-green-200 text-green-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800'
    };

    return (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg min-w-[300px] max-w-md ${styles[type]}`} role="alert">
            {icons[type]}
            <p className="flex-1 text-sm font-medium">{message}</p>
            <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded"
                aria-label="Fechar notificação"
            >
                <X size={18} />
            </button>
        </div>
    );
}

