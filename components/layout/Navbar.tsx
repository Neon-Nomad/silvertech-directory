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
      <nav className="relative w-full z-50 transition-all duration-300 bg-slate-900 shadow-2xl border-b border-slate-700">

        {/* Gunmetal Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 opacity-95"></div>

        {/* Circuit Board Pattern Overlay - More Visible */}
        <div className="absolute inset-0 opacity-30 pointer-events-none overflow-hidden mix-blend-overlay">
          <svg className="absolute w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="circuit-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <pattern id="circuit-pattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
              <path d="M40 40h40v40M120 40v40h40M40 120v40h40M120 160h40v-40" stroke="url(#circuit-gradient)" strokeWidth="2" fill="none" />
              <circle cx="40" cy="40" r="3" fill="#22d3ee" fillOpacity="0.5" />
              <circle cx="160" cy="40" r="3" fill="#22d3ee" fillOpacity="0.5" />
              <circle cx="40" cy="160" r="3" fill="#22d3ee" fillOpacity="0.5" />
              <circle cx="160" cy="160" r="3" fill="#22d3ee" fillOpacity="0.5" />
              <path d="M80 80h40v40h-40z" stroke="#94a3b8" strokeWidth="1" fill="none" opacity="0.3" />
              <path d="M20 100h160" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
              <path d="M100 20v160" stroke="#22d3ee" strokeWidth="1" strokeDasharray="4 4" opacity="0.2" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#circuit-pattern)" />
          </svg>
        </div>

        {/* Animated Data Streams */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[20%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-[shimmer_3s_infinite]"></div>
          <div className="absolute top-[80%] left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent animate-[shimmer_4s_infinite_1s]"></div>
        </div>

        {/* Animated Silver Tech Border */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_rgba(34,211,238,0.5)]">
          <div className="absolute inset-0 bg-white/40 blur-[2px] animate-pulse"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex justify-between items-center h-24">
            <Link to="/" onClick={handleLogoClick} className="flex items-center group relative">
              {/* Logo Glow Effect */}
              <div className="absolute -inset-4 bg-cyan-500/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative flex items-center gap-4">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-2.5 rounded-xl shadow-[0_0_15px_rgba(34,211,238,0.15)] border border-slate-600 group-hover:border-cyan-500/50 transition-colors duration-300">
                  <img src="/logo.png" alt="SilverTech Directory" className="h-14 w-auto" />
                </div>
                <div className="hidden sm:block">
                  <div className="flex flex-col">
                    <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400 tracking-tight leading-none">
                      Silver<span className="font-light text-cyan-400">Tech</span>
                    </span>
                    <span className="text-[0.65rem] uppercase tracking-[0.2em] text-cyan-500/80 font-medium ml-0.5">Directory</span>
                  </div>
                </div>
              </div>
            </Link>

            {/* Hamburger Menu Trigger */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="group relative p-2"
              aria-label="Toggle menu"
            >
              <div className="absolute inset-0 bg-slate-800/80 rounded-lg border border-slate-600 group-hover:border-cyan-500/50 transition-colors duration-300 shadow-[0_0_10px_rgba(0,0,0,0.3)]"></div>
              <div className="relative z-10 text-slate-300 group-hover:text-cyan-400 transition-colors duration-300">
                <div className={`transition-transform duration-300 ${isMenuOpen ? 'rotate-90' : ''}`}>
                  {isMenuOpen ? <X size={28} strokeWidth={1.5} /> : <Menu size={28} strokeWidth={1.5} />}
                </div>
              </div>
            </button>
          </div>
        </div>
      </nav>



      <FullScreenMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
    </>
  );
};

export default Navbar;
