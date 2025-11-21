import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Star, Upload, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { useImageUpload } from '../hooks/useImageUpload';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

export default function PropertyForm() {
    const { id } = useParams();
    const isEditing = !!id;
    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm();
    const navigate = useNavigate();
    const { token } = useAuth();
    const [loading, setLoading] = useState(false);
    const { toast, showToast, hideToast } = useToast();
    const imageUrl = watch('image');

    const handleUploadSuccess = (url) => {
        setValue('image', url);
    };

    const { uploading, uploadImage } = useImageUpload(token, handleUploadSuccess);

    useEffect(() => {
        if (isEditing) {
            fetchProperty();
        }
    }, [id]);

    const fetchProperty = async () => {
        try {
            const res = await fetch(`${API_URL}/api/properties/${id}`);
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

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            if (data.tags && typeof data.tags === 'string') {
                data.tags = data.tags.split(',').map(t => t.trim()).filter(t => t);
            }

            // Garantir que featured seja boolean
            data.featured = !!data.featured;

            const url = isEditing
                ? `${API_URL}/api/properties/${id}`
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
                setTimeout(() => navigate('/'), 1000);
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

    return (
        <div className="min-h-screen bg-background pb-12">
            <nav className="bg-white shadow-sm border-b border-gray-200 mb-8" aria-label="Navegação do formulário">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16">
                        <Link to="/" className="text-gray-600 hover:text-primary flex items-center gap-2 focus:ring-2 focus:ring-gold rounded-lg px-2 py-1">
                            <ArrowLeft size={20} aria-hidden="true" />
                            Voltar para Dashboard
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h1 className="text-2xl font-bold text-primary font-serif">
                            {isEditing ? 'Editar Imóvel' : 'Novo Imóvel'}
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6" noValidate>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Upload de Imagem - Destaque */}
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2" id="image-label">Imagem Principal *</label>

                                <div className="flex items-start gap-6" role="group" aria-labelledby="image-label">
                                    {imageUrl ? (
                                        <div className="relative w-64 h-40 rounded-lg overflow-hidden border border-gray-200 group">
                                            <img src={imageUrl} alt="Preview da imagem do imóvel" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setValue('image', '')}
                                                className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:ring-2 focus:ring-white"
                                                title="Remover imagem"
                                                aria-label="Remover imagem selecionada"
                                            >
                                                <X size={16} aria-hidden="true" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-64 h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 bg-gray-50" aria-hidden="true">
                                            <Upload size={32} className="mb-2" />
                                            <span className="text-sm">Nenhuma imagem</span>
                                        </div>
                                    )}

                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                            id="image-upload"
                                            disabled={uploading}
                                            aria-describedby={errors.image ? "image-error" : "image-help"}
                                        />
                                        <label
                                            htmlFor="image-upload"
                                            className={`inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-gold ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            tabIndex="0"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    document.getElementById('image-upload').click();
                                                }
                                            }}
                                        >
                                            <Upload size={18} aria-hidden="true" />
                                            {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                                        </label>
                                        <p id="image-help" className="text-xs text-gray-500 mt-2">
                                            Formatos aceitos: JPG, PNG, WEBP. Máx: 5MB.
                                        </p>
                                        {/* Campo oculto para armazenar a URL */}
                                        <input type="hidden" {...register('image', { required: 'Imagem é obrigatória' })} />
                                        {errors.image && <p id="image-error" className="text-red-600 text-xs mt-1" role="alert">{errors.image.message}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Título do Imóvel *</label>
                                <input
                                    id="title"
                                    {...register('title', { required: 'Título é obrigatório' })}
                                    className="input-field"
                                    placeholder="Ex: Cobertura Duplex Gonzaga"
                                    aria-invalid={errors.title ? "true" : "false"}
                                    aria-describedby={errors.title ? "title-error" : undefined}
                                />
                                {errors.title && <span id="title-error" className="text-red-600 text-xs mt-1 block" role="alert">{errors.title.message}</span>}
                            </div>

                            <div className="col-span-2">
                                <label htmlFor="subtitle" className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                                <input
                                    id="subtitle"
                                    {...register('subtitle')}
                                    className="input-field"
                                    placeholder="Ex: A vista mais exclusiva do bairro"
                                />
                            </div>

                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                                <input
                                    id="price"
                                    {...register('price', { required: 'Preço é obrigatório' })}
                                    className="input-field"
                                    placeholder="Ex: R$ 3.500.000"
                                    aria-invalid={errors.price ? "true" : "false"}
                                    aria-describedby={errors.price ? "price-error" : undefined}
                                />
                                {errors.price && <span id="price-error" className="text-red-600 text-xs mt-1 block" role="alert">{errors.price.message}</span>}
                            </div>

                            <div>
                                <label htmlFor="bairro" className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                                <select
                                    id="bairro"
                                    {...register('bairro', { required: 'Bairro é obrigatório' })}
                                    className="input-field"
                                    aria-invalid={errors.bairro ? "true" : "false"}
                                    aria-describedby={errors.bairro ? "bairro-error" : undefined}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Gonzaga">Gonzaga</option>
                                    <option value="Boqueirão">Boqueirão</option>
                                    <option value="Ponta da Praia">Ponta da Praia</option>
                                    <option value="Embaré">Embaré</option>
                                    <option value="Vila Rica">Vila Rica</option>
                                    <option value="Vila Belmiro">Vila Belmiro</option>
                                    <option value="Morro Sta. Teresinha">Morro Sta. Teresinha</option>
                                </select>
                                {errors.bairro && <span id="bairro-error" className="text-red-600 text-xs mt-1 block" role="alert">{errors.bairro.message}</span>}
                            </div>

                            <div>
                                <label htmlFor="tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                <select
                                    id="tipo"
                                    {...register('tipo', { required: 'Tipo é obrigatório' })}
                                    className="input-field"
                                    aria-invalid={errors.tipo ? "true" : "false"}
                                    aria-describedby={errors.tipo ? "tipo-error" : undefined}
                                >
                                    <option value="">Selecione...</option>
                                    <option value="Apartamento">Apartamento</option>
                                    <option value="Cobertura">Cobertura</option>
                                    <option value="Casa">Casa</option>
                                    <option value="Garden">Garden</option>
                                    <option value="Studio">Studio</option>
                                </select>
                                {errors.tipo && <span id="tipo-error" className="text-red-600 text-xs mt-1 block" role="alert">{errors.tipo.message}</span>}
                            </div>

                            <div>
                                <label htmlFor="specs" className="block text-sm font-medium text-gray-700 mb-1">Specs</label>
                                <input
                                    id="specs"
                                    {...register('specs')}
                                    className="input-field"
                                    placeholder="Ex: 4 Suítes • 380m²"
                                />
                            </div>

                            <div className="col-span-2">
                                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (separadas por vírgula)</label>
                                <input
                                    id="tags"
                                    {...register('tags')}
                                    className="input-field"
                                    placeholder="Ex: Frente Mar, Exclusivo, Oportunidade"
                                />
                            </div>

                            <div className="col-span-2">
                                <div className="flex items-center gap-3 p-4 bg-gold/5 rounded-lg border border-gold/20">
                                    <input
                                        type="checkbox"
                                        id="featured"
                                        {...register('featured')}
                                        className="w-5 h-5 text-gold-dark rounded border-gray-300 focus:ring-gold focus:ring-2"
                                    />
                                    <label htmlFor="featured" className="flex-1 text-sm font-medium text-gray-700 cursor-pointer">
                                        <span className="flex items-center gap-2">
                                            <Star size={16} className="text-gold-dark" aria-hidden="true" />
                                            Adicionar à Curadoria da Semana
                                        </span>
                                        <span className="block text-xs text-gray-500 mt-1 font-normal">Máximo 4 imóveis podem estar em destaque</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                            <Link to="/" className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium focus:ring-2 focus:ring-gold">
                                Cancelar
                            </Link>
                            <button
                                type="submit"
                                disabled={loading || uploading}
                                className="btn-primary flex items-center gap-2"
                            >
                                <Save size={18} aria-hidden="true" />
                                {loading ? 'Salvando...' : 'Salvar Imóvel'}
                            </button>
                        </div>
                    </form>
                </div>
            </main>
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </div>
    );
}
