import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/context/AuthProvider';
import { Search, MapPin, BookOpen, Scale, Building2, Users, HelpCircle } from 'lucide-react';

interface FullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

type MenuCategory = 'care' | 'regulatory' | 'operators' | 'company';

const US_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
];

export const FullScreenMenu: React.FC<FullScreenMenuProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();
  const [activeCategory, setActiveCategory] = useState<MenuCategory>('care');

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Prevent scrolling when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const menuVariants = {
    closed: { opacity: 0, transition: { duration: 0.2 } },
    open: { opacity: 1, transition: { duration: 0.2 } }
  };

  const categories = [
    { id: 'care' as MenuCategory, label: 'Find Care', icon: Search, color: 'primary' },
    { id: 'regulatory' as MenuCategory, label: 'Regulatory Library', icon: Scale, color: 'blue' },
    { id: 'operators' as MenuCategory, label: 'For Providers', icon: Building2, color: 'purple' },
    { id: 'company' as MenuCategory, label: 'Company', icon: HelpCircle, color: 'slate' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
          className="fixed inset-0 bg-white z-40"
        >
          <div className="h-full flex">
            {/* LEFT PANEL - Categories */}
            <div className="w-full md:w-1/3 bg-gradient-to-br from-slate-50 to-slate-100 border-r border-slate-200 p-8 flex flex-col">
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = activeCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onMouseEnter={() => setActiveCategory(cat.id)}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`group relative p-6 rounded-2xl transition-all duration-300 text-left ${isActive
                          ? 'bg-white shadow-xl scale-105'
                          : 'bg-white/50 hover:bg-white hover:shadow-lg hover:scale-102'
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl transition-colors ${isActive
                            ? 'bg-primary-100 text-primary-600'
                            : 'bg-slate-100 text-slate-600 group-hover:bg-primary-50 group-hover:text-primary-600'
                          }`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className={`text-lg font-semibold transition-colors ${isActive ? 'text-slate-900' : 'text-slate-700 group-hover:text-slate-900'
                            }`}>
                            {cat.label}
                          </h3>
                        </div>
                      </div>
                      {isActive && (
                        <motion.div
                          layoutId="activeIndicator"
                          className="absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary-600 rounded-l-full"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT PANEL - Content */}
            <div className="hidden md:flex w-2/3 bg-white p-12 overflow-y-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className="w-full"
                >
                  {activeCategory === 'care' && <CareContent onClose={onClose} />}
                  {activeCategory === 'regulatory' && <RegulatoryContent onClose={onClose} />}
                  {activeCategory === 'operators' && <OperatorsContent onClose={onClose} user={user} signOut={signOut} />}
                  {activeCategory === 'company' && <CompanyContent onClose={onClose} />}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CareContent = ({ onClose }: { onClose: () => void }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-slate-900 mb-6">Find Senior Living Care</h2>
    <div className="grid grid-cols-2 gap-6">
      <NavCard to="/" onClick={onClose} icon={Search} title="Search Facilities" description="Find the perfect care option" />
      <NavCard to="/states" onClick={onClose} icon={MapPin} title="Browse by State" description="Explore all locations" />
    </div>
  </div>
);

const RegulatoryContent = ({ onClose }: { onClose: () => void }) => (
  <div className="space-y-6">
    <h2 className="text-3xl font-bold text-slate-900 mb-4">Regulatory Library</h2>
    <p className="text-slate-600 mb-8">State-specific regulations, licensing guides, and compliance resources.</p>

    <div className="mb-8 space-y-4">
      <NavCard to="/regulatory-library" onClick={onClose} icon={BookOpen} title="Regulatory Index" description="Complete regulatory overview" />
      <NavCard to="/resources/medicaid" onClick={onClose} icon={Scale} title="Medicaid Guides" description="State Medicaid information" />
      <NavCard to="/resources/veterans" onClick={onClose} icon={Users} title="Veterans Benefits" description="VA benefits by state" />
    </div>

    <div className="border-t border-slate-200 pt-6">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">Browse by State</h3>
      <div className="grid grid-cols-4 gap-2">
        {US_STATES.map(state => (
          <Link
            key={state}
            to={`/regulatory/${state.toLowerCase().replace(/ /g, '-')}`}
            onClick={onClose}
            className="text-sm text-slate-700 hover:text-primary-600 hover:bg-primary-50 px-3 py-2 rounded-lg transition-colors"
          >
            {state}
          </Link>
        ))}
      </div>
    </div>
  </div>
);

const OperatorsContent = ({ onClose, user, signOut }: { onClose: () => void; user: any; signOut: () => void }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-slate-900 mb-6">For Senior Living Providers</h2>
    <div className="grid grid-cols-2 gap-6">
      {user ? (
        <>
          <NavCard to="/dashboard" onClick={onClose} icon={Building2} title="Dashboard" description="Manage your facilities" />
          <button onClick={() => { signOut(); onClose(); }} className="text-left group bg-slate-50 hover:bg-slate-100 p-6 rounded-xl transition-all border border-slate-200">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-slate-200 rounded-lg group-hover:bg-slate-300 transition-colors">
                <Users className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="font-semibold text-slate-900">Sign Out</h3>
            </div>
            <p className="text-sm text-slate-600">End your session</p>
          </button>
        </>
      ) : (
        <>
          <NavCard to="/login" onClick={onClose} icon={Users} title="Operator Login" description="Access your dashboard" />
          <NavCard to="/claim" onClick={onClose} icon={Building2} title="Add Your Facility" description="Claim or add listing" />
        </>
      )}
      <NavCard to="/pricing" onClick={onClose} icon={Search} title="Pricing & Plans" description="Upgrade your listing" />
    </div>
  </div>
);

const CompanyContent = ({ onClose }: { onClose: () => void }) => (
  <div className="space-y-8">
    <h2 className="text-3xl font-bold text-slate-900 mb-6">About SilverTech Directory</h2>
    <div className="grid grid-cols-2 gap-6">
      <NavCard to="/about" onClick={onClose} icon={HelpCircle} title="About Us" description="Our mission & story" />
      <NavCard to="/blog" onClick={onClose} icon={BookOpen} title="Blog" description="Industry insights" />
      <NavCard to="/contact" onClick={onClose} icon={Users} title="Contact" description="Get in touch" />
    </div>
  </div>
);

const NavCard = ({ to, onClick, icon: Icon, title, description }: any) => (
  <Link
    to={to}
    onClick={onClick}
    className="group bg-slate-50 hover:bg-gradient-to-br hover:from-primary-50 hover:to-purple-50 p-6 rounded-xl transition-all border border-slate-200 hover:border-primary-200 hover:shadow-lg"
  >
    <div className="flex items-center gap-4 mb-2">
      <div className="p-3 bg-white rounded-lg group-hover:bg-primary-100 transition-colors shadow-sm">
        <Icon className="w-5 h-5 text-slate-700 group-hover:text-primary-600 transition-colors" />
      </div>
      <h3 className="font-semibold text-slate-900 group-hover:text-primary-700 transition-colors">{title}</h3>
    </div>
    <p className="text-sm text-slate-600">{description}</p>
  </Link>
);
