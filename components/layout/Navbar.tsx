import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, MapPin, ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
}

interface NavCategory {
  label: string;
  items?: DropdownItem[];
  href?: string;
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    label: 'Find Care',
    items: [
      { label: 'By State', href: '/states' },
    ],
  },
  {
    label: 'Compare',
    items: [
      { label: 'Compare Communities', href: '/search' },
      { label: 'Saved Communities', href: '/search' },
      { label: 'How to Compare', href: '/guides/how-to-choose' },
    ],
  },
  {
    label: 'Pricing',
    items: [
      { label: 'Provider Pricing Plans', href: '/for-facilities/pricing' },
      { label: 'Average Costs by State', href: '/states' },
      { label: 'What Affects Pricing', href: '/guides/what-it-costs' },
      { label: 'Paying for Senior Living', href: '/guides/what-it-costs' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'How to Choose a Community', href: '/guides/how-to-choose' },
      { label: 'Questions to Ask on a Tour', href: '/guides/tour-questions' },
      { label: 'State Regulations', href: '/regulatory-library' },
      { label: 'Ombudsman Contacts', href: '/states' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    label: 'Why This Exists',
    href: '/why-this-exists',
  },
  {
    label: 'Sign In',
    items: [
      { label: 'Family Sign In', href: '/login' },
      { label: 'Facility Sign In', href: '/operator/login' },
    ],
  },
  {
    label: 'For Facilities',
    items: [
      { label: 'Claim a Listing', href: '/for-facilities' },
      { label: 'Pricing Plans', href: '/for-facilities/pricing' },
      { label: 'Why List With Us', href: '/providers' },
    ],
  },
];

const NavDropdown: React.FC<{
  category: NavCategory;
  isOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
}> = ({ category, isOpen, onOpen, onClose }) => {
  if (category.href) {
    return (
      <Link
        to={category.href}
        className="text-sm font-medium text-charcoal hover:text-gold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 rounded"
      >
        {category.label}
      </Link>
    );
  }

  const menuItems = category.items || [];
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(onClose, 150);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => (isOpen ? onClose() : onOpen())}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={`nav-menu-${category.label.toLowerCase().replace(/\s+/g, '-')}`}
        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
          isOpen ? 'text-gold' : 'text-charcoal hover:text-gold'
        }`}
      >
        {category.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          id={`nav-menu-${category.label.toLowerCase().replace(/\s+/g, '-')}`}
          role="menu"
          className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-warm-gray py-2 z-50"
        >
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={onClose}
              className="block px-4 py-2.5 text-sm text-charcoal/70 hover:text-charcoal hover:bg-warm-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const Navbar: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <nav aria-label="Primary" className="w-full sticky top-0 z-50 bg-white border-b border-warm-gray">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            onClick={handleLogoClick}
            className="flex-shrink-0 w-[220px] md:w-[250px] h-10 md:h-11 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
          >
            <img
              src="/logo-nav.png"
              alt="SilverTech Directory"
              width={500}
              height={106}
              className="w-full h-full object-contain -translate-y-[6px] scale-90"
              loading="eager"
              decoding="async"
            />
          </Link>

          {/* Primary Navigation — desktop */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_CATEGORIES.map((category) => (
              <NavDropdown
                key={category.label}
                category={category}
                isOpen={openCategory === category.label}
                onOpen={() => setOpenCategory(category.label)}
                onClose={() => setOpenCategory(null)}
              />
            ))}
          </div>

          {/* Utility Navigation — desktop */}
          <div className="hidden lg:flex items-center gap-5 border-l border-warm-gray pl-6">
            <Link
              to="/search"
              className="text-charcoal/60 hover:text-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
              title="Search"
              aria-label="Search directory"
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              className="text-charcoal/60 hover:text-charcoal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
              title="Saved"
              aria-label="Saved communities"
            >
              <Heart className="w-5 h-5" />
            </button>
            <button
              className="flex items-center gap-1.5 text-charcoal/60 hover:text-charcoal transition-colors text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
              title="Location"
              aria-label="Location settings"
            >
              <MapPin className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile — tap to toggle categories */}
          <div className="lg:hidden flex items-center gap-4">
            <Link
              to="/search"
              className="text-charcoal/60 hover:text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
              title="Search"
              aria-label="Search directory"
            >
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setOpenCategory(openCategory ? null : 'mobile')}
              className="flex items-center gap-1 text-sm font-medium text-charcoal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
              aria-expanded={openCategory === 'mobile'}
              aria-controls="mobile-nav-panel"
            >
              Menu
              <ChevronDown className={`w-4 h-4 transition-transform ${openCategory === 'mobile' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        {openCategory === 'mobile' && (
          <div id="mobile-nav-panel" className="lg:hidden border-t border-warm-gray py-4 space-y-4">
            {NAV_CATEGORIES.map((category) => (
              <MobileNavSection
                key={category.label}
                category={category}
                onClose={() => setOpenCategory(null)}
              />
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

const MobileNavSection: React.FC<{
  category: NavCategory;
  onClose: () => void;
}> = ({ category, onClose }) => {
  if (category.href) {
    return (
      <Link
        to={category.href}
        onClick={onClose}
        className="block py-1.5 text-sm font-semibold text-charcoal hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 rounded"
      >
        {category.label}
      </Link>
    );
  }

  const menuItems = category.items || [];
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-charcoal py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
        aria-expanded={expanded}
        aria-controls={`mobile-submenu-${category.label.toLowerCase().replace(/\s+/g, '-')}`}
      >
        {category.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div id={`mobile-submenu-${category.label.toLowerCase().replace(/\s+/g, '-')}`} className="mt-1 ml-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={onClose}
              className="block py-1.5 text-sm text-charcoal/70 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-1 rounded"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Navbar;
