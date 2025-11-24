import React, { useState } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Section } from './ui/Section';
import { Button } from './ui/Button';
import { WaitlistModal } from './WaitlistModal';

export const Hero: React.FC = () => {
  const [isWaitlistOpen, setIsWaitlistOpen] = useState(false);

  return (
    <>
      <Section className="pt-32 pb-20 lg:pt-40 lg:pb-32 min-h-screen flex items-center bg-gradient-to-b from-slate-50 to-white overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 bg-slate-100 rounded-full px-3 py-1 mb-8 border border-slate-200">
              <span className="text-xs font-semibold bg-primary-600 text-white px-2 py-0.5 rounded-full">New</span>
              <span className="text-sm text-slate-600 font-medium">The Vertical Operating System for the Longevity Economy</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
              The intelligence layer for senior living.
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl leading-relaxed">
              Replacing the opaque referral agency model with a data-driven marketplace and SaaS workflow engine for operators, families, and investors.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <a 
                href="https://drive.google.com/drive/folders/1tjOd8qf2qPxi4ELy8oRrzSMXJV-mhh3r?usp=drive_link" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="w-full sm:w-auto"
              >
                 <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4 h-auto">
                    View Pitch Deck <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </a>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto text-lg px-8 py-4 h-auto"
                onClick={() => setIsWaitlistOpen(true)}
              >
                Join Early Access
              </Button>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-8 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Programmatic State Data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Real-time Availability</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span>Zero Commissions</span>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/20 to-secondary-500/20 rounded-2xl transform rotate-3 scale-105 blur-2xl"></div>
            <img 
              src={`${import.meta.env.BASE_URL}hero.png`} 
              alt="Modern Senior Living Facility" 
              className="relative rounded-2xl shadow-2xl border border-slate-200 w-full object-cover h-[600px] transform hover:scale-[1.02] transition-transform duration-500"
            />
            {/* Floating Badge */}
            <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-slate-100 flex items-center gap-4 animate-bounce-slow">
              <div className="bg-green-100 p-3 rounded-full">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Live Availability</p>
                <p className="text-xs text-slate-500">Updated 2 mins ago</p>
              </div>
            </div>
          </div>
        </div>
      </Section>
      
      <WaitlistModal 
        isOpen={isWaitlistOpen} 
        onClose={() => setIsWaitlistOpen(false)} 
      />
    </>
  );
};