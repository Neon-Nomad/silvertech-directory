import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Building2, ChevronRight, Shield, AlertTriangle, DollarSign, HelpCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Map } from '@/components/ui/Map';
import { supabase } from '@/src/lib/supabase';

// Hardcoded content to ensure stability
const CALIFORNIA_CONTENT = {
    name: "California",
    abbreviation: "CA",
    overview: {
        title: "Assisted Living in California",
        content: "California does not license assisted living under the name “Assisted Living.” Instead, facilities are regulated as Residential Care Facilities for the Elderly (RCFE). Roughly 7,400 RCFEs operate in the state, ranging from boutique 6-bed Board and Care homes to large corporate assisted living campuses.",
        bullets: [
            "Boutique 6 bed Board and Care homes",
            "Large corporate assisted living campuses",
            "Dementia and memory care units",
            "Hybrid Independent + Assisted campuses",
            "Continuing Care Retirement Communities (CCRCs)"
        ]
    },
    licensing: {
        authority: "California Department of Social Services (CDSS)",
        division: "Community Care Licensing Division (CCLD)",
        website: "https://www.cdss.ca.gov",
        searchUrl: "https://www.ccld.dss.ca.gov/carefacilitysearch",
        regulations: "Title 22, Division 6, Chapter 8",
        hotline: "1-844-538-8766"
    },
    requirements: {
        admission: {
            allowed: [
                "Need help with ADLs (bathing, dressing, toileting)",
                "Have dementia needs",
                "Need medication management",
                "Need supervision for safety"
            ],
            prohibited: [
                "24 hour skilled nursing",
                "Ongoing IV therapy",
                "Stage 3 or 4 pressure ulcers",
                "Oxygen administration without assistance",
                "Tube feeding",
                "Catheters that require skilled care"
            ]
        },
        staffing: [
            "Administrator on duty",
            "Direct care staff sufficient to meet resident needs",
            "Dementia training",
            "First aid certification",
            "Annual training hours",
            "Criminal background checks"
        ]
    },
    financialAssistance: {
        programs: [
            {
                name: "Assisted Living Waiver Program (ALW)",
                description: "Medi-Cal funded program available in select counties.",
                coverage: [
                    "Room and board subsidy",
                    "Personal care",
                    "Medication assistance",
                    "Dementia care",
                    "Activities",
                    "ADL support"
                ],
                eligibility: [
                    "Must qualify for Medi-Cal",
                    "Must require assisted living at nursing home level of care",
                    "Must reside in a participating county",
                    "Must move into a participating ALW facility"
                ],
                counties: [
                    "Los Angeles", "Sacramento", "Riverside", "San Bernardino",
                    "San Diego", "Alameda", "Contra Costa", "Sonoma"
                ],
                contactUrl: "https://www.dhcs.ca.gov/services/ltc/Pages/AssistedLivingWaiver.aspx"
            }
        ]
    },
    complaints: {
        methods: [
            { name: "CDSS Complaint Hotline", contact: "1-844-538-8766" },
            { name: "Local Regional Office", contact: "Submit online or call directly" },
            { name: "Long Term Care Ombudsman", contact: "1-800-231-4024" }
        ],
        scope: [
            "Abuse", "Neglect", "Poor care", "Injury",
            "Staffing issues", "Medication errors", "Illegal evictions"
        ]
    },
    faqs: [
        {
            question: "How do I check if a California assisted living facility is licensed?",
            answer: "Use the CDSS facility search tool at https://www.ccld.dss.ca.gov/carefacilitysearch."
        },
        {
            question: "Does Medi-Cal pay for assisted living?",
            answer: "Not directly. Only through the Assisted Living Waiver (ALW) program in participating counties."
        },
        {
            question: "What is a Board and Care home?",
            answer: "A small RCFE with 6 or fewer residents, often in a residential home setting."
        },
        {
            question: "Can a facility evict my parent?",
            answer: "Only under specific legal conditions like non-payment or if the facility can no longer meet their needs, and they must provide 30 days notice."
        },
        {
            question: "Is memory care different than assisted living?",
            answer: "Yes. Memory care units require secured perimeters, specific dementia training for staff, and specialized activity programming."
        }
    ],
    seo: {
        title: "Assisted Living in California | Complete Guide & Directory",
        description: "Full guide to assisted living in California. Licensing rules, RCFE laws, Medi-Cal Assisted Living Waiver, resident rights, complaints, inspections, and how to choose the right facility.",
        schema: {
            "@context": "https://schema.org/",
            "@type": "WebPage",
            "name": "Assisted Living in California",
            "description": "Full guide to assisted living in California. Licensing rules, RCFE laws, Medi Cal Assisted Living Waiver, resident rights, complaints, inspections, and how to choose the right facility.",
            "url": "https://silvertechdirectory.com/assisted-living/california",
            "about": {
                "@type": "State",
                "name": "California"
            }
        }
    }
};

