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
import { ClaimProfile } from '@/features/operator/claim/ClaimProfile';
import { ClaimBusiness } from '@/features/operator/claim/ClaimBusiness';
import { CaliforniaPage } from '@/features/locations/CaliforniaPage';
import { IndianaPage } from '@/features/locations/IndianaPage';
import { PricingPage } from '@/features/public/pricing/PricingPage';
import { ForProvidersPage } from '@/features/public/providers/ForProvidersPage';
import { ProductsHub } from '@/src/pages/products';
import { CategoryPage } from '@/src/pages/products/CategoryPage';
import { LocationPage } from '@/features/seo/LocationPage';
import { FAQ } from '@/features/family/support/FAQ';
import { AdvertiseWithUs } from '@/features/public/advertise/AdvertiseWithUs';
import { Blog } from './features/public/blog/Blog';

import { Home } from '@/features/family/landing/Home';
import { FacilityDetails } from '@/features/family/discovery/FacilityDetails';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<DirectorySearch />} />
          <Route path="/facility/:id" element={<FacilityDetails />} />
          <Route path="/dashboard" element={<OperatorDashboard />} />
          <Route path="/login" element={<OperatorLogin />} />
          <Route path="/tools/pricing-audit" element={<PricingAudit />} />
          <Route path="/survey" element={<CareFinderSurvey />} />
          <Route path="/results" element={<SurveyResults />} />
          <Route path="/claim/:code" element={<ClaimProfile />} />
          <Route path="/claim-business" element={<ClaimBusiness />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/providers" element={<ForProvidersPage />} />
          <Route path="/products" element={<ProductsHub />} />
          <Route path="/products/:category" element={<CategoryPage />} />
          <Route path="/assisted-living/california" element={<CaliforniaPage />} />
          <Route path="/assisted-living/indiana" element={<IndianaPage />} />
          <Route path="/assisted-living/:state" element={<LocationPage />} />
          <Route path="/assisted-living/:state/:city" element={<LocationPage />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/advertise" element={<AdvertiseWithUs />} />
        <Route path="/blog" element={<Blog />} />
        </Routes>
      </div>
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;