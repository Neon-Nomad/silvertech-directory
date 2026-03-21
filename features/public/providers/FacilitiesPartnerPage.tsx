import React, { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  ShieldCheck,
  Star,
  TrendingUp,
  Target,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const DOMINATOR_MONTHLY_PRICE = 499;
const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export const FacilitiesPartnerPage: React.FC = () => {
  const navigate = useNavigate();
  const [annualMoveIns, setAnnualMoveIns] = useState(12);
  const [monthlyRent, setMonthlyRent] = useState(6200);
  const [referralFeePercent, setReferralFeePercent] = useState(100);

  const referralMath = useMemo(() => {
    const safeMoveIns = clamp(Number.isFinite(annualMoveIns) ? annualMoveIns : 0, 0, 500);
    const safeRent = clamp(Number.isFinite(monthlyRent) ? monthlyRent : 0, 0, 100000);
    const safePercent = clamp(Number.isFinite(referralFeePercent) ? referralFeePercent : 0, 0, 100);
    const referralCostPerMoveIn = safeRent * (safePercent / 100);
    const annualReferralTax = safeMoveIns * referralCostPerMoveIn;
    const annualSilverTechCost = DOMINATOR_MONTHLY_PRICE * 12;
    const netSavings = annualReferralTax - annualSilverTechCost;
    const breakEvenMoveIns = referralCostPerMoveIn > 0 ? Math.ceil(annualSilverTechCost / referralCostPerMoveIn) : 0;

    return {
      safeMoveIns,
      safeRent,
      safePercent,
      annualReferralTax,
      annualSilverTechCost,
      netSavings,
      breakEvenMoveIns,
    };
  }, [annualMoveIns, monthlyRent, referralFeePercent]);

  return (
    <div className="min-h-screen bg-warm-gray text-slate-900">
      <Helmet>
        <title>For Facilities | SilverTech Partners</title>
        <meta
          name="description"
          content="Direct leads for senior living operators with zero referral commissions, verified profiles, and transparent listing plans."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/for-facilities" />
      </Helmet>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-slate-900 leading-tight mb-4">
            Direct Leads. Zero Referral Fees. <span className="text-primary-600">Total Brand Control.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            SilverTech helps families find your community directly with verified data, clear pricing signals, and no commission
            middlemen.
          </p>
          <div className="mt-6 rounded-lg border border-primary-200 bg-primary-50 text-primary-800 px-5 py-4 max-w-3xl mx-auto">
            Typical referral commissions can cost <strong>$5,000 to $10,000+ per move-in</strong>. SilverTech keeps lead economics
            predictable with a fixed subscription model.
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button variant="primary" onClick={() => navigate('/claim-business')}>
              Claim Free Listing
            </Button>
            <Button variant="outline" onClick={() => navigate('/for-facilities/pricing')}>
              Compare Plans
            </Button>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <img
              src="/images/facilities-dashboard-hero.svg"
              alt="SilverTech operator dashboard preview"
              className="w-full h-64 object-cover object-left"
              loading="eager"
              decoding="async"
            />
          </div>
          <Card>
            <h2 className="text-2xl font-serif font-semibold mb-4">Listing Tiers</h2>
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">Claimed Listing</span>
                  <span className="text-xs uppercase tracking-widest text-slate-400">
                    Free listing
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">The Baseline</p>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>Show verified facility contact and service basics</li>
                  <li>Appear in city and state discovery results</li>
                  <li>Display public profile trust signals</li>
                  <li>Access claim login and setup workflow</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-900">Protector</span>
                  <span className="text-xs font-semibold text-slate-500">$99/mo</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">For Brand-Conscious Operators</p>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-primary-600" /> Verify operator identity and profile ownership
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-600" /> Protect your listing from stale or inaccurate status signals
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-600" /> Track verified unique interest from calls, directions, and
                    comparisons
                  </li>
                </ul>
              </div>
              <div className="border-2 border-primary-500 rounded-lg p-5 bg-white shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-primary-700">Accelerator</span>
                  <span className="text-[10px] uppercase tracking-widest bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">For Growth-Focused Teams</p>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" /> Capture no-results demand with Express Interest prompts
                  </li>
                  <li className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-primary-600" /> Increase local visibility using profile health ranking signals
                  </li>
                  <li className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary-600" /> Add high-intent tour CTAs on results where families decide
                  </li>
                </ul>
                <p className="mt-3 text-xs text-slate-500">$249/mo</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-900">Dominator</span>
                  <span className="text-xs font-semibold text-slate-500">$499/mo</span>
                </div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">For Market Leaders</p>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-600" /> Gain market intelligence on local comparison behavior
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" /> Model ROI using your actual rent and conversion assumptions
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary-600" /> Own authority placement with pinned Q&A and featured trust blocks
                  </li>
                </ul>
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => navigate('/claim-business')}
                >
                  Start Dominator
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <section>
          <Card>
            <h2 className="text-2xl font-serif font-semibold mb-2">Referral Leakage Calculator</h2>
            <p className="text-sm text-slate-600 mb-6">
              Estimate what referral commissions can cost your community versus a fixed SilverTech subscription.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Annual Move-ins
                </label>
                <input
                  type="number"
                  min={0}
                  max={500}
                  value={referralMath.safeMoveIns}
                  onChange={(event) => setAnnualMoveIns(clamp(Number(event.target.value), 0, 500))}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Average Monthly Rent
                </label>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  step={100}
                  value={referralMath.safeRent}
                  onChange={(event) => setMonthlyRent(clamp(Number(event.target.value), 0, 100000))}
                  className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Referral Fee %
                </label>
                <input
                  type="range"
                  min={50}
                  max={100}
                  step={5}
                  value={referralMath.safePercent}
                  onChange={(event) => setReferralFeePercent(clamp(Number(event.target.value), 50, 100))}
                  className="w-full"
                />
                <p className="text-sm text-slate-600 mt-1">{referralMath.safePercent}% of first month rent</p>
              </div>
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4">
                <p className="text-xs uppercase tracking-widest text-rose-700 font-semibold">Estimated Referral Cost</p>
                <p className="text-2xl font-semibold text-rose-900 mt-2">{currency.format(referralMath.annualReferralTax)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">SilverTech Annual Cost</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">{currency.format(referralMath.annualSilverTechCost)}</p>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-widest text-emerald-700 font-semibold">Potential Net Difference</p>
                <p className="text-2xl font-semibold text-emerald-900 mt-2">{currency.format(referralMath.netSavings)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-widest text-slate-500 font-semibold">Break-even Move-ins</p>
                <p className="text-2xl font-semibold text-slate-900 mt-2">{referralMath.breakEvenMoveIns}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              Estimate only. Actual referral agreements and conversion economics vary by market and contract terms.
            </p>
          </Card>
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-primary-400" />
            <h2 className="text-2xl font-serif font-semibold">The Transparency Pledge</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Premium partners commit to verified pricing and availability. We never manipulate reviews or hide data for profit.
          </p>
        </section>

        <section id="claim-listing">
          <Card>
            <h2 className="text-2xl font-serif font-semibold mb-2">Claim Your Free Listing</h2>
            <p className="text-sm text-slate-600 mb-6">
              Start with profile ownership now. You can upgrade plans after your listing is verified.
            </p>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Facility Name
                </label>
                <input className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="Whispering Oaks Gardens" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Owner / Administrator Name
                </label>
                <input className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Work Email
                </label>
                <input type="email" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="admin@facility.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Phone Number
                </label>
                <input type="tel" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="(555) 000-0000" />
              </div>
              <Button type="submit" variant="primary" className="w-full">Claim Free Listing</Button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-4">
              By submitting, you agree to our Terms and Privacy Policy. Our team will verify credentials within 24 hours.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
};
