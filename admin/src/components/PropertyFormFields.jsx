import { Star, Upload, X } from 'lucide-react';

// Campos do formulário de propriedade - Grug gosta: componente focado, sem lógica complexa
export default function PropertyFormFields({
    register,
    errors,
    imageUrl,
    uploading,
    onImageUpload,
    onRemoveImage,
    loading
}) {
    return (
        <>
            {/* Upload de Imagem */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem Principal *</label>
                <div className="space-y-4">
                    {imageUrl ? (
                        <div className="relative h-48 rounded-lg overflow-hidden border border-gray-200 group">
                            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={onRemoveImage}
                                className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                                aria-label="Remover imagem"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="h-48 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 bg-gray-50">
                            <Upload size={32} className="mb-2" />
                            <span className="text-sm">Nenhuma imagem</span>
                        </div>
                    )}

                    <div>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={onImageUpload}
                            className="hidden"
                            id="image-upload"
                            disabled={uploading}
                        />
                        <label
                            htmlFor="image-upload"
                            className={`w-full flex justify-center items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-gold ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                            tabIndex="0"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    document.getElementById('image-upload').click();
                                }
                            }}
                        >
                            <Upload size={18} />
                            {uploading ? 'Enviando...' : 'Escolher Arquivo'}
                        </label>
                        {errors.image && <p className="text-red-600 text-xs mt-1">{errors.image.message}</p>}
                    </div>
                </div>
                <input type="hidden" {...register('image', { required: 'Imagem é obrigatória' })} />
            </div>

            <div>
                <label htmlFor="drawer-title" className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                    id="drawer-title"
                    {...register('title', { required: 'Título é obrigatório' })}
                    className="input-field"
                    placeholder="Ex: Cobertura Duplex"
                />
                {errors.title && <span className="text-red-600 text-xs mt-1 block">{errors.title.message}</span>}
            </div>

            <div>
                <label htmlFor="drawer-subtitle" className="block text-sm font-medium text-gray-700 mb-1">Subtítulo</label>
                <input
                    id="drawer-subtitle"
                    {...register('subtitle')}
                    className="input-field"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="drawer-price" className="block text-sm font-medium text-gray-700 mb-1">Preço *</label>
                    <input
                        id="drawer-price"
                        {...register('price', { required: 'Obrigatório' })}
                        className="input-field"
                        placeholder="R$ 0,00"
                    />
                    {errors.price && <span className="text-red-600 text-xs mt-1 block">{errors.price.message}</span>}
                </div>
                <div>
                    <label htmlFor="drawer-tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                    <select
                        id="drawer-tipo"
                        {...register('tipo', { required: 'Obrigatório' })}
                        className="input-field"
                    >
                        <option value="">Selecione...</option>
                        <option value="Apartamento">Apartamento</option>
                        <option value="Cobertura">Cobertura</option>
                        <option value="Casa">Casa</option>
                        <option value="Garden">Garden</option>
                        <option value="Studio">Studio</option>
                    </select>
                    {errors.tipo && <span className="text-red-600 text-xs mt-1 block">{errors.tipo.message}</span>}
                </div>
            </div>

            <div>
                <label htmlFor="drawer-bairro" className="block text-sm font-medium text-gray-700 mb-1">Bairro *</label>
                <select
                    id="drawer-bairro"
                    {...register('bairro', { required: 'Bairro é obrigatório' })}
                    className="input-field"
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
                {errors.bairro && <span className="text-red-600 text-xs mt-1 block">{errors.bairro.message}</span>}
            </div>

            <div>
                <label htmlFor="drawer-specs" className="block text-sm font-medium text-gray-700 mb-1">Specs</label>
                <input
                    id="drawer-specs"
                    {...register('specs')}
                    className="input-field"
                    placeholder="Ex: 4 Suítes • 380m²"
                />
            </div>

            <div>
                <label htmlFor="drawer-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                <input
                    id="drawer-tags"
                    {...register('tags')}
                    className="input-field"
                    placeholder="Separadas por vírgula"
                />
            </div>

            <div className="flex items-center gap-3 p-4 bg-gold/5 rounded-lg border border-gold/20">
                <input
                    type="checkbox"
                    id="drawer-featured"
                    {...register('featured')}
                    className="w-5 h-5 text-gold-dark rounded border-gray-300 focus:ring-gold focus:ring-2"
                />
                <label htmlFor="drawer-featured" className="flex-1 text-sm font-medium text-gray-700 cursor-pointer">
                    <span className="flex items-center gap-2">
                        <Star size={16} className="text-gold-dark" aria-hidden="true" />
                        Adicionar à Curadoria da Semana
                    </span>
                    <span className="block text-xs text-gray-500 mt-1 font-normal">Máximo 4 imóveis podem estar em destaque</span>
                </label>
            </div>
        </>
    );
}

