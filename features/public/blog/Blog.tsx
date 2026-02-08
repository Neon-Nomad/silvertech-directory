import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, ShieldCheck, AlertTriangle, FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Helmet } from 'react-helmet-async';

export const Blog: React.FC = () => {
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const posts = [
    {
      id: 1,
      title: "The Hidden Costs of Dementia Care: What Your Budget Max Misses",
      excerpt: "Base rent is just the beginning. Learn about care levels, medication management fees, and incontinence supplies that can double your monthly bill.",
      category: "Financial Planning",
      icon: <AlertTriangle className="w-6 h-6 text-orange-500" />,
      readTime: "5 min read",
      content: (
        <div className="space-y-8 text-lg text-slate-700 leading-relaxed">
          <p className="font-medium text-xl text-slate-900">
            Base rent is just the beginning. Learn about care levels, medication management fees, and incontinence supplies that can double your monthly bill.
          </p>
          <p>
            This is the financial reality no one prepares you for: When searching for memory care, the number on the price sheet is almost never the final number on your bill.
          </p>
          <p>
            While predatory referral agencies focus on quickly closing a deal, the cost of care can often double your monthly payment without warning. At SilverTech, our mission is to provide financial clarity so you can make decisions based on trust, not shock.
          </p>
          <p>
            Here are the three most common hidden costs you must verify before signing a contract:
          </p>

          <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-r-lg">
            <h3 className="text-xl font-bold text-orange-900 mb-2">1. The Care Level Conundrum (The Biggest Surprise)</h3>
            <p className="mb-4">Most assisted living facilities—even those with memory care units—use a tiered pricing model based on "levels of care."</p>
            <ul className="space-y-2">
              <li><strong>Initial Quote:</strong> Often based on "Level 1" or "Base Rent," which assumes the resident is relatively independent.</li>
              <li><strong>The Reality:</strong> If your loved one needs frequent assistance (e.g., help with dressing, bathing, or mobility), they will be assessed within the first 30 days and moved to "Level 3" or "Level 4."</li>
              <li><strong>The Cost Jump:</strong> Each jump in level typically adds $500 to $1,500 per month to your bill. For families dealing with moderate to late-stage dementia, a Level 4 placement is often mandatory from the start.</li>
            </ul>
            <p className="mt-4 font-bold text-orange-800">Action: Always ask for the price breakdown for the highest expected level of care and insist on seeing the facility's official assessment criteria before touring.</p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">2. Medication Management and Supply Fees</h3>
            <p className="mb-4">Medication management is non-negotiable for memory care, but the cost structure is often separate from the base rent.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Medication Administration Fee:</strong> This fee covers the staff's time in managing, sorting, and dispensing medication. It can range from $150 to $400 per month.</li>
              <li><strong>Incontinence Supplies:</strong> This is one of the most frequently hidden costs. If the facility provides diapers, wipes, and laundry service associated with incontinence, expect a recurring monthly fee that can range from $100 to $300, or they may require you to purchase and supply them yourself.</li>
            </ul>
            <p className="mt-4 italic">Action: Verify if medication management and supplies are included in the base rent, or if they are billed separately by a third-party pharmacy.</p>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">3. Move-In Fees and Community Fees</h3>
            <p className="mb-4">These are one-time costs that act as an upfront tax on your placement decision.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Community Fee / Move-In Fee:</strong> This one-time, non-refundable charge can range from $1,000 up to the cost of one full month's rent ($4,500 - $7,000). Facilities use this fee to cover administration, cleaning, and occasionally, sales commissions.</li>
            </ul>
            <p className="mt-4 italic">Action: Ask for the exact amount and whether it is refundable. Because SilverTech is 100% commission-free, the facilities you find here should have lower administrative overhead, giving them the flexibility to charge a lower move-in fee.</p>
          </div>

          <div className="bg-primary-50 p-8 rounded-2xl text-center border border-primary-100">
            <h3 className="text-2xl font-bold text-primary-900 mb-4">Ready to Use Transparent Data?</h3>
            <p className="text-primary-800 mb-6">
              Navigating these hidden costs is stressful. Our CareFinder Survey uses the financial information we collect from verified, commission-free facilities to match you based on total cost transparency, not just base rent.
            </p>
            <Link to="/survey">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto">
                Start the CareFinder Survey Now
              </Button>
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 2,
      title: "How to Read a State Citation Report (TX, FL, CA Explained)",
      excerpt: "Don't let 'deficiencies' scare you without context. We break down the difference between administrative paperwork errors and actual patient harm.",
      category: "Trust & Safety",
      icon: <FileText className="w-6 h-6 text-blue-500" />,
      readTime: "7 min read",
      content: (
        <div className="space-y-8 text-lg text-slate-700 leading-relaxed">
          <p className="font-medium text-xl text-slate-900">
            Don't let 'deficiencies' scare you without context. We break down the difference between administrative paperwork errors and actual patient harm.
          </p>
          <p>
            At SilverTech, we believe radical transparency is the only way to find safe care. That’s why every facility profile links directly to its official state inspection report.
          </p>
          <p>
            However, these reports—which use terms like "deficiency" and "citation"—are written by regulators, not for families. They often create panic without context. The truth is: a citation does not always mean bad care.
          </p>
          <p>
            Here is your essential guide to reading state inspection reports in our launch states (Texas, Florida, and California), so you can understand the difference between a paperwork error and a genuine threat to safety.
          </p>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">1. Understanding the Severity Score (The Most Critical Filter)</h3>
            <p className="mb-4">The most important step is looking past the mere existence of a citation and checking its severity level. Every state uses a scale, and you must know what the letters mean.</p>
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                <h4 className="font-bold text-green-800 mb-2">Low Severity (Paperwork)</h4>
                <p className="text-sm mb-3">These are usually administrative or environmental issues that had no resident impact.</p>
                <p className="text-sm mb-2"><strong>Examples:</strong> Not submitting training documentation on time; expired fire extinguisher tags; missing a required facility policy document.</p>
                <p className="text-sm font-bold text-green-700">Verdict: These are common issues. They indicate poor administration, not necessarily poor care.</p>
              </div>

              <div className="bg-red-50 border border-red-200 p-6 rounded-lg">
                <h4 className="font-bold text-red-800 mb-2">High Severity (Harm)</h4>
                <p className="text-sm mb-3">These are issues that caused actual harm or represent immediate danger to residents.</p>
                <p className="text-sm mb-2"><strong>Examples:</strong> Medication errors resulting in hospitalization; failure to implement fall-prevention measures; failure to maintain proper staffing levels; physical or verbal abuse.</p>
                <p className="text-sm font-bold text-red-700">Verdict: These are red flags. Look for patterns of high-severity citations (especially C, D, and E below).</p>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">2. The California System (The RCFE Scale)</h3>
            <p className="mb-4">California's Community Care Licensing Division (CCLD) focuses on classifying the violations clearly:</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-900 font-bold">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Violation Code</th>
                    <th className="p-3">Definition</th>
                    <th className="p-3 rounded-tr-lg">Family Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border border-slate-200">
                  <tr className="bg-red-50">
                    <td className="p-3 font-bold text-red-800">Type A</td>
                    <td className="p-3">Immediate Health/Safety Risk. The deficiency caused, or could cause, death or serious injury.</td>
                    <td className="p-3 font-bold text-red-800">CRITICAL RED FLAG. Requires immediate correction and often leads to fines.</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td className="p-3 font-bold text-orange-800">Type B</td>
                    <td className="p-3">Risk to Health or Safety. A less severe violation that still has an impact on the resident.</td>
                    <td className="p-3 font-bold text-orange-800">Serious Concern. Indicates a system failure that needs deep investigation.</td>
                  </tr>
                  <tr className="bg-green-50">
                    <td className="p-3 font-bold text-green-800">Type C</td>
                    <td className="p-3">Minor Technical Violation. Paperwork or environment maintenance issues.</td>
                    <td className="p-3 font-bold text-green-800">Minimal Concern. Ask the facility what was done to correct the documentation.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">3. The Texas & Florida System (Focusing on Scope and Severity)</h3>
            <p className="mb-4">Texas (HHSC) and Florida (AHCA) often use scales that combine the severity (the actual harm caused) with the scope (how many residents were affected).</p>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-100 text-slate-900 font-bold">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Severity Level</th>
                    <th className="p-3">Definition (Harm)</th>
                    <th className="p-3">Scope (How Many Affected)</th>
                    <th className="p-3 rounded-tr-lg">Family Takeaway</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 border border-slate-200">
                  <tr className="bg-green-50">
                    <td className="p-3 font-bold text-green-800">A</td>
                    <td className="p-3">Potential for Minimal Harm</td>
                    <td className="p-3">Isolated incident.</td>
                    <td className="p-3 font-bold text-green-800">Low risk.</td>
                  </tr>
                  <tr className="bg-orange-50">
                    <td className="p-3 font-bold text-orange-800">B</td>
                    <td className="p-3">Minimal Harm/No Harm Caused</td>
                    <td className="p-3">Pattern (Multiple residents).</td>
                    <td className="p-3 font-bold text-orange-800">Moderate risk. Indicates a systemic problem.</td>
                  </tr>
                  <tr className="bg-red-50">
                    <td className="p-3 font-bold text-red-800">C</td>
                    <td className="p-3">Actual Harm (Injury, Illness)</td>
                    <td className="p-3">Widespread (Facility-wide problem).</td>
                    <td className="p-3 font-bold text-red-800">Major Red Flag. This facility has systemically failed residents.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h3 className="text-xl font-bold text-blue-900 mb-4">The SilverTech Action Plan for Families</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">1.</span>
                <p><strong>Don't Panic at the Citation Count:</strong> A facility with 10 minor Type C citations may be safer than a facility with one recent Type A citation. Focus on the type, not the quantity.</p>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">2.</span>
                <p><strong>Verify the Correction:</strong> For any citation (especially high-severity ones), ask the facility: "What was your official Plan of Correction, and can you show me the evidence that the state approved it?"</p>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">3.</span>
                <p><strong>Use Our Data:</strong> Compare the citation history with the Verified Review Scorecard (Staff Responsiveness, Quality of Care). If a facility has high staff turnover and a high-severity citation, that is a clear signal to avoid it.</p>
              </li>
            </ul>
          </div>

          <div className="bg-primary-50 p-8 rounded-2xl text-center border border-primary-100">
            <h3 className="text-2xl font-bold text-primary-900 mb-4">Ready to Use Transparent Data?</h3>
            <p className="text-primary-800 mb-6">
              Navigating these regulatory reports is stressful. Our CareFinder Survey ensures you are only matched with facilities that have proven a commitment to transparency and correction.
            </p>
            <Link to="/survey">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto">
                Start the CareFinder Survey Now
              </Button>
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 3,
      title: "The 4 Red Flags: How to Spot High Staff Turnover on a Facility Tour",
      excerpt: "Staff turnover is the #1 predictor of care quality. Here are the subtle signs to look for when you walk through the door.",
      category: "Quality Control",
      icon: <ShieldCheck className="w-6 h-6 text-red-500" />,
      readTime: "4 min read",
      content: (
        <div className="space-y-8 text-lg text-slate-700 leading-relaxed">
          <p className="font-medium text-xl text-slate-900">
            Staff turnover is the #1 predictor of care quality. Here are the subtle signs to look for when you walk through the door.
          </p>
          <p>
            At SilverTech, we collect and display Annual Care Staff Turnover Rate because it is the single greatest indicator of a facility's stability and resident quality of life. High turnover means caregivers are stressed, training is inadequate, and, most importantly, your loved one will constantly have new faces—a major source of confusion and distress for dementia patients.
          </p>
          <p>
            A good facility will have staff turnover under 25% annually. Many struggling facilities run over 50%.
          </p>
          <p>
            Since you can't just ask the manager, here are the four non-verbal red flags you must look for during your facility tour:
          </p>

          <div className="grid gap-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-3">1. The "Whose Job Is This?" Syndrome (Staff Knowledge)</h3>
              <p className="mb-4">The best indicator of high turnover is the caregiver's knowledge of the resident's specific routine, history, and preferences.</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                    <span className="font-bold text-red-600 min-w-[80px]">Red Flag:</span>
                    <p className="text-sm">You ask a staff member a basic question about a resident (e.g., "What is Mrs. Smith's favorite afternoon activity?" or "When does Mr. Jones usually take his nap?"). The staff member replies, "I'm not sure, I just started this week," or "You'd have to ask the usual person."</p>
                </div>
                <div className="flex gap-3">
                    <span className="font-bold text-slate-600 min-w-[80px]">Implication:</span>
                    <p className="text-sm">This confirms a high volume of new or temporary staff who have not been adequately trained or connected with the residents, leading to inconsistent, task-focused care.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-3">2. The Missing Whiteboards (Communication Failure)</h3>
              <p className="mb-4">High turnover makes documentation and information transfer critical, yet often chaotic.</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                    <span className="font-bold text-red-600 min-w-[80px]">Red Flag:</span>
                    <p className="text-sm">Look for key communication tools that are blank, generic, or outdated. This includes the daily activities board, the meal menu posted in the kitchen, or the communication log near the nurse's station.</p>
                </div>
                <div className="flex gap-3">
                    <span className="font-bold text-slate-600 min-w-[80px]">Implication:</span>
                    <p className="text-sm">If information isn't being recorded in a centralized, visible manner, it means critical care notes (like hydration status or mood changes) are being lost during shift changes—a major safety hazard.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-3">3. The Atmosphere of Rushed Chaos (Staff Stress)</h3>
              <p className="mb-4">In homes with high turnover, the remaining staff are overworked, stressed, and focused purely on urgent tasks.</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                    <span className="font-bold text-red-600 min-w-[80px]">Red Flag:</span>
                    <p className="text-sm">Staff members avoid eye contact, speak quickly and curtly, or are constantly running between rooms. You may see staff huddled together, complaining or looking deeply fatigued.</p>
                </div>
                <div className="flex gap-3">
                    <span className="font-bold text-slate-600 min-w-[80px]">Implication:</span>
                    <p className="text-sm">Staff who are always rushed cannot provide the patient, person-centered engagement that memory care requires. They are focused on tasks (meds, feeding) rather than quality of life.</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
              <h3 className="text-xl font-bold text-slate-900 mb-3">4. The "No One Is Around" Effect (Understaffing)</h3>
              <p className="mb-4">While good staffing ratios are essential, look for signs of intentional staff invisibility designed to cut costs.</p>
              <div className="space-y-3">
                <div className="flex gap-3">
                    <span className="font-bold text-red-600 min-w-[80px]">Red Flag:</span>
                    <p className="text-sm">The facility has long stretches where you see no staff members in common areas or hallways, or you see the same staff member performing multiple roles (e.g., serving food and then immediately helping a resident transfer).</p>
                </div>
                <div className="flex gap-3">
                    <span className="font-bold text-slate-600 min-w-[80px]">Implication:</span>
                    <p className="text-sm">High turnover often leads directly to understaffing. The state requires a minimum ratio, but a facility running lean to save money is placing residents at risk, confirming poor financial management.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-primary-50 p-8 rounded-2xl text-center border border-primary-100">
            <h3 className="text-2xl font-bold text-primary-900 mb-4">Ready to Use Transparent Data?</h3>
            <p className="text-primary-800 mb-6">
              Navigating a facility tour requires knowing what questions to ask. Our CareFinder Survey ensures you are only matched with facilities that actively disclose their Staff Turnover Rate, allowing you to avoid these red flags.
            </p>
            <Link to="/survey">
              <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white w-full sm:w-auto">
                Start the CareFinder Survey Now
              </Button>
            </Link>
          </div>
        </div>
      )
    }
  ];

  const selectedPost = posts.find(p => p.id === selectedPostId);

  if (selectedPost) {
    const postTitle = `${selectedPost.title} | SilverTech Directory`;
    const postDescription = selectedPost.excerpt;
    return (
      <div className="min-h-screen bg-white font-inter">
        <Helmet>
          <title>{postTitle}</title>
          <meta name="description" content={postDescription} />
          <link rel="canonical" href="https://silvertechdirectory.com/blog" />
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="SilverTech Directory" />
          <meta property="og:title" content={postTitle} />
          <meta property="og:description" content={postDescription} />
          <meta property="og:url" content="https://silvertechdirectory.com/blog" />
          <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={postTitle} />
          <meta name="twitter:description" content={postDescription} />
          <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
        </Helmet>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Button 
            variant="ghost" 
            onClick={() => setSelectedPostId(null)}
            className="mb-8 text-slate-500 hover:text-slate-900 pl-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Blog
          </Button>

          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 bg-primary-50 px-3 py-1 rounded-full">
              {selectedPost.category}
            </span>
            <h1 className="text-3xl md:text-5xl font-bold text-slate-900 font-montserrat mt-4 mb-6 leading-tight">
              {selectedPost.title}
            </h1>
            <div className="flex items-center text-slate-500 text-sm">
              <BookOpen className="w-4 h-4 mr-2" />
              {selectedPost.readTime}
            </div>
          </div>

          <div className="prose prose-lg max-w-none text-slate-700">
            {selectedPost.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-inter">
      <Helmet>
        <title>Blog | SilverTech Directory</title>
        <meta name="description" content="Expert insights, financial truths, and safety guides to help families navigate senior living." />
        <link rel="canonical" href="https://silvertechdirectory.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Blog | SilverTech Directory" />
        <meta property="og:description" content="Expert insights, financial truths, and safety guides to help families navigate senior living." />
        <meta property="og:url" content="https://silvertechdirectory.com/blog" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog | SilverTech Directory" />
        <meta name="twitter:description" content="Expert insights, financial truths, and safety guides to help families navigate senior living." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-900 font-montserrat mb-4">
            Transparency Driven Care
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Expert insights, financial truths, and safety guides to help you navigate the complex world of senior living.
          </p>
        </div>
      </div>

      {/* Blog Posts Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
              <div className="p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {post.category}
                  </span>
                  <div className="flex items-center text-slate-400 text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    {post.readTime}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-900 mb-3 font-montserrat leading-tight">
                  {post.title}
                </h3>
                
                <p className="text-slate-600 mb-6 text-sm leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
              
              <div className="p-6 pt-0 mt-auto">
                <Button 
                  variant="outline" 
                  className="w-full group"
                  onClick={() => setSelectedPostId(post.id)}
                >
                  Read Article <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold font-montserrat mb-6">
            Ready to use transparent data?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Stop guessing. Start matching. Use our data-driven survey to find facilities that meet your budget and care needs.
          </p>
          <Link to="/survey">
            <Button size="lg" className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
              Start the Match Score Survey Now
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
