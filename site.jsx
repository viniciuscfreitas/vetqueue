import { MessageCircle } from 'lucide-react';
import React, { useState } from 'react';
import { Footer } from './components/Footer.jsx';
import { Header } from './components/Header.jsx';
import { LeadModal } from './components/LeadModal.jsx';
import { Toast } from './components/Toast.jsx';
import { BROKER_INFO } from './data/constants.js';
import { useModalLogic } from './hooks/useModalLogic.js';
import { useNavigation } from './hooks/useNavigation.js';
import { useProperties } from './hooks/useProperties.js';
import { AboutSection } from './sections/AboutSection.jsx';
import { CollectionSection } from './sections/CollectionSection.jsx';
import { HeroSection } from './sections/HeroSection.jsx';
import { TestimonialsSection } from './sections/TestimonialsSection.jsx';
import { ValuationSection } from './sections/ValuationSection.jsx';
import { WhatsappCaptureSection } from './sections/WhatsappCaptureSection.jsx';
import { PortfolioView } from './views/PortfolioView.jsx';

export default function RealEstateSite() {
  const nav = useNavigation();
  const { modalState, openModal, closeModal } = useModalLogic();
  const { properties } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const handlePropertyClick = (prop) => {
      setSelectedProperty(prop);
    openModal('gate');
  };

  const handleModalSuccess = (msg) => {
    setToastMessage(msg);
  };

  return (
    <div className="font-sans text-gray-900 selection:bg-[#d4af37] selection:text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
      `}</style>

      <Header
        isScrolled={nav.isScrolled}
        mobileMenuOpen={nav.mobileMenuOpen}
        setMobileMenuOpen={nav.setMobileMenuOpen}
        navigateTo={nav.navigateTo}
        currentView={nav.currentView}
      />

      {nav.currentView === 'home' ? (
        <>
          <main>
            <HeroSection navigateTo={nav.navigateTo} />
            <CollectionSection navigateTo={nav.navigateTo} onPropertyClick={handlePropertyClick} properties={properties} />
            <AboutSection />
            <ValuationSection />
            <TestimonialsSection />
            <WhatsappCaptureSection />
          </main>
          <Footer navigateTo={nav.navigateTo} />
            </>
        ) : (
        <PortfolioView
          properties={properties}
          navigateTo={nav.navigateTo}
          onPropertyClick={handlePropertyClick}
        />
      )} <a href={BROKER_INFO.whatsapp_link} target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 z-50 group flex items-center justify-end focus:outline-none focus-visible:ring-4 focus-visible:ring-green-400 rounded-full" aria-label="Falar no WhatsApp">
        <div className="absolute right-16 bg-white py-2 px-4 rounded-lg shadow-xl text-xs font-bold text-[#0f172a] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 mr-2 hidden md:block border border-gray-100" aria-hidden="true">Falar com Marcelo</div>
        <div className="bg-[#25D366] text-white p-4 rounded-full shadow-2xl shadow-green-500/30 hover:scale-110 transition-transform duration-300 flex items-center justify-center w-14 h-14"><MessageCircle size={30} /></div>
      </a>

      <LeadModal
        isOpen={modalState.isOpen}
        onClose={() => { closeModal(); setSelectedProperty(null); }}
        property={selectedProperty}
        type={modalState.type}
        onSuccess={handleModalSuccess}
      />

      {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} />}
    </div>
  );
}
