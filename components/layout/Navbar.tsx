import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { StatesDropdown } from '@/components/ui/StatesDropdown';

import { UserMenu } from '@/components/ui/UserMenu';
import { useAuth } from '@/src/context/AuthProvider';

const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user } = useAuth();

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
              to="/blog"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Blog
            </Link>
            
            <div className="h-6 w-px bg-slate-700 mx-2" /> {/* Divider */}

            <Link
              to="/providers"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              For Providers
            </Link>
            <Link
              to="/pricing"
              className="text-slate-300 hover:text-white transition-colors text-sm font-medium"
            >
              Pricing
            </Link>
            
            <UserMenu />
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
              to="/blog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white text-base font-medium"
            >
              Blog
            </Link>
            <div className="border-t border-slate-700 my-2" />
            <Link
              to="/providers"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white text-base font-medium"
            >
              For Providers
            </Link>
            <Link
              to="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block text-slate-300 hover:text-white text-base font-medium"
            >
              Pricing
            </Link>
            
            {user ? (
                <div className="pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                            {user.email?.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-white text-sm">{user.email}</span>
                    </div>
                    <Link
                      to="/profile/reviews"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-slate-300 hover:text-white text-base font-medium py-1"
                    >
                      My Reviews
                    </Link>
                    <Link
                      to="/profile/saved"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block text-slate-300 hover:text-white text-base font-medium py-1"
                    >
                      Saved Facilities
                    </Link>
                </div>
            ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-base font-medium text-center mt-4"
                >
                  Sign In
                </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
