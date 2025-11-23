import React from 'react';
import { Section } from './ui/Section';

export const Vision: React.FC = () => {
  return (
    <Section id="vision" dark className="relative overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop" 
          alt="Modern Living Vision" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-900/30 to-slate-950/80"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-8 drop-shadow-lg">The Vision</h2>
        <p className="text-xl md:text-2xl text-slate-100 leading-relaxed mb-12 font-light drop-shadow-md">
          The directory is only the wedge. The product is the <span className="text-white font-semibold">Vertical Operating System</span>.
        </p>
        
        <div className="grid md:grid-cols-2 gap-8 text-left">
          <div className="border-l-2 border-primary-500 pl-6 bg-slate-900/60 p-4 rounded-r-lg backdrop-blur-md shadow-lg">
            <h4 className="text-lg font-semibold text-white mb-2">Unified Infrastructure</h4>
            <p className="text-slate-200">Becoming the real-time connective tissue for the entire silver economy, from housing to home care.</p>
          </div>
          <div className="border-l-2 border-primary-500 pl-6 bg-slate-900/60 p-4 rounded-r-lg backdrop-blur-md shadow-lg">
            <h4 className="text-lg font-semibold text-white mb-2">Predictive Demand</h4>
            <p className="text-slate-200">Using AI to forecast care needs before they become emergencies, integrated with financial planning.</p>
          </div>
        </div>
      </div>
    </Section>
  );
};