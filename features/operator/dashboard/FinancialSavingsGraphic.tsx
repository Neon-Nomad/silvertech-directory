import React from 'react';
import { TrendingUp, DollarSign, CheckCircle, XCircle } from 'lucide-react';

export const FinancialSavingsGraphic: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="bg-slate-900 p-6 text-white">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="text-green-400" />
          The SilverTech Advantage
        </h3>
        <p className="text-slate-400 text-sm mt-1">
          Stop paying "Commission Taxes" on your revenue.
        </p>
      </div>
      
      <div className="p-6 grid md:grid-cols-2 gap-8">
        {/* Incumbent Model */}
        <div className="space-y-4 opacity-75">
          <h4 className="font-semibold text-slate-500 uppercase tracking-wider text-sm border-b border-slate-100 pb-2">
            Traditional Agency
          </h4>
          <div className="flex justify-between items-center text-red-600 font-medium">
            <span>Commission (1 Month Rent)</span>
            <span>-$5,500</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>Move-in Fee</span>
            <span>$0</span>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <div className="flex justify-between items-center font-bold text-slate-900">
              <span>Net Revenue (Yr 1)</span>
              <span>$60,500</span>
            </div>
          </div>
          <ul className="text-xs text-slate-500 space-y-2 mt-4">
            <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /> Opaque Lead Ownership</li>
            <li className="flex items-center gap-2"><XCircle className="w-4 h-4 text-red-400" /> Gatekept Family Data</li>
          </ul>
        </div>

        {/* SilverTech Model */}
        <div className="space-y-4 relative">
          <div className="absolute -top-3 -right-3 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            WINNER
          </div>
          <h4 className="font-semibold text-primary-600 uppercase tracking-wider text-sm border-b border-primary-100 pb-2">
            SilverTech OS
          </h4>
          <div className="flex justify-between items-center text-slate-600">
            <span>Commission</span>
            <span className="text-green-600 font-bold">$0</span>
          </div>
          <div className="flex justify-between items-center text-slate-600">
            <span>SaaS License (Pro)</span>
            <span className="text-slate-900">-$299/mo</span>
          </div>
          <div className="pt-4 border-t border-primary-100">
            <div className="flex justify-between items-center font-bold text-primary-700 text-lg">
              <span>Net Revenue (Yr 1)</span>
              <span>$62,412</span>
            </div>
            <p className="text-xs text-green-600 font-medium mt-1 text-right">
              +$1,912 / resident saved
            </p>
          </div>
          <ul className="text-xs text-slate-600 space-y-2 mt-4">
             <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Direct Family Access</li>
             <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Own Your Leads</li>
          </ul>
        </div>
      </div>
      
      <div className="bg-green-50 p-4 text-center border-t border-green-100">
        <p className="text-green-800 font-medium text-sm">
          Average facility saves <span className="font-bold">$58,024/year</span> with SilverTech.
        </p>
      </div>
    </div>
  );
};
