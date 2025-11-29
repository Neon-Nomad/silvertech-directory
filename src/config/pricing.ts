// Pricing configuration for user-centric billing
export interface PricingPlan {
    id: string;
    name: string;
    price: number;
    priceLabel: string;
    stripePriceId: string;
    slotCount: number;
    features: string[];
    popular?: boolean;
    badge?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
    {
        id: 'free',
        name: 'Free Listing',
        price: 0,
        priceLabel: 'Free',
        stripePriceId: 'price_free',
        slotCount: 0,
        features: [
            'Basic directory listing',
            'Contact information displayed',
            'Standard search visibility',
            'No photos or enhanced features',
        ],
    },
    {
        id: 'featured',
        name: 'Featured Listing',
        price: 99,
        priceLabel: '$99/mo',
        stripePriceId: 'price_featured_monthly',
        slotCount: 3,
        popular: true,
        features: [
            'Up to 3 facility profiles',
            'Enhanced search placement',
            'Photo gallery (up to 10 photos)',
            'Pricing transparency badge',
            'Schedule-a-Tour button',
            'Basic analytics dashboard',
            'Priority support',
        ],
    },
    {
        id: 'priority',
        name: 'Priority Listing',
        price: 299,
        priceLabel: '$299/mo',
        stripePriceId: 'price_priority_monthly',
        slotCount: 10,
        features: [
            'Up to 10 facility profiles',
            'Top search placement',
            'Unlimited photos & virtual tour embed',
            'Pricing transparency badge',
            'Schedule-a-Tour button',
            'Advanced analytics & monthly PDF reports',
            'Featured in city/state pages',
            'Dedicated lead email forwarding',
            'Priority support',
        ],
    },
    {
        id: 'lead_suite',
        name: 'Lead Capture Suite',
        price: 499,
        priceLabel: '$499/mo',
        stripePriceId: 'price_leadsuite_monthly',
        slotCount: 25,
        badge: 'BEST VALUE',
        features: [
            'Up to 25 facility profiles',
            'Premium top placement',
            'All Priority features',
            'AI Missed Call Lead Integration',
            'AI call transcription & lead scoring',
            'Automatic SMS lead notifications',
            'CRM integration support',
            'Dedicated account manager',
            '24/7 priority support',
        ],
    },
];

// Helper to get plan by ID
export const getPlanById = (planId: string): PricingPlan | undefined => {
    return PRICING_PLANS.find(plan => plan.id === planId);
};

// Helper to get plan by Stripe Price ID
export const getPlanByPriceId = (priceId: string): PricingPlan | undefined => {
    return PRICING_PLANS.find(plan => plan.stripePriceId === priceId);
};