export const CaliforniaPage: React.FC = () => {
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Use local content
  const content = CALIFORNIA_CONTENT;
  const mapCenter: [number, number] = [36.7783, -119.4179]; // California Center

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        // Fetch nearest to capital (Sacramento) using RPC
        const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_nearby_facilities', {
                user_lat: 38.5816, // Sacramento Lat
                user_lng: -121.4944, // Sacramento Lng
                max_results: 12
            });
        
        if (rpcError) throw rpcError;

        if (rpcData && Array.isArray(rpcData)) {
            const ids = rpcData.map((f: any) => f.id);
            const { data: licenseData } = await supabase
                .from('facility_licensing')
                .select('*')
                .in('facility_id', ids);
            
            // Merge licensing data
            const mapped = rpcData.map((f: any) => ({
                id: f.id,
                name: f.name,
                address: `${f.address_line1 || ''}${f.city ? ', ' + f.city : ''}${f.state ? ', ' + f.state : ''} ${f.postal_code || ''}`,
                capacity: licenseData?.find((l: any) => l.facility_id === f.id)?.bed_capacity || 0,
                type: 'Assisted Living',
                price: 'Call for Pricing',
                rating: 0,
                verified: true,
                vacancy: false,
                phone: f.phone,
                image: null
            }));
            setFacilities(mapped);
        }
      } catch (err) {
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, []);

  const majorCities = [
    'Los Angeles', 'San Diego', 'San Jose', 'San Francisco', 'Fresno', 
    'Sacramento', 'Long Beach', 'Oakland', 'Bakersfield', 'Anaheim'
  ];

  if (!content) return <div className="p-8 text-center">Loading content...</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{content.seo.title}</title>
        <meta name="description" content={content.seo.description} />
        <script type="application/ld+json">
          {JSON.stringify(content.seo.schema)}
        </script>
      </Helmet>

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">{content.overview.title}</h1>
          <p className="text-xl text-primary-100 max-w-3xl">
            {content.overview.content}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview Bullets */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Types of Care</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {content.overview.bullets?.map((bullet, idx) => (
                  <li key={idx} className="flex items-center text-slate-700">
                    <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                    {bullet}
                  </li>
                ))}
              </ul>
            </div>

            {/* Licensing */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">Licensing Authority</h2>
                  <p className="text-slate-700 mb-2">
                    <strong>{content.licensing.authority}</strong><br/>
                    {content.licensing.division}
                  </p>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <a href={content.licensing.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-medium">Official Website</a>
                    <a href={content.licensing.searchUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-medium">Facility Search</a>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">
                    Regulations: {content.licensing.regulations} | Hotline: {content.licensing.hotline}
                  </p>
                </div>
              </div>
            </div>

            {/* Admission Requirements */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Admission Requirements</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-green-700 mb-3 flex items-center">
                    <span className="bg-green-100 p-1 rounded mr-2">✓</span> Allowed
                  </h3>
                  <ul className="space-y-2">
                    {content.requirements.admission.allowed?.map((item, idx) => (
                      <li key={idx} className="text-slate-700 text-sm">• {item}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-red-700 mb-3 flex items-center">
                    <span className="bg-red-100 p-1 rounded mr-2">✕</span> Prohibited
                  </h3>
                  <ul className="space-y-2">
                    {content.requirements.admission.prohibited?.map((item, idx) => (
                      <li key={idx} className="text-slate-700 text-sm">• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Financial Assistance */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <DollarSign className="w-6 h-6 text-green-600" />
                <h2 className="text-2xl font-bold text-slate-900">Financial Assistance</h2>
              </div>
              {content.financialAssistance.programs?.map((program, idx) => (
                <div key={idx} className="mb-6 last:mb-0">
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{program.name}</h3>
                  <p className="text-slate-600 mb-3">{program.description}</p>
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <h4 className="font-medium text-slate-900 mb-2">Eligibility:</h4>
                    <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mb-3">
                      {program.eligibility?.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                    {program.contactUrl && (
                      <a href={program.contactUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-sm font-medium">
                        Learn More & Apply →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <HelpCircle className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
              </div>
              <div className="space-y-6">
                {content.faqs?.map((faq, idx) => (
                  <div key={idx}>
                    <h3 className="font-bold text-slate-900 mb-2">{faq.question}</h3>
                    <p className="text-slate-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-900 mb-4">Browse by City in California</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {majorCities.map((c) => (
                <Link
                  key={c}
                  to={`/assisted-living/california/${c.toLowerCase().replace(/ /g, '-')}`}
                  className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all flex items-center justify-between group"
                >
                  <span className="font-medium text-slate-700 group-hover:text-primary-700">
                    {c}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
                </Link>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map Widget */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-slate-900 mb-4">Location Map</h3>
              <div className="h-64 rounded-lg overflow-hidden bg-slate-100 relative">
                 <Map center={mapCenter} facilities={facilities} />
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Quick Facts</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex justify-between">
                  <span>Total Facilities</span>
                  <span className="font-medium text-slate-900">7,400+</span>
                </li>
                <li className="flex justify-between">
                  <span>Avg. Price</span>
                  <span className="font-medium text-slate-900">$4,500/mo</span>
                </li>
                <li className="flex justify-between">
                  <span>State Tax</span>
                  <span className="font-medium text-slate-900">Exempt</span>
                </li>
              </ul>
            </div>
            
            {/* Complaints Widget */}
            <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-red-500">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-500 w-5 h-5" />
                File a Complaint
              </h3>
              <div className="space-y-4">
                {content.complaints.methods?.map((method, idx) => (
                  <div key={idx} className="text-sm">
                    <div className="font-medium text-slate-800">{method.name}</div>
                    <div className="text-slate-600">{method.contact}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
