import { useEffect, useState } from 'react';
import { CONSTANTS } from '../data/constants.js';

/**
 * Hook para gerenciar navegação e estado do header
 * Grug gosta: centraliza toda lógica de navegação em um hook
 * 
 * Features:
 * - Gerencia view atual (home/portfolio)
 * - Detecta scroll para mudar estilo do header
 * - Controla menu mobile (aberto/fechado)
 * - Scroll automático para seções
 * - Performance otimizada com requestAnimationFrame
 * 
 * @returns {{
 *   currentView: 'home'|'portfolio',
 *   isScrolled: boolean,
 *   mobileMenuOpen: boolean,
 *   setMobileMenuOpen: (open: boolean) => void,
 *   navigateTo: (view: 'home'|'portfolio', sectionId?: string) => void
 * }}
 */
export const useNavigation = () => {
  const [currentView, setCurrentView] = useState('home');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > CONSTANTS.SCROLL_THRESHOLD);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'home' && window.location.hash) {
      const sectionId = window.location.hash.substring(1);
      const el = document.getElementById(sectionId);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [currentView]);

  const navigateTo = (view, sectionId = null) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    if (sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  return { currentView, isScrolled, mobileMenuOpen, setMobileMenuOpen, navigateTo };
};

