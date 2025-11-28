import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
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
import { ProductsHub } from '@/src/pages/products';
import { CategoryPage } from '@/src/pages/products/CategoryPage';
import { CityPageTemplate } from '@/features/locations/CityPageTemplate';
import { FAQ } from '@/features/family/support/FAQ';
import { AdvertiseWithUs } from '@/features/public/advertise/AdvertiseWithUs';
import { HonestCarePage } from '@/features/public/transparency/HonestCarePage';
import { Blog } from './features/public/blog/Blog';
import { LocationPage } from '@/features/seo/LocationPage';

import { Home } from '@/features/family/landing/Home';
import { FacilityDetails } from '@/features/family/discovery/FacilityDetails';

import { ScrollToTop } from '@/components/utils/ScrollToTop';

import { ComparisonProvider } from '@/src/context/ComparisonContext';
import { ComparisonBar } from '@/components/ui/ComparisonBar';
import { ComparisonModal } from '@/components/ui/ComparisonModal';

import { AuthProvider } from '@/src/context/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';

// ...

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <ComparisonProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <div className="min-h-screen bg-white">
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
                <Route path="/products/:category" element={<CategoryPage />} />
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
              <ComparisonBar />
              <ComparisonModal />
            </div>
          </BrowserRouter>
        </ComparisonProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;