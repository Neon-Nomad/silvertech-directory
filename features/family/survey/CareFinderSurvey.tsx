import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ChevronRight, Heart, MapPin, DollarSign, Activity, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';

interface SurveyData {
  budget: string;
  location: string;
  careLevel: string;
  timeline: string;
  priorities: string[];
}

const questions = [
  {
    id: 'budget',
    title: 'What is your monthly budget?',
    icon: DollarSign,
    options: ['$3k - $5k', '$5k - $7k', '$7k - $10k', '$10k+'],
    empatheticMessage: "We'll find options that respect your financial peace of mind."
  },
  {
    id: 'location',
    title: 'Where are you looking?',
    icon: MapPin,
    options: ['Near Me', 'Specific City', 'Anywhere in CA'],
    empatheticMessage: "Location matters. We'll keep them close to what they love."
  },
  {
    id: 'careLevel',
    title: 'What level of care is needed?',
    icon: Heart,
    options: ['Independent Living', 'Assisted Living', 'Memory Care', 'Skilled Nursing'],
    empatheticMessage: "Understanding their needs helps us find the safest environment."
  },
  {
    id: 'timeline',
    title: 'How soon do you need care?',
    icon: Activity,
    options: ['Immediately', 'Within 30 days', '3-6 Months', 'Just Planning'],
    empatheticMessage: "Whether it's urgent or future planning, we're here to guide you."
  },
  {
    id: 'priorities',
    title: 'What are your top priorities? (Select up to 3)',
    icon: Check,
    multiSelect: true,
    options: ['Staff Ratio', 'Private Room', 'Gourmet Dining', 'Activities', 'Pet Friendly', 'Transportation'],
    empatheticMessage: "We'll prioritize what brings them joy and comfort."
  }
];

export const CareFinderSurvey: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyData, setSurveyData] = useState<SurveyData>({
    budget: '',
    location: '',
    careLevel: '',
    timeline: '',
    priorities: []
  });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const questionRef = useRef<HTMLDivElement>(null);
  const messageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate in the first question
    if (questionRef.current) {
      gsap.fromTo(questionRef.current, 
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
      );
    }
  }, []);

  const handleOptionSelect = (option: string) => {
    const currentQuestion = questions[currentStep];
    
    if (currentQuestion.multiSelect) {
      const newPriorities = surveyData.priorities.includes(option)
        ? surveyData.priorities.filter(p => p !== option)
        : [...surveyData.priorities, option].slice(0, 3);
        
      setSurveyData({ ...surveyData, priorities: newPriorities });
    } else {
      setSurveyData({ ...surveyData, [currentQuestion.id]: option });
      handleNextStep();
    }
  };

  const handleNextStep = () => {
    if (currentStep < questions.length - 1) {
      // Animate out current question
      gsap.to(questionRef.current, {
        opacity: 0,
        x: -50,
        duration: 0.4,
        onComplete: () => {
          // Show empathetic message
          if (messageRef.current) {
            messageRef.current.innerText = questions[currentStep].empatheticMessage;
            gsap.fromTo(messageRef.current,
              { opacity: 0, scale: 0.9 },
              { opacity: 1, scale: 1, duration: 0.5, yoyo: true, repeat: 1, hold: 4.0, onComplete: () => {
                setCurrentStep(prev => prev + 1);
                // Animate in next question
                gsap.fromTo(questionRef.current,
                  { opacity: 0, x: 50 },
                  { opacity: 1, x: 0, duration: 0.4 }
                );
              }}
            );
          } else {
             setCurrentStep(prev => prev + 1);
             gsap.fromTo(questionRef.current,
                { opacity: 0, x: 50 },
                { opacity: 1, x: 0, duration: 0.4 }
              );
          }
        }
      });
    } else {
      // Submit survey
      window.location.href = '/results';
    }
  };

  const currentQuestion = questions[currentStep];
  const Icon = currentQuestion.icon;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" ref={containerRef}>
      <Helmet>
        <title>CareFinder Survey | SilverTech Directory</title>
        <meta
          name="description"
          content="Answer a few guided questions so SilverTech can match your family with senior living options that fit your budget, location, and care needs."
        />
        <meta name="robots" content="noindex, follow" />
        <link rel="canonical" href="https://silvertechdirectory.com/survey" />
      </Helmet>

      <div className="max-w-2xl w-full">
        <h1 className="sr-only">CareFinder Survey</h1>
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
          <p className="text-right text-sm text-slate-500 mt-2">Step {currentStep + 1} of {questions.length}</p>
        </div>

        {/* Empathetic Message Overlay */}
        <div 
          ref={messageRef} 
          className="fixed inset-0 flex items-center justify-center pointer-events-none opacity-0 text-2xl md:text-3xl font-medium text-primary-600 text-center px-4 bg-white/80 backdrop-blur-sm z-50"
        >
        </div>

        {/* Question Card */}
        <div ref={questionRef} className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary-50 rounded-xl">
              <Icon className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900">{currentQuestion.title}</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {currentQuestion.options.map((option) => (
              <button
                key={option}
                onClick={() => handleOptionSelect(option)}
                className={`p-6 text-left rounded-xl border-2 transition-all duration-200 group hover:border-primary-500 hover:bg-primary-50
                  ${(currentQuestion.multiSelect ? surveyData.priorities.includes(option) : surveyData[currentQuestion.id as keyof SurveyData] === option)
                    ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                    : 'border-slate-100 bg-white'
                  }
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-medium text-slate-700 group-hover:text-primary-700">{option}</span>
                  {(currentQuestion.multiSelect ? surveyData.priorities.includes(option) : surveyData[currentQuestion.id as keyof SurveyData] === option) && (
                    <Check className="w-5 h-5 text-primary-600" />
                  )}
                </div>
              </button>
            ))}
          </div>

          {currentQuestion.multiSelect && (
            <div className="mt-8 flex justify-end">
              <Button 
                variant="primary" 
                size="lg"
                onClick={handleNextStep}
                disabled={surveyData.priorities.length === 0}
              >
                Continue <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CareFinderSurvey;
