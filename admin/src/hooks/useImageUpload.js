import { useState } from 'react';
import { API_URL } from '../config';

// Hook simples para upload de imagem - Grug gosta: direto e funcional
export function useImageUpload(token, onSuccess) {
    const [uploading, setUploading] = useState(false);

    const validateFile = (file) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return { valid: false, error: 'Formato não permitido. Use JPG, PNG ou WEBP.' };
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            return { valid: false, error: 'Imagem muito grande. Tamanho máximo: 5MB.' };
        }

        return { valid: true };
    };

    const uploadImage = async (file) => {
        const validation = validateFile(file);
        if (!validation.valid) {
            throw new Error(validation.error);
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('image', file);

        try {
            const res = await fetch(`${API_URL}/api/upload`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'Falha no upload' }));
                throw new Error(errorData.error || 'Falha no upload');
            }

            const data = await res.json();
            if (onSuccess) onSuccess(data.url);
            return data.url;
        } finally {
            setUploading(false);
        }
    };

    return { uploading, uploadImage, validateFile };
}

