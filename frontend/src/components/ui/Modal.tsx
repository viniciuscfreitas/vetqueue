import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
            <div className="bg-white rounded-modal shadow-elev-3 p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-title-1">{title}</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-1 text-3xl leading-none">&times;</button>
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
};

export { Modal };
