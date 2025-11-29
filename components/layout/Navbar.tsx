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
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-28">
            <Link to="/" onClick={handleLogoClick} className="flex items-center z-50 relative">
              <img src="/logo.png" alt="SilverTech Directory" className="h-24 w-auto" />
            </Link>

            {/* Hamburger Menu Trigger - Visible on all screens */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-slate-900 hover:text-primary-600 p-2 z-50 relative transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={32} strokeWidth={1.5} /> : <Menu size={32} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </nav>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Navbar;
