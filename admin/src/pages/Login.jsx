import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight } from 'lucide-react';
import { API_URL } from '../config';
import { useToast } from '../hooks/useToast';
import Toast from '../components/Toast';

export default function Login() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const { login } = useAuth();
    const navigate = useNavigate();
    const { toast, showToast, hideToast } = useToast();

    const onSubmit = async (data) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro no login');
            }

            login(result.user, result.token);
            navigate('/');
        } catch (error) {
            showToast(error.message || 'Erro no login', 'error');
        }
    };

    return (
        <div className="min-h-screen flex bg-background">
            {/* Left Side - Image */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden" aria-hidden="true">
                <img
                    src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=80"
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]"></div>
                <div className="absolute bottom-0 left-0 p-12 text-white">
                    <h2 className="text-4xl font-serif font-bold mb-4">Gestão Exclusiva</h2>
                    <p className="text-white/90 text-lg max-w-md">
                        Painel administrativo para gerenciamento de portfólio de alto padrão.
                    </p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12" role="main">
                <div className="max-w-md w-full">
                    <div className="text-center mb-10">
                        <div className="inline-block p-3 rounded-full bg-primary/5 mb-4">
                            <Lock className="w-8 h-8 text-primary" aria-hidden="true" />
                        </div>
                        <h1 className="text-3xl font-serif font-bold text-primary mb-2">Bem-vindo de volta</h1>
                        <p className="text-gray-600">Acesse sua conta para gerenciar o portfólio.</p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" aria-label="Login">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Usuário</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <User size={20} className="text-gray-500 group-focus-within:text-gold-dark transition-colors" aria-hidden="true" />
                                </div>
                                <input
                                    id="username"
                                    {...register('username', { required: 'Usuário é obrigatório' })}
                                    className="input-field pl-11"
                                    placeholder="Digite seu usuário"
                                    aria-invalid={errors.username ? "true" : "false"}
                                    aria-describedby={errors.username ? "username-error" : undefined}
                                />
                            </div>
                            {errors.username && (
                                <span id="username-error" className="text-red-600 text-sm mt-1 block" role="alert">
                                    {errors.username.message}
                                </span>
                            )}
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Senha</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={20} className="text-gray-500 group-focus-within:text-gold-dark transition-colors" aria-hidden="true" />
                                </div>
                                <input
                                    id="password"
                                    type="password"
                                    {...register('password', { required: 'Senha é obrigatória' })}
                                    className="input-field pl-11"
                                    placeholder="••••••••"
                                    aria-invalid={errors.password ? "true" : "false"}
                                    aria-describedby={errors.password ? "password-error" : undefined}
                                />
                            </div>
                            {errors.password && (
                                <span id="password-error" className="text-red-600 text-sm mt-1 block" role="alert">
                                    {errors.password.message}
                                </span>
                            )}
                        </div>

                        <button type="submit" className="w-full btn-primary py-3.5 group">
                            Entrar no Painel
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                        </button>
                    </form>

                    <p className="mt-8 text-center text-sm text-gray-500">
                        &copy; {new Date().getFullYear()} Marcelo Braz. Todos os direitos reservados.
                    </p>
                </div>
            </div>
            {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
        </div>
    );
}
