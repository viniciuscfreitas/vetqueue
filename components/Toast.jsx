import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export const Toast = ({ message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 transform -translate-x-1/2 bg-[#0f172a] text-white px-6 py-3 rounded-full shadow-2xl z-[70] flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
      <CheckCircle className="text-[#d4af37]" size={20} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
};

