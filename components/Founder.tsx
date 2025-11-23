import React from 'react';
import { Section } from './ui/Section';

export const Founder: React.FC = () => {
  return (
    <Section className="bg-white">
      <div className="max-w-4xl mx-auto bg-slate-50 rounded-2xl p-8 md:p-12 border border-slate-100">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="w-full md:w-1/3 shrink-0">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-lg shadow-lg">
              <img 
                src="https://drive.google.com/file/d/1Zgc3OaSNq2iohzd-Gk_cBN_erbqSS2SB/view?usp=sharing" 
                alt="Andrew Dillon" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="mt-4 text-center md:text-left">
              <h3 className="text-xl font-bold text-slate-900">Andrew Dillon</h3>
              <p className="text-slate-500">Founder</p>
            </div>
          </div>
          
          <div className="flex-grow">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Mission-Driven, Not Accidental.</h2>
            <div className="space-y-4 text-slate-700 leading-relaxed">
              <p>
                At 55, Andrew Dillon isn't just building another tech company. He is solving a problem that is personally haunting him.
              </p>
              <p>
                With a family history of Alzheimer's—specifically his grandfather—and now experiencing early memory concerns himself, Andrew understands the visceral fear and confusion families face. He knows the system is broken because he is the target customer.
              </p>
              <p>
                He brings deep empathy for caregivers and the operational grit of a repeat founder. SilverTech Directory is the platform he wishes existed: honest, transparent, and intelligent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};