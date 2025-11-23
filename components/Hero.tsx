import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { Section } from './ui/Section';
import { Button } from './ui/Button';

export const Hero: React.FC = () => {
  return (
    <Section className="pt-40 pb-32 min-h-screen flex items-center bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-4xl">
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
            href="https://docs.google.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="w-full sm:w-auto"
          >
             <Button variant="primary" className="w-full sm:w-auto text-lg px-8 py-4 h-auto">
                View Pitch Deck <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </a>
          <a 
            href="mailto:andrew@silvertechdirectory.com?subject=Early Access Request" 
            className="w-full sm:w-auto"
          >
            <Button variant="outline" className="w-full sm:w-auto text-lg px-8 py-4 h-auto">
                Join Early Access
            </Button>
          </a>
        </div>

        <div className="mt-16 pt-8 border-t border-slate-200 flex flex-col sm:flex-row gap-8 text-sm text-slate-500">
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
    </Section>
  );
};