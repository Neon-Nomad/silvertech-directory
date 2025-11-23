import React from 'react';
import { Button } from './ui/Button';

export const Footer: React.FC = () => {
  return (
    <footer id="contact" className="bg-slate-50 pt-20 pb-10 border-t border-slate-200">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-6">Invest in the Infrastructure of Aging</h2>
        <p className="text-slate-600 mb-10">
          The demographics are inevitable. The technology is available. The time is now.
        </p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
          <a href="https://drive.google.com/drive/folders/1tjOd8qf2qPxi4ELy8oRrzSMXJV-mhh3r?usp=drive_link" target="_blank" rel="noopener noreferrer">
            <Button variant="primary" className="px-8 py-4 text-lg w-full sm:w-auto">
              View Pitch Deck
            </Button>
          </a>
          <Button 
            variant="outline" 
            className="px-8 py-4 text-lg w-full sm:w-auto"
            onClick={() => window.location.href = 'mailto:andrew@silvertechdirectory.com?subject=Founder Inquiry'}
          >
            Contact the Founder
          </Button>
        </div>
        
        <div className="border-t border-slate-200 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
          <div className="mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} SilverTech Directory. All rights reserved.
          </div>
          <div>
            <a href="mailto:andrew@silvertechdirectory.com" className="hover:text-primary-600 transition-colors">
              andrew@silvertechdirectory.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};