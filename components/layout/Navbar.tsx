import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Heart, MapPin, ChevronDown } from 'lucide-react';

interface DropdownItem {
  label: string;
  href: string;
}

interface NavCategory {
  label: string;
  items: DropdownItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    label: 'Find Care',
    items: [
      { label: 'Assisted Living', href: '/search?type=assisted-living' },
      { label: 'Memory Care', href: '/search?type=memory-care' },
      { label: 'Independent Living', href: '/search?type=independent-living' },
      { label: 'Nursing Homes', href: '/search?type=nursing-homes' },
      { label: 'Browse by State', href: '/states' },
    ],
  },
  {
    label: 'Compare',
    items: [
      { label: 'Compare Communities', href: '/search' },
      { label: 'Saved Communities', href: '/search' },
      { label: 'How to Compare', href: '/resources/guides' },
    ],
  },
  {
    label: 'Pricing',
    items: [
      { label: 'Average Costs by State', href: '/states' },
      { label: 'What Affects Pricing', href: '/resources/guides' },
      { label: 'Paying for Senior Living', href: '/resources/guides' },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'How to Choose a Community', href: '/resources/guides' },
      { label: 'Questions to Ask on a Tour', href: '/resources/guides' },
      { label: 'State Regulations', href: '/regulatory-library' },
      { label: 'Ombudsman Contacts', href: '/resources/guides' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    label: 'For Facilities',
    items: [
      { label: 'Claim a Listing', href: '/for-facilities' },
      { label: 'Pricing Plans', href: '/pricing' },
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
  const ref = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleMouseEnter = () => {
    clearTimeout(timeoutRef.current);
    onOpen();
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(onClose, 150);
  };

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
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
        className={`flex items-center gap-1 text-sm font-medium transition-colors ${
          isOpen ? 'text-gold' : 'text-charcoal hover:text-gold'
        }`}
      >
        {category.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-100 py-2 z-50">
          {category.items.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={onClose}
              className="block px-4 py-2.5 text-sm text-slate-600 hover:text-charcoal hover:bg-warm-gray transition-colors"
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="w-full sticky top-0 z-50 bg-white border-b border-slate-200">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" onClick={handleLogoClick} className="flex-shrink-0">
            <img src="/images/logo2.png" alt="SilverTech Directory" className="h-[128px] w-auto" />
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
          <div className="hidden lg:flex items-center gap-5 border-l border-slate-200 pl-6">
            <Link to="/search" className="text-slate-500 hover:text-charcoal transition-colors" title="Search">
              <Search className="w-5 h-5" />
            </Link>
            <button className="text-slate-500 hover:text-charcoal transition-colors" title="Saved">
              <Heart className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-1.5 text-slate-500 hover:text-charcoal transition-colors text-sm" title="Location">
              <MapPin className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile — tap to toggle categories */}
          <div className="lg:hidden flex items-center gap-4">
            <Link to="/search" className="text-slate-500 hover:text-charcoal" title="Search">
              <Search className="w-5 h-5" />
            </Link>
            <button
              onClick={() => setOpenCategory(openCategory ? null : 'mobile')}
              className="flex items-center gap-1 text-sm font-medium text-charcoal"
            >
              Menu
              <ChevronDown className={`w-4 h-4 transition-transform ${openCategory === 'mobile' ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown panel */}
        {openCategory === 'mobile' && (
          <div className="lg:hidden border-t border-slate-100 py-4 space-y-4">
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
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-charcoal py-1"
      >
        {category.label}
        <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="mt-1 ml-3 space-y-1">
          {category.items.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              onClick={onClose}
              className="block py-1.5 text-sm text-slate-600 hover:text-gold"
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
