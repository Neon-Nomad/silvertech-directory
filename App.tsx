import React from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Problem } from './components/Problem';
import { Solution } from './components/Solution';
import { WhyNow } from './components/WhyNow';
import { HowItWorks } from './components/HowItWorks';
import { BusinessModel } from './components/BusinessModel';
import { Comparison } from './components/Comparison';
import { Founder } from './components/Founder';
import { Vision } from './components/Vision';
import { Footer } from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-primary-100 selection:text-primary-900">
      <Navbar />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <WhyNow />
        <HowItWorks />
        <BusinessModel />
        <Comparison />
        <Founder />
        <Vision />
      </main>
      <Footer />
    </div>
  );
}

export default App;