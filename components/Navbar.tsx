import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsMobileMenuOpen(false);
    }
  };

  const handlePitchDeck = () => {
    window.open('https://drive.google.com/drive/folders/1tjOd8qf2qPxi4ELy8oRrzSMXJV-mhh3r?usp=drive_link', '_blank');
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { label: 'Problem', id: 'problem' },
    { label: 'Solution', id: 'solution' },
    { label: 'How It Works', id: 'how-it-works' },
    { label: 'Business Model', id: 'business-model' },
    { label: 'Vision', id: 'vision' },
  ];

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
        <div className="flex justify-between items-center">
          <div className="flex items-center cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <span className={`text-xl font-bold tracking-tight ${isScrolled ? 'text-slate-900' : 'text-slate-900'}`}>
              SilverTech<span className="text-primary-600">Directory</span>
            </span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.id)}
                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                {link.label}
              </button>
            ))}
            <Button variant="primary" className="py-2 px-4 text-sm" onClick={handlePitchDeck}>
              View Pitch Deck
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-600 hover:text-slate-900 p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-100 absolute w-full shadow-lg">
          <div className="flex flex-col px-6 py-4 space-y-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => scrollToSection(link.id)}
                className="text-left text-base font-medium text-slate-600 hover:text-slate-900"
              >
                {link.label}
              </button>
            ))}
            <Button variant="primary" fullWidth onClick={handlePitchDeck}>
              View Pitch Deck
            </Button>
          </div>
        </div>
      )}
    </nav>
  );
};