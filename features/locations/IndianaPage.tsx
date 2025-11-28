import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { MapPin, Phone, ExternalLink, Shield, AlertTriangle, FileText, HelpCircle, Info } from 'lucide-react';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { stateContent } from '@/src/data/state_content';
import { useJsonLd } from '@/src/hooks/useJsonLd';

const INDIANA_CITIES = [
  'Indianapolis', 'Fort Wayne', 'Evansville', 'South Bend', 'Carmel',
  'Fishers', 'Bloomington', 'Hammond', 'Gary', 'Lafayette'
];

export const IndianaPage: React.FC = () => {
  const content = stateContent.indiana;
  useJsonLd(content.seo.schema);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Helmet>
        <title>Assisted Living in Indiana | State Guide & Licensing</title>
        <meta name="description" content="Complete guide to assisted living in Indiana. Medicaid waivers, licensing rules (IDOH), financial assistance, and how to file complaints." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs items={[{ label: 'Indiana', path: '/assisted-living/indiana' }]} />
          
          <h1 className="text-4xl font-bold text-slate-900 mt-6 mb-4">
            Assisted Living in Indiana: A Complete Guide for Families
          </h1>
          <p className="text-xl text-slate-600 max-w-4xl leading-relaxed">
            Indiana does not license assisted living under a single name. Instead, the state oversees several categories of senior housing and care through the Indiana Department of Health and the Family and Social Services Administration. Most “assisted living” communities operate as Residential Care Facilities or Housing with Services Establishments, each with different regulations and levels of oversight.
          </p>
          <p className="text-lg text-slate-600 max-w-4xl mt-4">
            This guide gives families straight answers on how care works in Indiana, how to pay for it, who regulates it, and where to turn when you need help.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            
            {/* Honest Care Callout */}
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 flex items-start gap-4">
              <Shield className="w-6 h-6 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-primary-900">Before you choose a facility</h3>
                <p className="text-primary-800 text-sm mt-1">
                  Most referral services charge hidden commissions that influence their recommendations. 
                  <Link to="/honest-care" className="underline font-medium ml-1 hover:text-primary-600">
                    Read our guide on transparency
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Types of Care */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Info className="w-6 h-6 text-primary-600" />
                Types of Senior Care in Indiana
              </h2>
              <p className="text-slate-600 mb-6">Indiana recognizes several care models families might encounter:</p>
              
              <div className="space-y-6">
                <div className="border-l-4 border-primary-500 pl-4">
                  <h3 className="text-lg font-bold text-slate-900">1. Residential Care Facilities (RCFs)</h3>
                  <p className="text-slate-600 mb-2">The closest match to “assisted living.” RCFs provide:</p>
                  <ul className="list-disc list-inside text-slate-600 ml-2 space-y-1">
                    <li>help with daily activities</li>
                    <li>medication oversight</li>
                    <li>meals</li>
                    <li>social programming</li>
                    <li>limited nursing services</li>
                  </ul>
                  <p className="text-sm text-slate-500 mt-2 italic">RCFs must be licensed by the Indiana Department of Health (IDOH).</p>
                </div>

                <div className="border-l-4 border-blue-400 pl-4">
                  <h3 className="text-lg font-bold text-slate-900">2. Housing with Services Establishments</h3>
                  <p className="text-slate-600">Independent senior apartments offering optional care through third-party agencies. These are registered but not medically licensed.</p>
                </div>

                <div className="border-l-4 border-purple-400 pl-4">
                  <h3 className="text-lg font-bold text-slate-900">3. Memory Care Programs</h3>
                  <p className="text-slate-600">Typically contained within licensed RCFs. Provide structured Alzheimer’s and dementia care.</p>
                </div>

                <div className="border-l-4 border-slate-400 pl-4">
                  <h3 className="text-lg font-bold text-slate-900">4. Skilled Nursing Facilities (Nursing Homes)</h3>
                  <p className="text-slate-600">Heavily regulated medical facilities licensed by IDOH. Not the same as assisted living, but families often compare both options.</p>
                </div>
              </div>
            </section>

            {/* Licensing Authority */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary-600" />
                Indiana Licensing Authority
              </h2>
              
              <div className="bg-slate-50 p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Indiana Department of Health (IDOH)</h3>
                <p className="text-slate-600 mb-4">Licenses and inspects all Residential Care Facilities and Nursing Facilities.</p>
                
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <a href="https://www.in.gov/health" target="_blank" rel="noreferrer" className="flex items-center text-primary-600 hover:underline">
                    <ExternalLink className="w-4 h-4 mr-2" /> Website: in.gov/health
                  </a>
                  <a href="https://www.in.gov/health/reports-and-statistics" target="_blank" rel="noreferrer" className="flex items-center text-primary-600 hover:underline">
                    <ExternalLink className="w-4 h-4 mr-2" /> Facility Search
                  </a>
                  <div className="flex items-center text-slate-700">
                    <Phone className="w-4 h-4 mr-2" /> 317-233-1325
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-bold text-green-700 mb-2">What IDOH does:</h4>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> onsite inspections</li>
                    <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> infection control oversight</li>
                    <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> staffing reviews</li>
                    <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> complaint investigations</li>
                    <li className="flex items-start"><span className="text-green-500 mr-2">✓</span> citations and enforcement actions</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-red-700 mb-2">What IDOH does not do:</h4>
                  <ul className="space-y-2 text-slate-600 text-sm">
                    <li className="flex items-start"><span className="text-red-500 mr-2">✗</span> verify pricing</li>
                    <li className="flex items-start"><span className="text-red-500 mr-2">✗</span> help compare facilities</li>
                    <li className="flex items-start"><span className="text-red-500 mr-2">✗</span> help you choose a home</li>
                  </ul>
                  <p className="text-xs text-slate-500 mt-2 italic">That is why directories like this exist.</p>
                </div>
              </div>
            </section>

            {/* Admission Requirements */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary-600" />
                Admission Requirements
              </h2>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">RCFs may admit residents who:</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start"><span className="text-green-500 mr-2">•</span> need assistance with activities of daily living</li>
                    <li className="flex items-start"><span className="text-green-500 mr-2">•</span> have cognitive impairment</li>
                    <li className="flex items-start"><span className="text-green-500 mr-2">•</span> need medication management</li>
                    <li className="flex items-start"><span className="text-green-500 mr-2">•</span> require intermittent nursing services</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-3">An RCF cannot admit or retain residents who:</h3>
                  <ul className="space-y-2 text-slate-600">
                    <li className="flex items-start"><span className="text-red-500 mr-2">•</span> need 24 hour skilled nursing</li>
                    <li className="flex items-start"><span className="text-red-500 mr-2">•</span> require ventilator care</li>
                    <li className="flex items-start"><span className="text-red-500 mr-2">•</span> have unstable medical conditions</li>
                    <li className="flex items-start"><span className="text-red-500 mr-2">•</span> exhibit behaviors the facility cannot reasonably manage</li>
                  </ul>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-4 italic">Most facilities perform their own assessment before move in.</p>
            </section>

            {/* Financial Assistance */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <HelpCircle className="w-6 h-6 text-primary-600" />
                Financial Assistance in Indiana
              </h2>
              <p className="text-slate-600 mb-6">Indiana offers several programs that help seniors afford long term care, depending on income, assets, and care needs.</p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">1. Indiana Aged and Disabled Medicaid Waiver</h3>
                  <p className="text-slate-600 mb-2">Covers: assisted living, memory care, home based care, adult day services.</p>
                  <p className="text-sm text-slate-500 mb-2">This waiver is administered by the Division of Aging under FSSA.</p>
                  <div className="flex gap-4 text-sm">
                    <a href="https://www.in.gov/fssa/da" className="text-primary-600 hover:underline">Website</a>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-700">Phone: 888-673-0002</span>
                  </div>
                  <p className="text-sm text-slate-500 mt-2">Families must complete a state-level assessment through their local Area Agency on Aging.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">2. Residential Care Assistance Program (RCAP)</h3>
                  <p className="text-slate-600">Helps pay for room and board in designated licensed facilities for low income seniors. This is a lesser known program and availability varies by county.</p>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">3. Program of All-Inclusive Care for the Elderly (PACE)</h3>
                  <p className="text-slate-600 mb-2">Provides comprehensive care for eligible seniors who want to avoid nursing home placement.</p>
                  <a href="https://www.in.gov/fssa/pace" className="text-primary-600 hover:underline text-sm">Website</a>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">4. Veterans Benefits</h3>
                  <p className="text-slate-600 mb-2">Indiana has a large veteran population. Wartime veterans may qualify for: Aid and Attendance, Housebound Benefits, State veterans homes.</p>
                  <div className="flex gap-4 text-sm">
                    <a href="https://www.in.gov/dva" className="text-primary-600 hover:underline">Website</a>
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-700">Phone: 317-232-3910</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Where to Get Help */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Where to Get Help Navigating Care in Indiana</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-6 rounded-lg">
                  <h3 className="font-bold text-slate-900 mb-2">Area Agencies on Aging (AAA)</h3>
                  <p className="text-sm text-slate-600 mb-4">These are your primary resource for long term care navigation. They help with: Medicaid waiver applications, care planning, case management, options counseling.</p>
                  <a href="https://www.in.gov/fssa/da/area-agencies-on-aging" className="text-primary-600 hover:underline text-sm font-medium">Find your local AAA →</a>
                </div>

                <div className="bg-slate-50 p-6 rounded-lg">
                  <h3 className="font-bold text-slate-900 mb-2">Indiana Long Term Care Ombudsman</h3>
                  <p className="text-sm text-slate-600 mb-4">Helps families resolve facility problems, advocate for residents, and file complaints.</p>
                  <div className="text-sm text-slate-700 mb-2">Phone: 800-622-4484</div>
                  <a href="https://www.in.gov/fssa/da/long-term-care-ombudsman" className="text-primary-600 hover:underline text-sm font-medium">Website →</a>
                </div>

                <div className="bg-slate-50 p-6 rounded-lg">
                  <h3 className="font-bold text-slate-900 mb-2">SHIP (State Health Insurance Assistance Program)</h3>
                  <p className="text-sm text-slate-600 mb-4">Free help with Medicare, Medicare Advantage, and supplements.</p>
                  <div className="text-sm text-slate-700 mb-2">Phone: 800-452-4800</div>
                  <a href="https://www.in.gov/ship" className="text-primary-600 hover:underline text-sm font-medium">Website →</a>
                </div>
              </div>
            </section>

            {/* Complaints */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-red-600" />
                How to File a Complaint Against a Facility
              </h2>
              <p className="text-slate-600 mb-6">If you believe a resident is unsafe, neglected, or receiving poor care:</p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-slate-900">Contact the Ombudsman</h3>
                    <p className="text-slate-600">800-622-4484</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-slate-900">File a complaint with IDOH</h3>
                    <p className="text-slate-600">Online: <a href="https://www.in.gov/health" className="text-primary-600 hover:underline">in.gov/health</a></p>
                    <p className="text-slate-600">Phone: 800-246-8909</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-slate-900">Request an inspection</h3>
                    <p className="text-slate-600">IDOH may perform an onsite survey. Families often do not realize they have the right to request this.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Citations */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Citations and Inspection Reports</h2>
              <p className="text-slate-600 mb-4">
                Indiana publishes inspection findings for Residential Care Facilities and Nursing Homes, but the data is structured poorly and inconsistently across counties.
              </p>
              <p className="text-slate-600 mb-4">
                Until an automated dataset exists, facilities will display:
              </p>
              <ul className="list-disc list-inside text-slate-600 ml-2 mb-4">
                <li>last inspection date</li>
                <li>number of violations</li>
                <li>severity assessment</li>
              </ul>
              <p className="text-sm text-slate-500 italic">Full citation reports will be added once reliable ingestable data becomes available.</p>
            </section>

            {/* Alzheimer's Help */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Help for Alzheimer’s and Memory Care</h2>
              
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Indiana Alzheimer’s Disease and Dementia Programs</h3>
                  <a href="https://www.alz.org/indiana" className="text-primary-600 hover:underline block mb-2">https://www.alz.org/indiana</a>
                  <p className="text-slate-600 text-sm">Helps with: support groups, care planning, safety resources, caregiver relief programs.</p>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 mb-2">Safe Return / MedicAlert Alaska Program</h3>
                  <p className="text-slate-600 text-sm">For wandering behavior.</p>
                </div>
              </div>
            </section>

            {/* Cities */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse Assisted Living in Indiana Cities</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {INDIANA_CITIES.map((city) => (
                  <Link 
                    key={city}
                    to={`/assisted-living/indiana/${city.toLowerCase().replace(' ', '-')}`}
                    className="block p-4 bg-slate-50 rounded-lg text-center hover:bg-primary-50 hover:text-primary-700 transition-colors"
                  >
                    <span className="font-medium text-slate-900">{city}</span>
                  </Link>
                ))}
              </div>
            </section>

            {/* Summary */}
            <section className="bg-primary-50 rounded-xl p-8 border border-primary-100">
              <h2 className="text-xl font-bold text-primary-900 mb-4">Summary</h2>
              <p className="text-primary-800 leading-relaxed">
                Indiana offers multiple senior care options, but the system is confusing, and very few families know about Medicaid waivers, complaint rights, or which agencies can actually help. This state guide exists to give you clarity and remove the pressure and sales tactics common in traditional referral agencies.
              </p>
            </section>

          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 sticky top-24">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Need Help Now?</h3>
              <p className="text-slate-600 text-sm mb-6">
                Our directory is free and transparent. We don't sell your info.
              </p>
              <Link 
                to="/search" 
                className="block w-full bg-primary-600 text-white text-center py-3 rounded-lg font-bold hover:bg-primary-700 transition-colors mb-4"
              >
                Search Directory
              </Link>
              <div className="text-center">
                <p className="text-sm text-slate-500 mb-2">Are you a provider?</p>
                <Link to="/claim-business" className="text-primary-600 font-medium hover:underline text-sm">
                  Claim your free profile
                </Link>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
