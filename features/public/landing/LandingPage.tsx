import React from 'react';
import { Hero } from '../../../components/Hero';
import { Problem } from '../../../components/Problem';
import { Solution } from '../../../components/Solution';
import { HowItWorks } from '../../../components/HowItWorks';
import { BusinessModel } from '../../../components/BusinessModel';
import { Comparison } from '../../../components/Comparison';
import { Vision } from '../../../components/Vision';
import { WhyNow } from '../../../components/WhyNow';
import { Founder } from '../../../components/Founder';
import { Footer } from '../../../components/Footer';

const LandingPage: React.FC = () => {
  return (
    <div>
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <BusinessModel />
      <Comparison />
      <Vision />
      <WhyNow />
      <Founder />
      <Footer />
    </div>
  );
};

export default LandingPage;
