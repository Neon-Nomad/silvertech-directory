import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PRICING_PLANS } from '@/src/config/pricing';
import { useDialogFocusManagement } from '@/src/hooks/useDialogFocusManagement';
import { trackEvent } from '@/src/utils/analytics';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'verified-answers' | 'official-faqs';
}

const featureCopy: Record<UpgradeModalProps['feature'], string> = {
  'verified-answers': 'Unlock Verified Answers',
  'official-faqs': 'Unlock Official FAQ Publishing',
};

export const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, feature }) => {
  const dialogRef = useDialogFocusManagement<HTMLDivElement>({ isOpen, onClose });
  React.useEffect(() => {
    if (!isOpen) return;
    trackEvent('qa_upgrade_modal_shown', { feature });
  }, [isOpen, feature]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qa-upgrade-modal-title"
        className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-warm-gray max-h-[90vh] overflow-y-auto"
      >
        <div className="p-5 border-b border-warm-gray flex items-start justify-between gap-3">
          <div>
            <h2 id="qa-upgrade-modal-title" className="text-xl font-bold text-charcoal">
              {featureCopy[feature]}
            </h2>
            <p className="text-sm text-charcoal/70 mt-1">
              Verified operator responses and premium Q&A visibility are included in paid plans.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close upgrade modal"
            className="rounded-full p-2 hover:bg-warm-gray"
          >
            <X className="w-5 h-5 text-charcoal/70" />
          </button>
        </div>

        <div className="p-5 grid gap-4 md:grid-cols-3">
          {PRICING_PLANS.filter((plan) => plan.id !== 'free').map((plan) => (
            <div key={plan.id} className="rounded-xl border border-warm-gray p-4 bg-white">
              <p className="text-sm uppercase tracking-wider text-charcoal/60">{plan.name}</p>
              <p className="text-2xl font-bold text-charcoal mt-1">{plan.priceLabel}</p>
              <ul className="mt-3 space-y-1 text-sm text-charcoal/70">
                {plan.features.slice(0, 4).map((featureLine) => (
                  <li key={featureLine}>- {featureLine}</li>
                ))}
              </ul>
              <Button
                className="w-full mt-4"
                onClick={() => {
                  trackEvent('qa_upgrade_clicked', { feature, plan: plan.id });
                  window.location.href = plan.paymentLink;
                }}
              >
                Upgrade
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
