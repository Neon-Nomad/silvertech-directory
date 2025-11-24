import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import LandingPage from './features/public/landing/LandingPage';
import DirectorySearch from './features/family/discovery/DirectorySearch';
import OperatorDashboard from './features/operator/dashboard/OperatorDashboard';
import PricingAudit from './features/public/wedge-tools/PricingAudit';

function App() {
  return (
    <BrowserRouter basename="/silvertech-directory">
      <div className="min-h-screen bg-white">
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/search" element={<DirectorySearch />} />
          <Route path="/dashboard" element={<OperatorDashboard />} />
          <Route path="/tools/pricing-audit" element={<PricingAudit />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;