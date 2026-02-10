import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '@/src/lib/stripe';
import Navbar from '@/components/layout/Navbar';

import DirectorySearch from '@/features/family/discovery/DirectorySearch';
import OperatorDashboard from '@/features/operator/dashboard/OperatorDashboard';
import OperatorLogin from '@/features/auth/OperatorLogin';
import PricingAudit from '@/features/public/wedge-tools/PricingAudit';
import CareFinderSurvey from '@/features/family/survey/CareFinderSurvey';
import SurveyResults from '@/features/family/survey/SurveyResults';
import { ClaimFacilityPage } from '@/features/operator/ClaimFacilityPage';
import { EditFacility } from '@/features/operator/dashboard/EditFacility';
import { ClaimBusiness } from '@/features/operator/claim/ClaimBusiness';
import { StatePageTemplate } from '@/features/locations/StatePageTemplate';
import { CaliforniaPage } from '@/features/locations/CaliforniaPage';
import { IndianaPage } from '@/features/locations/IndianaPage';
import { PricingPage } from '@/features/public/pricing/PricingPage';
import { ForProvidersPage } from '@/features/public/providers/ForProvidersPage';
import { ContactSalesPage } from '@/features/public/providers/ContactSalesPage';
import { ProductsHub } from '@/src/pages/products';
import { CategoryPage } from '@/src/pages/products/CategoryPage';
import { AffiliateProductPage } from '@/src/pages/products/AffiliateProductPage';
import { StatesDirectoryPage } from '@/features/locations/StatesDirectoryPage';
import { CityPageTemplate } from '@/features/locations/CityPageTemplate';
import { FAQ } from '@/features/family/support/FAQ';
import { AdvertiseWithUs } from '@/features/public/advertise/AdvertiseWithUs';
import { HonestCarePage } from '@/features/public/transparency/HonestCarePage';
import { Blog } from './features/public/blog/Blog';
import { LocationPage } from '@/features/seo/LocationPage';
import { StateHubHome } from '@/features/locations/hub/StateHubHome';
import { StateMedicaidPage } from '@/features/locations/hub/StateMedicaidPage';
import { StateRegulatoryHub } from '@/features/regulatory/StateRegulatoryHub';
import { StateRulesPage } from '@/features/locations/hub/StateRulesPage';
import { StateOmbudsmanPage } from '@/features/locations/hub/StateOmbudsmanPage';
import { StateVeteransPage } from '@/features/locations/hub/StateVeteransPage';
import { RegulatoryLibrary } from '@/features/regulatory/RegulatoryLibrary';
import { AboutPage } from '@/features/public/company/AboutPage';
import { ContactPage } from '@/features/public/company/ContactPage';
import { EditorialPolicyPage } from '@/features/public/company/EditorialPolicyPage';
import { ResourcePage } from '@/features/resources/ResourcePage';
import EmotionalSupportCatalog from '@/features/resources/EmotionalSupportCatalog';

import { Home } from '@/features/family/landing/Home';
import { FacilityDetails } from '@/features/family/discovery/FacilityDetails';

import { ScrollToTop } from '@/components/utils/ScrollToTop';

import { ComparisonProvider } from '@/src/context/ComparisonContext';
import { GlobalSchema } from '@/components/seo/GlobalSchema';
import { LocationPrompt } from '@/components/ui/LocationPrompt';

import { AuthProvider } from '@/src/context/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';

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

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <AuthProvider>
          <ComparisonProvider>
            <Elements stripe={stripePromise}>
              <BrowserRouter basename={import.meta.env.BASE_URL} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <ScrollToTop />
                <GlobalSchema />
                <div className="min-h-screen bg-white">
                  <LocationPrompt />
                  <Navbar />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/search" element={<DirectorySearch />} />
                    <Route path="/facility/:id" element={<FacilityDetails />} />

                    {/* Auth Routes */}
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignUpPage />} />

                    {/* Operator Routes */}
                    <Route path="/dashboard" element={<OperatorDashboard />} />
                    <Route path="/dashboard/edit/:id" element={<EditFacility />} />
                    <Route path="/operator/login" element={<OperatorLogin />} />
                    <Route path="/claim/:id" element={<ClaimFacilityPage />} />
                    <Route path="/claim-business" element={<ClaimBusiness />} />

                    <Route path="/tools/pricing-audit" element={<PricingAudit />} />
                    <Route path="/survey" element={<CareFinderSurvey />} />
                    <Route path="/results" element={<SurveyResults />} />

                    <Route path="/pricing" element={<PricingPage />} />
                    <Route path="/providers" element={<ForProvidersPage />} />
                    <Route path="/products" element={<ProductsHub />} />
                    <Route path="/products/affiliate" element={<AffiliateProductPage />} />
                    <Route path="/products/:category" element={<CategoryPage />} />

                    <Route path="/providers/contact-sales" element={<ContactSalesPage />} />

                    {/* Company & Resources */}
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/editorial-policy" element={<EditorialPolicyPage />} />
                    <Route path="/resources/:type" element={<ResourcePage />} />
                    <Route path="/resources/emotional-support" element={<EmotionalSupportCatalog />} />
                    <Route path="/claim" element={<ClaimBusiness />} />

                    {/* State Authority Hub */}
                    <Route path="/states" element={<StatesDirectoryPage />} />
                    <Route path="/states/:state" element={<StateHubHome />} />
                    <Route path="/states/:state/regulatory" element={<StateRegulatoryHub />} />
                    <Route path="/states/:state/medicaid" element={<StateMedicaidPage />} />
                    <Route path="/states/:state/rules" element={<StateRulesPage />} />
                    <Route path="/states/:state/ombudsman" element={<StateOmbudsmanPage />} />
                    <Route path="/states/:state/veterans" element={<StateVeteransPage />} />
                    <Route path="/states/:state/assisted-living" element={<DirectorySearch />} />
                    <Route path="/regulatory-library" element={<RegulatoryLibrary />} />

                    {/* Legacy / Direct Routes */}
                    <Route path="/assisted-living/california" element={<CaliforniaPage />} />
                    <Route path="/assisted-living/indiana" element={<IndianaPage />} />
                    <Route path="/assisted-living/:state" element={<StatePageTemplate />} />
                    <Route path="/assisted-living/:state/:city" element={<LocationPage />} />
                    <Route path="/assisted-living/:state/cities/:city" element={<CityPageTemplate />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/advertise" element={<AdvertiseWithUs />} />
                    <Route path="/honest-care" element={<HonestCarePage />} />
                    <Route path="/blog" element={<Blog />} />
                  </Routes>
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
