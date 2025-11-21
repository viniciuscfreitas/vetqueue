import { Menu, X } from 'lucide-react';
import { NAV_LINKS } from '../data/content.js';
import { BROKER_INFO } from '../data/constants.js';
import { Button } from './Button.jsx';
import { NavLink } from './NavLink.jsx';

export const Header = ({ isScrolled, mobileMenuOpen, setMobileMenuOpen, navigateTo, currentView }) => (
  <>
    <header className={`fixed w-full z-50 transition-all duration-500 ${isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm text-[#0f172a] py-3' : 'bg-gradient-to-b from-black/60 to-transparent py-6 text-white'}`}>
      <div className="container mx-auto px-6 flex justify-between items-center">
        <button onClick={() => navigateTo('home')} className="flex flex-col leading-none group focus:rounded-md outline-none text-left">
          <span className={`text-xl font-serif font-bold tracking-tight transition-colors ${isScrolled ? 'text-[#0f172a]' : 'text-white drop-shadow-sm'}`}>
            MARCELO<span className="text-[#d4af37] font-extrabold">BRAZ</span>
          </span>
          <span className={`text-[10px] uppercase tracking-[0.2em] font-semibold ${isScrolled ? 'text-gray-600' : 'text-gray-100 drop-shadow-sm'}`}>Private Broker</span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item) => (
            <NavLink
              key={item.id}
              item={item}
              onClick={() => navigateTo('home', item.id)}
              isScrolled={isScrolled}
              isMobile={false}
            />
          ))}

          <NavLink
            item={{ label: 'Portfólio', id: 'portfolio' }}
            onClick={() => navigateTo('portfolio')}
            isScrolled={isScrolled}
            isMobile={false}
          />

          <Button variant={isScrolled ? "primary" : "gold"} className="px-6 py-2 text-xs" onClick={() => window.open(BROKER_INFO.whatsapp_link)}>
             Falar no WhatsApp
          </Button>
        </nav>

        <button className={`md:hidden p-2 rounded-md min-w-[44px] min-h-[44px] flex items-center justify-center ${isScrolled ? 'text-[#0f172a]' : 'text-white'}`} onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={28} className="text-[#0f172a]" /> : <Menu size={28} />}
        </button>
      </div>
    </header>

    {mobileMenuOpen && (
      <div className="fixed inset-0 z-40 bg-white pt-24 px-6 animate-in slide-in-from-right">
         <nav className="flex flex-col gap-6 text-center">
            <NavLink item={{ label: 'Portfólio Completo' }} onClick={() => navigateTo('portfolio')} isMobile={true} />
            {NAV_LINKS.map((item) => (
               <NavLink key={item.id} item={item} onClick={() => navigateTo('home', item.id)} isMobile={true} />
            ))}
            <Button variant="gold" fullWidth={true} onClick={() => window.open(BROKER_INFO.whatsapp_link)}>
                Chamar no WhatsApp
            </Button>
         </nav>
      </div>
    )}
  </>
);

