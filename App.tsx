import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/src/lib/stripe';
import Navbar from '@/components/layout/Navbar';
import { Home } from '@/features/family/landing/Home';
import { ScrollToTop } from '@/components/utils/ScrollToTop';
import { ComparisonProvider } from '@/src/context/ComparisonContext';
import { GlobalSchema } from '@/components/seo/GlobalSchema';
import { LocationPrompt } from '@/components/ui/LocationPrompt';
import { AuthProvider, useAuth } from '@/src/context/AuthProvider';
import { dashboardPathForTab, normalizeDashboardTab } from '@/src/utils/dashboardRouting';
import { reportFrontendError } from '@/src/monitoring/reportError';

const DirectorySearch = lazy(() => import('@/features/family/discovery/DirectorySearch'));
const OperatorDashboard = lazy(() => import('@/features/operator/dashboard/OperatorDashboard'));
const OperatorLogin = lazy(() => import('@/features/auth/OperatorLogin'));
const OperatorSignUp = lazy(() => import('@/features/auth/OperatorSignUp'));
const PricingAudit = lazy(() => import('@/features/public/wedge-tools/PricingAudit'));
const CareFinderSurvey = lazy(() => import('@/features/family/survey/CareFinderSurvey'));
const SurveyResults = lazy(() => import('@/features/family/survey/SurveyResults'));
const ClaimFacilityPage = lazy(() => import('@/features/operator/ClaimFacilityPage').then((m) => ({ default: m.ClaimFacilityPage })));
const EditFacility = lazy(() => import('@/features/operator/dashboard/EditFacility').then((m) => ({ default: m.EditFacility })));
const ClaimBusiness = lazy(() => import('@/features/operator/claim/ClaimBusiness').then((m) => ({ default: m.ClaimBusiness })));
const PricingPage = lazy(() => import('@/features/public/pricing/PricingPage').then((m) => ({ default: m.PricingPage })));
const ForProvidersPage = lazy(() => import('@/features/public/providers/ForProvidersPage').then((m) => ({ default: m.ForProvidersPage })));
const ContactSalesPage = lazy(() => import('@/features/public/providers/ContactSalesPage').then((m) => ({ default: m.ContactSalesPage })));
const FacilitiesPartnerPage = lazy(() => import('@/features/public/providers/FacilitiesPartnerPage').then((m) => ({ default: m.FacilitiesPartnerPage })));
const FacilitiesPricingPage = lazy(() => import('@/features/public/providers/FacilitiesPricingPage').then((m) => ({ default: m.FacilitiesPricingPage })));
const ProductsHub = lazy(() => import('@/src/pages/products').then((m) => ({ default: m.ProductsHub })));
const CategoryPage = lazy(() => import('@/src/pages/products/CategoryPage').then((m) => ({ default: m.CategoryPage })));
const AffiliateProductPage = lazy(() => import('@/src/pages/products/AffiliateProductPage').then((m) => ({ default: m.AffiliateProductPage })));
const StatesDirectoryPage = lazy(() => import('@/features/locations/StatesDirectoryPage').then((m) => ({ default: m.StatesDirectoryPage })));
const FAQ = lazy(() => import('@/features/family/support/FAQ').then((m) => ({ default: m.FAQ })));
const AdvertiseWithUs = lazy(() => import('@/features/public/advertise/AdvertiseWithUs').then((m) => ({ default: m.AdvertiseWithUs })));
const HonestCarePage = lazy(() => import('@/features/public/transparency/HonestCarePage').then((m) => ({ default: m.HonestCarePage })));
const MethodologyPage = lazy(() => import('@/features/public/transparency/MethodologyPage').then((m) => ({ default: m.MethodologyPage })));
const Blog = lazy(() => import('./features/public/blog/Blog').then((m) => ({ default: m.Blog })));
const StateHubHome = lazy(() => import('@/features/locations/hub/StateHubHome').then((m) => ({ default: m.StateHubHome })));
const StateMedicaidPage = lazy(() => import('@/features/locations/hub/StateMedicaidPage').then((m) => ({ default: m.StateMedicaidPage })));
const StateRegulatoryHub = lazy(() => import('@/features/regulatory/StateRegulatoryHub').then((m) => ({ default: m.StateRegulatoryHub })));
const StateRulesPage = lazy(() => import('@/features/locations/hub/StateRulesPage').then((m) => ({ default: m.StateRulesPage })));
const StateOmbudsmanPage = lazy(() => import('@/features/locations/hub/StateOmbudsmanPage').then((m) => ({ default: m.StateOmbudsmanPage })));
const StateVeteransPage = lazy(() => import('@/features/locations/hub/StateVeteransPage').then((m) => ({ default: m.StateVeteransPage })));
const RegulatoryLibrary = lazy(() => import('@/features/regulatory/RegulatoryLibrary').then((m) => ({ default: m.RegulatoryLibrary })));
const StateRegulationTopicPage = lazy(() => import('@/features/regulatory/StateRegulationTopicPage').then((m) => ({ default: m.StateRegulationTopicPage })));
const AboutPage = lazy(() => import('@/features/public/company/AboutPage').then((m) => ({ default: m.AboutPage })));
const WhyThisExistsPage = lazy(() => import('@/features/public/company/WhyThisExistsPage').then((m) => ({ default: m.WhyThisExistsPage })));
const ContactPage = lazy(() => import('@/features/public/company/ContactPage').then((m) => ({ default: m.ContactPage })));
const EditorialPolicyPage = lazy(() => import('@/features/public/company/EditorialPolicyPage').then((m) => ({ default: m.EditorialPolicyPage })));
const CommunityGuidelinesPage = lazy(() => import('@/features/public/company/CommunityGuidelinesPage').then((m) => ({ default: m.CommunityGuidelinesPage })));
const ResourcePage = lazy(() => import('@/features/resources/ResourcePage').then((m) => ({ default: m.ResourcePage })));
const EmotionalSupportCatalog = lazy(() => import('@/features/resources/EmotionalSupportCatalog'));
const HowToChooseGuide = lazy(() => import('@/features/resources/HowToChooseGuide').then((m) => ({ default: m.HowToChooseGuide })));
const CostsGuide = lazy(() => import('@/features/resources/CostsGuide').then((m) => ({ default: m.CostsGuide })));
const TourQuestionsGuide = lazy(() => import('@/features/resources/TourQuestionsGuide').then((m) => ({ default: m.TourQuestionsGuide })));
const FacilityDetails = lazy(() => import('@/features/family/discovery/FacilityDetails').then((m) => ({ default: m.FacilityDetails })));
const LoginPage = lazy(() => import('@/features/auth/LoginPage').then((m) => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('@/features/auth/SignUpPage').then((m) => ({ default: m.SignUpPage })));
const IntegrityHarness = lazy(() => import('@/features/e2e/IntegrityHarness').then((m) => ({ default: m.IntegrityHarness })));

// ...

// Simple Error Boundary
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    reportFrontendError({
      source: 'react-boundary',
      message: error.message,
      stack: error.stack,
      path: window.location.pathname,
      userAgent: navigator.userAgent,
      extra: {
        componentStack: errorInfo.componentStack,
      },
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white p-8 rounded-lg shadow-lg max-w-lg w-full">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-slate-600 mb-4">The application encountered an error and could not load.</p>
            <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto mb-4 text-red-800">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const DashboardRouteGate: React.FC = () => {
  const location = useLocation();
  const { tab } = useParams<{ tab?: string }>();
  const { user, loading, isOperator } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const legacyTab = normalizeDashboardTab(searchParams.get('tab'));
  const normalizedPathTab = normalizeDashboardTab(tab);

  if (legacyTab) {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('tab');
    const nextSearch = nextParams.toString();
    return <Navigate to={`${dashboardPathForTab(legacyTab)}${nextSearch ? `?${nextSearch}` : ''}`} replace />;
  }

  if (tab && normalizedPathTab && tab.toLowerCase() !== normalizedPathTab) {
    return <Navigate to={`${dashboardPathForTab(normalizedPathTab)}${location.search}`} replace />;
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
      </div>
    );
  }

  if (!user) {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/operator/login?redirect_to=${encodeURIComponent(redirectTo)}`} replace />;
  }

  if (!isOperator) {
    const redirectTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/operator/login?redirect_to=${encodeURIComponent(redirectTo)}&role_mismatch=1`}
        replace
      />
    );
  }

  if (tab && !normalizedPathTab) {
    return <Navigate to="/dashboard" replace />;
  }

  return <OperatorDashboard />;
};

