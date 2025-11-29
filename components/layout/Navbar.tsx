import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { FullScreenMenu } from './FullScreenMenu';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMenuOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/50 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-24">
            <Link to="/" onClick={handleLogoClick} className="flex items-center z-50 relative group">
              <div className="absolute -inset-2 bg-white/5 rounded-xl blur-sm group-hover:bg-white/10 transition-colors duration-300"></div>
              <div className="relative bg-white/90 rounded-lg p-2 shadow-sm">
                <img src="/logo.png" alt="SilverTech Directory" className="h-16 w-auto" />
              </div>
            </Link>

            {/* Hamburger Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-100 hover:text-primary-400 p-2 z-50 relative transition-colors duration-300"
              aria-label="Toggle menu"
            >
              <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}>
                {isMenuOpen ? <X size={32} strokeWidth={1.5} /> : <Menu size={32} strokeWidth={1.5} />}
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer to prevent content from hiding behind fixed navbar */}
      <div className="h-24"></div>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Navbar;
