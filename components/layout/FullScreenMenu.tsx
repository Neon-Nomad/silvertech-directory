import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/src/context/AuthProvider';

interface FullScreenMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FullScreenMenu: React.FC<FullScreenMenuProps> = ({ isOpen, onClose }) => {
  const { user, signOut } = useAuth();

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
    closed: {
      opacity: 0,
      transition: { duration: 0.3, ease: "easeInOut" }
    },
    open: {
      opacity: 1,
      transition: { duration: 0.3, ease: "easeInOut" }
    }
  };

  const containerVariants = {
    closed: { transition: { staggerChildren: 0.05, staggerDirection: -1 } },
    open: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } }
  };

  const itemVariants = {
    closed: { y: 20, opacity: 0 },
    open: { y: 0, opacity: 1 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial="closed"
          animate="open"
          exit="closed"
          variants={menuVariants}
          className="fixed inset-0 bg-white z-40 flex flex-col items-center justify-center overflow-y-auto"
          onClick={onClose} // Close when clicking background
        >
          <motion.div 
            className="w-full max-w-md px-6 py-12 text-center space-y-12"
            variants={containerVariants}
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking content
          >
            {/* Care Navigation */}
            <div className="space-y-6">
              <motion.h3 variants={itemVariants} className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                Care Navigation
              </motion.h3>
              <nav className="flex flex-col space-y-4">
                <MenuLink to="/" onClick={onClose} variants={itemVariants}>Find Care</MenuLink>
                <MenuLink to="/states" onClick={onClose} variants={itemVariants}>Browse States</MenuLink>
              </nav>
            </div>

            {/* Regulatory Library */}
            <div className="space-y-6">
              <motion.h3 variants={itemVariants} className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                Regulatory Library
              </motion.h3>
              <nav className="flex flex-col space-y-4">
                <MenuLink to="/regulatory-library" onClick={onClose} variants={itemVariants}>Regulatory Index</MenuLink>
                <MenuLink to="/resources/medicaid" onClick={onClose} variants={itemVariants}>Medicaid Guides</MenuLink>
                <MenuLink to="/resources/veterans" onClick={onClose} variants={itemVariants}>Veterans Benefits</MenuLink>
              </nav>
            </div>

            {/* For Operators */}
            <div className="space-y-6">
              <motion.h3 variants={itemVariants} className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                For Operators
              </motion.h3>
              <nav className="flex flex-col space-y-4">
                {user ? (
                    <>
                        <MenuLink to="/dashboard" onClick={onClose} variants={itemVariants}>Dashboard</MenuLink>
                        <motion.button
                            variants={itemVariants}
                            onClick={() => { signOut(); onClose(); }}
                            className="text-2xl md:text-3xl font-light text-slate-900 hover:text-primary-600 transition-colors relative group inline-block"
                        >
                            Sign Out
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full" />
                        </motion.button>
                    </>
                ) : (
                    <>
                        <MenuLink to="/login" onClick={onClose} variants={itemVariants}>Operator Login</MenuLink>
                        <MenuLink to="/claim" onClick={onClose} variants={itemVariants}>Add Facility</MenuLink>
                    </>
                )}
                <MenuLink to="/pricing" onClick={onClose} variants={itemVariants}>Upgrade Listing</MenuLink>
              </nav>
            </div>

            {/* Company */}
            <div className="space-y-6">
              <motion.h3 variants={itemVariants} className="text-sm font-medium text-slate-400 uppercase tracking-widest">
                Company
              </motion.h3>
              <nav className="flex flex-col space-y-4">
                <MenuLink to="/about" onClick={onClose} variants={itemVariants}>About</MenuLink>
                <MenuLink to="/blog" onClick={onClose} variants={itemVariants}>Blog</MenuLink>
                <MenuLink to="/contact" onClick={onClose} variants={itemVariants}>Contact</MenuLink>
              </nav>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const MenuLink = ({ to, children, onClick, variants }: { to: string, children: React.ReactNode, onClick: () => void, variants: any }) => (
  <motion.div variants={variants}>
    <Link 
      to={to} 
      onClick={onClick}
      className="text-2xl md:text-3xl font-light text-slate-900 hover:text-primary-600 transition-colors relative group inline-block"
    >
      {children}
      <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary-600 transition-all group-hover:w-full" />
    </Link>
  </motion.div>
);
