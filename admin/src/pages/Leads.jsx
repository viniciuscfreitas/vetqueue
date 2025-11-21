import { Building, Home, LayoutDashboard, Search, Users } from 'lucide-react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SITE_URL } from '../config';
import { useAuth } from '../context/AuthContext';
import LeadsList from '../components/LeadsList';

export default function Leads() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <div className="h-screen bg-[#FAFAFA] font-sans text-slate-800 overflow-hidden">
            {/* Desktop Sidebar - Compacta Fixa */}
            <aside className="hidden md:flex w-24 bg-white h-screen fixed left-0 top-0 flex-col items-center py-8 shadow-sm border-r border-gray-100 z-20" role="navigation" aria-label="Menu Principal">
                {/* Logo */}
                <div className="mb-10 p-2 bg-gold-dark rounded-xl shadow-lg shadow-gold/20">
                    <Building className="text-white w-6 h-6" aria-hidden="true" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 flex flex-col gap-6 w-full px-4">
                    <button
                        onClick={() => navigate('/')}
                        className={`w-full aspect-square flex items-center justify-center rounded-xl transition-colors ${
                            location.pathname === '/'
                                ? 'bg-gold/10 text-gold'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gold'
                        }`}
                        aria-label="Dashboard"
                        aria-current={location.pathname === '/' ? 'page' : undefined}
                    >
                        <LayoutDashboard className="w-6 h-6" aria-hidden="true" />
                    </button>
                    <button
                        onClick={() => navigate('/leads')}
                        className={`w-full aspect-square flex items-center justify-center rounded-xl transition-colors ${
                            location.pathname === '/leads'
                                ? 'bg-gold/10 text-gold'
                                : 'text-gray-400 hover:bg-gray-50 hover:text-gold'
                        }`}
                        aria-label="Leads"
                        aria-current={location.pathname === '/leads' ? 'page' : undefined}
                    >
                        <Users className="w-6 h-6" aria-hidden="true" />
                    </button>
                    <a
                        href={SITE_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full aspect-square flex items-center justify-center rounded-xl text-gray-400 hover:bg-gray-50 hover:text-gold transition-colors"
                        aria-label="Ver Site"
                    >
                        <Home className="w-6 h-6" aria-hidden="true" />
                    </a>
                </nav>

                {/* User Avatar */}
                <button
                    className="mt-auto mb-4 rounded-full border-2 border-gold-dark p-0.5 hover:border-gold transition-colors focus:ring-2 focus:ring-gold focus:ring-offset-2"
                    aria-label="Menu do usuário"
                    onClick={logout}
                >
                    <div className="w-10 h-10 rounded-full bg-gold-dark flex items-center justify-center text-white font-bold text-sm">
                        {user?.name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase()}
                    </div>
                </button>
            </aside>

            {/* Main Content */}
            <main className="md:pl-24 h-full flex flex-col overflow-hidden md:overflow-hidden overflow-y-auto bg-[#FAFAFA]" tabIndex="-1" role="main">
                {/* Header */}
                <header className="bg-white border-b border-gray-100 px-4 md:px-6 py-2 md:py-5 flex-shrink-0">
                    <div className="flex flex-row md:flex-row items-center gap-2 md:gap-4">
                        {/* Título - Esconde quando busca expandida */}
                        <div className={`flex-1 transition-all duration-300 ${isSearchOpen ? 'opacity-0 md:opacity-100 scale-95 md:scale-100 max-w-0 md:max-w-none overflow-hidden md:overflow-visible' : 'opacity-100 scale-100 max-w-full'}`}>
                            <h1 className="text-lg md:text-3xl font-bold text-gray-900 flex items-center gap-2 whitespace-nowrap">
                                Leads Capturados
                            </h1>
                            <p className="text-gray-500 text-xs md:text-sm hidden md:block">Visualize todos os leads capturados no site</p>
                        </div>

                        {/* Botão/Busca - Mesmo elemento que expande */}
                        <div className={`transition-all duration-300 ease-in-out ${
                            isSearchOpen
                                ? 'flex-1 md:flex-[2] min-w-0 md:min-w-[calc(50%+390px)]'
                                : 'w-auto'
                        }`}>
                            {isSearchOpen ? (
                                // Barra de busca expandida
                                <div className="bg-gray-50 flex items-center px-4 md:px-5 py-3 md:py-4 rounded-2xl border border-gray-100 transition-all duration-300 ease-in-out">
                                    <Search className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0" aria-hidden="true" />
                                    <input
                                        id="search-bar-input"
                                        type="text"
                                        placeholder="Busque por nome, telefone, imóvel ou tipo..."
                                        className="w-full outline-none text-sm font-medium text-gray-700 placeholder-gray-400 bg-transparent transition-all"
                                        style={{ outline: 'none', boxShadow: 'none' }}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        autoFocus
                                        aria-label="Buscar leads"
                                    />
                                    <button
                                        onClick={() => {
                                            setIsSearchOpen(false);
                                            setSearchTerm('');
                                        }}
                                        className="ml-2 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
                                        aria-label="Fechar busca"
                                    >
                                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                // Botão de busca (recolhido) - menor no mobile
                                <button
                                    onClick={() => setIsSearchOpen(true)}
                                    className="p-2 md:p-3 rounded-full shadow-sm border border-gray-100 bg-white hover:bg-gray-50 text-gray-600 transition-all focus:ring-2 focus:ring-gold focus:ring-offset-2"
                                    aria-label="Buscar leads"
                                    aria-expanded={false}
                                >
                                    <Search className="w-4 h-4 md:w-5 md:h-5" aria-hidden="true" />
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col px-4 md:px-6 py-4 md:py-6 pb-20 md:pb-6">
                    {/* Desktop: Leads Section */}
                    <section className="hidden md:block bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1 min-h-0" role="region" aria-labelledby="leads-heading">
                        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 flex-shrink-0">
                            <div>
                                <h3 id="leads-heading" className="text-lg md:text-xl font-bold text-gray-900">Lista de Leads</h3>
                                <p className="text-xs md:text-sm text-gray-500 mt-1 hidden md:block">Gerencie os leads capturados no site.</p>
                            </div>
                        </div>
                        <div className="p-0 flex-1 min-h-0 overflow-hidden">
                            <LeadsList searchTerm={searchTerm} />
                        </div>
                    </section>

                    {/* Mobile: Cards diretos na tela */}
                    <div className="md:hidden">
                        <LeadsList searchTerm={searchTerm} />
                    </div>
                </div>
            </main>

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 px-6 py-3 pb-6 flex justify-between items-end z-50 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
                <button
                    onClick={() => navigate('/')}
                    className="flex flex-col items-center gap-1 text-gray-400"
                >
                    <LayoutDashboard className="w-6 h-6" aria-hidden="true" />
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                <button
                    onClick={() => navigate('/leads')}
                    className="flex flex-col items-center gap-1 text-gray-800"
                >
                    <Users className="w-6 h-6" strokeWidth={2.5} aria-hidden="true" />
                    <span className="text-[10px] font-bold">Leads</span>
                </button>

                <a
                    href={SITE_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="flex flex-col items-center gap-1 text-gray-400"
                >
                    <Home className="w-6 h-6" aria-hidden="true" />
                    <span className="text-[10px] font-medium">Site</span>
                </a>

                <button
                    onClick={logout}
                    className="flex flex-col items-center gap-1 text-gray-400"
                    aria-label="Sair"
                >
                    <Building className="w-6 h-6" aria-hidden="true" />
                    <span className="text-[10px] font-medium">Sair</span>
                </button>
            </div>
        </div>
    );
}

