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
      <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-slate-900 shadow-xl border-b border-slate-700/50">

        {/* Circuit Board Pattern Overlay */}
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <pattern id="circuit-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M20 20h20v20M60 20v20h20M20 60v20h20M60 80h20v-20" stroke="white" strokeWidth="1.5" fill="none" />
              <circle cx="20" cy="20" r="2" fill="white" />
              <circle cx="80" cy="20" r="2" fill="white" />
              <circle cx="20" cy="80" r="2" fill="white" />
              <circle cx="80" cy="80" r="2" fill="white" />
              <path d="M40 40h20v20h-20z" stroke="white" strokeWidth="1" fill="none" opacity="0.5" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
          </svg>
        </div>

        {/* Metallic Gradient Sheen */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-slate-900/90 backdrop-blur-sm pointer-events-none"></div>

        {/* Animated Silver Tech Border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/50 to-transparent">
          <div className="absolute inset-0 bg-white/20 blur-[2px] animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-24">
            <Link to="/" onClick={handleLogoClick} className="flex items-center group relative">
              {/* Logo Glow Effect */}
              <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex items-center gap-3">
                <div className="bg-gradient-to-br from-slate-100 to-slate-300 p-2 rounded-lg shadow-[0_0_15px_rgba(255,255,255,0.1)] border border-slate-400/30">
                  <img src="/logo.png" alt="SilverTech Directory" className="h-14 w-auto mix-blend-multiply" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight">
                    Silver<span className="font-light text-cyan-400">Tech</span>
                  </span>
                </div>
              </div>
            </Link>

            {/* Hamburger Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="group relative p-2"
              aria-label="Toggle menu"
            >
              <div className="absolute inset-0 bg-slate-800 rounded-lg border border-slate-600 group-hover:border-cyan-500/50 transition-colors duration-300"></div>
              <div className="relative z-10 text-slate-300 group-hover:text-cyan-400 transition-colors duration-300">
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}>
                  {isMenuOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
                </div>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-24"></div>

      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Navbar;
