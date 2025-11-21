import { X, AlertTriangle } from 'lucide-react';

/**
 * Modal de confirmação simples
 * Grug gosta: componente direto, sem abstração complexa
 */
export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirmar', cancelText = 'Cancelar', variant = 'danger' }) {
    if (!isOpen) return null;

    const variantStyles = {
        danger: {
            button: 'bg-red-600 hover:bg-red-700 text-white',
            icon: 'text-red-600',
            border: 'border-red-200'
        },
        warning: {
            button: 'bg-yellow-600 hover:bg-yellow-700 text-white',
            icon: 'text-yellow-600',
            border: 'border-yellow-200'
        }
    };

    const styles = variantStyles[variant] || variantStyles.danger;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Fechar"
                >
                    <X size={20} aria-hidden="true" />
                </button>

                <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-full ${styles.icon}/10 border ${styles.border} flex-shrink-0`}>
                        <AlertTriangle size={24} className={styles.icon} aria-hidden="true" />
                    </div>

                    <div className="flex-1 pt-1">
                        <h3 id="confirm-title" className="text-xl font-bold text-primary mb-2">
                            {title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                            {message}
                        </p>
                    </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            onClose();
                        }}
                        className={`px-4 py-2 ${styles.button} rounded-lg font-medium transition-colors`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
