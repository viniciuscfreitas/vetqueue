import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { API_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import { useImageUpload } from '../hooks/useImageUpload';
import { useToast } from '../hooks/useToast';
import PropertyFormFields from './PropertyFormFields';
import Toast from './Toast';

export default function PropertyDrawer({ isOpen, onClose, propertyId, onSuccess }) {
    const isEditing = !!propertyId;
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const { toast, showToast, hideToast } = useToast();
    const imageUrl = watch('image');

    const handleUploadSuccess = (url) => {
        setValue('image', url);
    };

    const { uploading, uploadImage } = useImageUpload(token, handleUploadSuccess);

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                fetchProperty();
            } else {
                reset({
                    title: '',
                    subtitle: '',
                    price: '',
                    bairro: '',
                    tipo: '',
                    specs: '',
                    tags: '',
                    image: '',
                    featured: false
                });
            }
        }
    }, [isOpen, propertyId]);

    const fetchProperty = async () => {
        try {
            const res = await fetch(`${API_URL}/api/properties/${propertyId}`);
            const data = await res.json();

            if (data.tags && Array.isArray(data.tags)) {
                data.tags = data.tags.join(', ');
            }

            reset(data);
        } catch (error) {
            console.error('Erro ao buscar imóvel:', error);
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            await uploadImage(file);
        } catch (error) {
            showToast(error.message || 'Erro ao fazer upload da imagem. Tente novamente.', 'error');
            e.target.value = '';
        }
    };

    const handleRemoveImage = () => {
        setValue('image', '');
    };

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (data.tags && typeof data.tags === 'string') {
                data.tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
            }

            // Garantir que featured seja boolean
            data.featured = !!data.featured;

            const url = isEditing
                ? `${API_URL}/api/properties/${propertyId}`
                : `${API_URL}/api/properties`;

            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (res.ok) {
                showToast('Imóvel salvo com sucesso!', 'success');
                onSuccess();
                onClose();
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Erro ao salvar imóvel' }));
                showToast(errorData.error || 'Erro ao salvar imóvel', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showToast('Erro ao salvar imóvel', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <div className="fixed inset-0 z-50 overflow-hidden" aria-labelledby="slide-over-title" role="dialog" aria-modal="true">
            <div className="absolute inset-0 overflow-hidden">
                {/* Background overlay */}
                <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} aria-hidden="true"></div>

                <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                    <div className="pointer-events-auto w-screen max-w-md transform transition-transform sm:duration-700">
                        <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-xl">
                            <div className="px-4 py-6 sm:px-6 border-b border-gray-200">
                                <div className="flex items-start justify-between">
                                    <h2 className="text-lg font-medium text-gray-900" id="slide-over-title">
                                        {isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}
                                    </h2>
                                    <div className="ml-3 flex h-7 items-center">
                                        <button
                                            type="button"
                                            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gold focus:ring-offset-2"
                                            onClick={onClose}
                                        >
                                            <span className="sr-only">Fechar painel</span>
                                            <X size={24} aria-hidden="true" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <PropertyFormFields
                                        register={register}
                                        errors={errors}
                                        imageUrl={imageUrl}
                                        uploading={uploading}
                                        onImageUpload={handleImageUpload}
                                        onRemoveImage={handleRemoveImage}
                                        loading={loading}
                                    />
                                    <div className="pt-4 border-t border-gray-200 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium focus:ring-2 focus:ring-gold"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={loading || uploading}
                                            className="btn-primary flex items-center gap-2"
                                        >
                                            {loading ? 'Salvando...' : 'Salvar'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </>
    );
}
