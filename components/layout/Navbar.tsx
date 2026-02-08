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
      <nav className="w-full z-[1000] bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" onClick={handleLogoClick} className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <img src="/logo.png" alt="SilverTech Directory" className="h-9 w-auto" />
              </div>
              <div className="hidden sm:block">
                <div className="flex flex-col">
                  <span className="text-lg font-semibold text-slate-900 tracking-tight">SilverTech</span>
                  <span className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-400 font-medium">Directory</span>
                </div>
              </div>
            </Link>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={20} strokeWidth={1.5} /> : <Menu size={20} strokeWidth={1.5} />}
              <span className="text-sm font-medium">Menu</span>
            </button>
          </div>
        </div>
      </nav>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Navbar;
