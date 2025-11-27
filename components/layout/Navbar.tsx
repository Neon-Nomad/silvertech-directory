import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { StatesDropdown } from '@/components/ui/StatesDropdown';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" onClick={handleLogoClick} className="flex items-center">
            <span className="text-xl font-bold text-white">
              SilverTech<span className="text-primary-400">Directory</span>
            </span>
          </Link>



          <div className="hidden md:flex items-center space-x-8">
            <StatesDropdown />

            <Link
              to="/advertise"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Advertise with Us
            </Link>
            <Link
              to="/claim-business"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Claim this business
            </Link>
            <Link
              to="/faq"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              FAQ
            </Link>

            <Link
              to="/login"
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Operator Login
            </Link>
          </div>

          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-slate-300 hover:text-white p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-4 py-4 space-y-3">
            <div className="pb-2">
              <StatesDropdown 
                className="w-full text-base py-2" 
                onStateSelect={() => setIsMobileMenuOpen(false)} 
              />
            </div>
            <Link
              to="/advertise"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white text-base font-medium"
            >
              Advertise with Us
            </Link>
            <Link
              to="/claim-business"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white text-base font-medium"
            >
              Claim this business
            </Link>
            <Link
              to="/faq"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white text-base font-medium"
            >
              FAQ
            </Link>
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-base font-medium text-center"
            >
              Operator Login
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
