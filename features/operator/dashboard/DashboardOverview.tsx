import React from 'react';
import {
  BarChart3,
  Building2,
  CheckCircle,
  LayoutDashboard,
  Mail,
  Phone,
  TrendingUp,
} from 'lucide-react';

type DashboardOverviewProps = {
  onGoToListings: () => void;
  onGoToLeads: () => void;
  onViewPublicProfile: () => void;
};

const recentLeads = [
  { name: 'Jona Smith', date: '03/22/2023', type: 'Inquiry Form', status: 'New', phone: '(555) 555-0111', email: 'jona@example.com' },
  { name: 'John Anthrena', date: '03/22/2023', type: 'Inquiry Form', status: 'Contacted', phone: '(555) 555-0112', email: 'john@example.com' },
  { name: 'Barky Jason', date: '03/22/2023', type: 'Inquiry Form', status: 'Follow-up', phone: '(555) 555-0113', email: 'barky@example.com' },
];

const leadAttribution = [
  { label: 'Google', value: 18 },
  { label: 'SilverTech', value: 12 },
  { label: 'Direct Link', value: 9 },
  { label: 'Referral', value: 6 },
];

const kpis = [
  { label: 'Profile Views', value: '1,250' },
  { label: 'Leads Received', value: '45' },
  { label: 'Estimated Move-Ins', value: '3' },
  { label: 'Estimated Revenue', value: '$18,000' },
  { label: 'Avg. Response Time', value: '1h 12m' },
];

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onGoToListings,
  onGoToLeads,
  onViewPublicProfile,
}) => {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <section className="space-y-6 lg:col-span-4">
        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-charcoal">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={onViewPublicProfile}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3 font-medium text-white"
            >
              <LayoutDashboard className="h-4 w-4" />
              View Public Profile
            </button>
            <button
              onClick={onGoToListings}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal/80 py-3 font-medium text-white"
            >
              <Building2 className="h-4 w-4" />
              Edit Listing
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Premium Benefits</h2>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
              <CheckCircle className="h-5 w-5" />
            </div>
          </div>
          <div className="space-y-3 text-sm text-charcoal/70">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gold" />
              Featured placement in results
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gold" />
              Enhanced visibility across the directory
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-gold" />
              Priority support for family inquiries
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Lead Attribution</h2>
            <span className="text-xs text-charcoal/40">Last 30 days</span>
          </div>
          <div className="space-y-3">
            {leadAttribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between text-sm text-charcoal/70">
                  <span>{item.label}</span>
                  <span className="font-semibold text-charcoal">{item.value}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-warm-gray">
                  <div className="h-2 rounded-full bg-charcoal/90" style={{ width: `${(item.value / 20) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-6 lg:col-span-8">
        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-charcoal/60">
                Your listing is performing better than 68% of homes in your area.
              </p>
              <h2 className="mt-1 text-lg font-semibold text-charcoal">Performance Overview</h2>
            </div>
            <div className="flex items-center gap-1 text-xs text-charcoal/60">
              <TrendingUp className="h-4 w-4" />
              Updated today
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {kpis.map((stat) => (
              <div key={stat.label} className="rounded-xl border border-warm-gray p-4 text-center">
                <p className="text-xs uppercase text-charcoal/60">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-charcoal">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-charcoal">Recent Leads</h2>
            <button onClick={onGoToLeads} className="text-sm text-charcoal/60 hover:text-charcoal">
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-warm-gray text-left text-charcoal/60">
                  <th className="py-2">Name</th>
                  <th className="py-2">Date</th>
                  <th className="py-2">Inquiry Type</th>
                  <th className="py-2">Status</th>
                  <th className="py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-charcoal">
                {recentLeads.map((lead) => (
                  <tr key={lead.name} className="border-b border-warm-gray">
                    <td className="py-3 font-medium">{lead.name}</td>
                    <td className="py-3">{lead.date}</td>
                    <td className="py-3">{lead.type}</td>
                    <td className="py-3">
                      <span className="rounded-full bg-warm-gray px-2 py-1 text-xs font-medium text-charcoal">
                        {lead.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal text-white"
                          aria-label={`Call ${lead.name}`}
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                        <a
                          href={`mailto:${lead.email}`}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-charcoal/80 text-white"
                          aria-label={`Email ${lead.name}`}
                        >
                          <Mail className="h-4 w-4" />
                        </a>
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="rounded-full bg-charcoal px-4 py-1 text-xs font-medium text-white"
                        >
                          Call
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-warm-gray bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-charcoal/60" />
              <h2 className="text-lg font-semibold text-charcoal">Analytics</h2>
            </div>
            <select className="rounded-full border border-warm-gray px-3 py-1 text-sm text-charcoal/70">
              <option>Past month</option>
              <option>Past 3 months</option>
              <option>Past year</option>
            </select>
          </div>
          <div className="relative h-48 overflow-hidden rounded-xl border border-dashed border-warm-gray bg-warm-white">
            <svg viewBox="0 0 600 200" className="absolute inset-0 h-full w-full">
              <path
                d="M0 160 C80 120, 140 120, 200 140 C260 160, 320 60, 380 80 C440 100, 520 40, 600 70"
                fill="none"
                stroke="#2D2D2D"
                strokeWidth="3"
              />
              <path
                d="M0 160 C80 120, 140 120, 200 140 C260 160, 320 60, 380 80 C440 100, 520 40, 600 70 L600 200 L0 200 Z"
                fill="rgba(45, 45, 45, 0.08)"
              />
            </svg>
          </div>
        </div>
      </section>
    </div>
  );
};

