import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { ChevronDown, ChevronUp, HelpCircle, HeartPulse } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  icon: React.ElementType;
  items: FAQItem[];
}

const faqData: FAQSection[] = [
  {
    title: 'General Questions',
    icon: HelpCircle,
    items: [
      {
        question: 'What is SilverTech Directory?',
        answer: 'SilverTech Directory is a comprehensive platform designed to help families find the best senior living and care options. We provide verified listings, transparent pricing, and tools to make informed decisions.'
      },
      {
        question: 'Is this service free for families?',
        answer: 'Yes, our directory is completely free for families to use. We are supported by our partner communities and service providers.'
      },
      {
        question: 'How are facilities verified?',
        answer: 'We verify facilities through a rigorous process that includes checking state licenses, reviewing violation histories, and confirming amenities and services directly with operators.'
      }
    ]
  },
  {
    title: 'Patient Care & Aging',
    icon: HeartPulse,
    items: [
      {
        question: 'Is it normal for my parent to become more agitated in the evening?',
        answer: 'This is a common phenomenon known as "Sundowning," often associated with dementia or Alzheimer\'s. It can be caused by fatigue, low light, or disrupted internal clocks. Establishing a calming evening routine can help.'
      },
      {
        question: 'Is it normal to experience memory lapses with age?',
        answer: 'Mild forgetfulness can be a normal part of aging, such as misplacing keys or forgetting a name occasionally. However, consistent memory loss that disrupts daily life may indicate a more serious condition and should be evaluated by a doctor.'
      },
      {
        question: 'How do I know if it\'s time for assisted living?',
        answer: 'Signs may include difficulty managing daily tasks (cooking, cleaning, hygiene), frequent falls, social isolation, or worsening health conditions. If safety becomes a concern, it may be time to explore assisted living options.'
      },
      {
        question: 'What is the difference between assisted living and memory care?',
        answer: 'Assisted living provides help with daily activities like bathing and medication management. Memory care is a specialized form of long-term care designed specifically for patients with Alzheimer\'s and other forms of dementia, offering enhanced security and specialized activities.'
      }
    ]
  }
];

export const FAQ: React.FC = () => {
  const [openSection, setOpenSection] = useState<string | null>('General Questions');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (sectionTitle: string, index: number) => {
    const key = `${sectionTitle}-${index}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <Helmet>
        <title>Frequently Asked Questions | SilverTech Directory</title>
        <meta name="description" content="Find answers to common questions about SilverTech Directory and senior care, including patient care concerns and aging." />
        <link rel="canonical" href="https://silvertechdirectory.com/faq" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Frequently Asked Questions | SilverTech Directory" />
        <meta property="og:description" content="Find answers to common questions about SilverTech Directory and senior care, including patient care concerns and aging." />
        <meta property="og:url" content="https://silvertechdirectory.com/faq" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Frequently Asked Questions | SilverTech Directory" />
        <meta name="twitter:description" content="Find answers to common questions about SilverTech Directory and senior care, including patient care concerns and aging." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Frequently Asked Questions</h1>
          <p className="mt-4 text-lg text-slate-600">
            Everything you need to know about our platform and caring for your loved ones.
          </p>
        </div>

        <div className="space-y-8">
          {faqData.map((section) => (
            <div key={section.title} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <section.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              </div>
              
              <div className="divide-y divide-slate-100">
                {section.items.map((item, index) => {
                  const key = `${section.title}-${index}`;
                  const isOpen = openItems[key];

                  return (
                    <div key={index} className="group">
                      <button
                        onClick={() => toggleItem(section.title, index)}
                        className="w-full flex items-center justify-between p-6 text-left focus:outline-none hover:bg-slate-50 transition-colors"
                      >
                        <span className="font-medium text-slate-900 pr-8">{item.question}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        )}
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-6 text-slate-600 leading-relaxed animate-in slide-in-from-top-2 duration-200">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
