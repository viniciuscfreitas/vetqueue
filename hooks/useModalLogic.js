import { useEffect, useRef, useState } from 'react';
import { CONSTANTS } from '../data/constants.js';

/**
 * Hook para gerenciar lógica de modais (timed, exit-intent, gate)
 * Grug gosta: lógica complexa de modal isolada em um lugar só
 * 
 * Comportamento:
 * - Abre modal após 20s sem interação (timed)
 * - Abre modal quando mouse sai da página (exit-intent)
 * - Pode ser aberto manualmente (gate)
 * 
 * @returns {{
 *   modalState: {isOpen: boolean, type: 'gate'|'timed'|'exit'},
 *   openModal: (type: 'gate'|'timed'|'exit') => void,
 *   closeModal: () => void
 * }}
 */
export const useModalLogic = () => {
  const [modalState, setModalState] = useState({ isOpen: false, type: 'gate' });
  const hasInteractedRef = useRef(false);
  const timerStartedRef = useRef(false);

  const openModal = (type) => {
    setModalState({ isOpen: true, type });
    hasInteractedRef.current = true;
  };

  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    hasInteractedRef.current = true;
  };

  useEffect(() => {
    if (timerStartedRef.current || hasInteractedRef.current) return;
    timerStartedRef.current = true;

    const timer = setTimeout(() => {
      if (!hasInteractedRef.current && !modalState.isOpen) {
        setModalState({ isOpen: true, type: 'timed' });
      }
    }, CONSTANTS.MODAL_TIMEOUT_MS);

    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !hasInteractedRef.current && !modalState.isOpen) {
        setModalState({ isOpen: true, type: 'exit' });
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { modalState, openModal, closeModal };
};