const LegacyDashboardEditRedirect: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  if (!id) return <Navigate to="/dashboard/listings" replace />;
  return <Navigate to={`/dashboard/facility/${id}/edit`} replace />;
};

const LegacyStateAssistedLivingRedirect: React.FC = () => {
  const { state } = useParams<{ state?: string }>();
  if (!state) return <Navigate to="/states" replace />;
  return <Navigate to={`/states/${state}`} replace />;
};

const AssistedLivingStateAstroRedirect: React.FC = () => {
  const { state } = useParams<{ state?: string }>();
  const location = useLocation();
  if (!state) return <Navigate to="/states" replace />;

  const target = `/assisted-living/${state}/`;
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = `${target}${location.search}${location.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      window.location.replace(next);
    }
  }, [target, location.search, location.hash]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
    </div>
  );
};

const AssistedLivingCityAstroRedirect: React.FC = () => {
  const { state, city } = useParams<{ state?: string; city?: string }>();
  const location = useLocation();
  if (!state || !city) return <Navigate to="/states" replace />;

  const target = `/assisted-living/${state}/cities/${city}/`;
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const next = `${target}${location.search}${location.hash}`;
    if (`${window.location.pathname}${window.location.search}${window.location.hash}` !== next) {
      window.location.replace(next);
    }
  }, [target, location.search, location.hash]);

  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
    </div>
  );
};

const LegacyAssistedLivingCityPathRedirect: React.FC = () => {
  const { state, city } = useParams<{ state?: string; city?: string }>();
  if (!state || !city) return <Navigate to="/states" replace />;
  return <Navigate to={`/assisted-living/${state}/cities/${city}/`} replace />;
};

function App() {
  const enableIntegrityHarness =
    import.meta.env.DEV ||
    import.meta.env.MODE === 'test' ||
    import.meta.env.VITE_ENABLE_E2E_ROUTES === 'true' ||
    window.location.pathname.startsWith('/__integrity');

  React.useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportFrontendError({
        source: 'window-error',
        message: event.message || 'Unknown window error',
        stack: event.error?.stack,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
        extra: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as any;
      reportFrontendError({
        source: 'unhandled-rejection',
        message: reason?.message || String(reason || 'Unhandled promise rejection'),
        stack: reason?.stack,
        path: window.location.pathname,
        userAgent: navigator.userAgent,
      });
    };

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  const routeFallback = (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-700 animate-spin" />
    </div>
  );

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <ComparisonProvider>
            <Elements stripe={stripePromise}>
              <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <a
                  href="#main-content"
                  className="fixed -left-[9999px] top-auto z-[100] h-px w-px overflow-hidden whitespace-nowrap focus:left-4 focus:top-4 focus:h-auto focus:w-auto focus:overflow-visible focus:bg-white focus:text-slate-900 focus:px-4 focus:py-2 focus:rounded focus:shadow-md"
                >
                  Skip to main content
                </a>
                <ScrollToTop />
                <GlobalSchema />
                <div className="min-h-screen bg-white">
                  <LocationPrompt />
                  <Navbar />
                  <main id="main-content">
                    <Suspense fallback={routeFallback}>
                      <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/search" element={<DirectorySearch />} />
                      <Route path="/facility/:id" element={<FacilityDetails />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />

                    {/* Operator Routes */}
                    <Route path="/dashboard" element={<DashboardRouteGate />} />
                    <Route path="/dashboard/:tab" element={<DashboardRouteGate />} />
                    <Route path="/dashboard/edit/:id" element={<LegacyDashboardEditRedirect />} />
                    <Route path="/dashboard/facility/:id/edit" element={<EditFacility />} />
                    <Route path="/operator/login" element={<OperatorLogin />} />
                    <Route path="/operator/signup" element={<OperatorSignUp />} />
                    {enableIntegrityHarness && <Route path="/__integrity" element={<IntegrityHarness />} />}
                    <Route path="/claim/:id" element={<ClaimFacilityPage />} />
                    <Route path="/claim-business" element={<ClaimBusiness />} />

                    <Route path="/tools/pricing-audit" element={<PricingAudit />} />
                    <Route path="/survey" element={<CareFinderSurvey />} />
                    <Route path="/results" element={<SurveyResults />} />

                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/providers" element={<ForProvidersPage />} />
                    <Route path="/for-facilities" element={<FacilitiesPartnerPage />} />
                    <Route path="/for-facilities/pricing" element={<FacilitiesPricingPage />} />
                    <Route path="/products" element={<ProductsHub />} />
                    <Route path="/products/affiliate" element={<AffiliateProductPage />} />
                    <Route path="/products/:category" element={<CategoryPage />} />

                    <Route path="/providers/contact-sales" element={<ContactSalesPage />} />

                    {/* Company & Resources */}
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/why-this-exists" element={<WhyThisExistsPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
                    <Route path="/community-guidelines" element={<CommunityGuidelinesPage />} />
                    <Route path="/resources/:type" element={<ResourcePage />} />
                    <Route path="/resources/emotional-support" element={<EmotionalSupportCatalog />} />
                    <Route path="/guides/how-to-choose" element={<HowToChooseGuide />} />
                    <Route path="/guides/what-it-costs" element={<CostsGuide />} />
                    <Route path="/guides/tour-questions" element={<TourQuestionsGuide />} />
                    <Route path="/claim" element={<ClaimBusiness />} />

                    {/* State Authority Hub */}
                    <Route path="/states" element={<StatesDirectoryPage />} />
                    <Route path="/states/:state" element={<StateHubHome />} />
                    <Route path="/states/:state/regulatory" element={<Navigate to="regulations" replace />} />
                    <Route path="/states/:state/regulations" element={<StateRegulatoryHub />} />
                    <Route path="/states/:state/regulations/:topic" element={<StateRegulationTopicPage />} />
                    <Route path="/states/:state/medicaid" element={<StateMedicaidPage />} />
                    <Route path="/states/:state/rules" element={<StateRulesPage />} />
                    <Route path="/states/:state/ombudsman" element={<StateOmbudsmanPage />} />
                    <Route path="/states/:state/veterans" element={<StateVeteransPage />} />
                    <Route path="/states/:state/assisted-living" element={<LegacyStateAssistedLivingRedirect />} />
                    <Route path="/regulatory-library" element={<RegulatoryLibrary />} />

                    {/* Legacy / Direct Routes */}
                    <Route path="/assisted-living/:state" element={<AssistedLivingStateAstroRedirect />} />
                    <Route path="/assisted-living/:state/:city" element={<LegacyAssistedLivingCityPathRedirect />} />
                    <Route path="/assisted-living/:state/cities/:city" element={<AssistedLivingCityAstroRedirect />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/advertise" element={<AdvertiseWithUs />} />
                    <Route path="/honest-care" element={<HonestCarePage />} />
                    <Route path="/methodology" element={<MethodologyPage />} />
                        <Route path="/blog" element={<Blog />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </BrowserRouter>
            </Elements>
          </ComparisonProvider>
        </AuthProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
