import React, { useState, useEffect } from 'react';
import LandingNavbar from './components/landing/LandingNavbar';
import LandingHero from './components/landing/LandingHero';
import FeaturesSection from './components/landing/FeaturesSection';
import ValueStrip from './components/landing/ValueStrip';
import BuiltForTraders from './components/landing/BuiltForTraders';
import MountainBanner from './components/landing/MountainBanner';
import AlphaCopilotPreview from './components/landing/AlphaCopilotPreview';
import PricingSection from './components/landing/PricingSection';
import AppStoreSection from './components/landing/AppStoreSection';
import FAQAccordion from './components/landing/FAQAccordion';
import BlogSection from './components/landing/BlogSection';
import ClosingCTABanner from './components/landing/ClosingCTABanner';
import LandingFooter from './components/landing/LandingFooter';
import DemoModal from './components/landing/DemoModal';
import AuthModal from './components/AuthModal';
import WaitlistForm from './components/WaitlistForm';
import AdminPanel from './components/AdminPanel';
import FloatingBot from './components/FloatingBot';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = () => {
      navigate('/dashboard');
    };
    window.addEventListener('authSuccess', handleAuth);
    return () => {
      window.removeEventListener('authSuccess', handleAuth);
    };
  }, [navigate]);

  const handleOpenAuth = (isLogin: boolean = true) => {
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/dashboard');
      return;
    }
    window.dispatchEvent(new CustomEvent('openAuth', { detail: { isLogin } }));
  };

  const handleGetStarted = () => {
    handleOpenAuth(false);
  };

  const handleWatchDemo = () => {
    setDemoModalOpen(true);
  };

  const handleSelectFeature = (_featureName: string) => {
    handleOpenAuth(false);
  };

  const handleSelectPlan = (_plan: string) => {
    handleOpenAuth(false);
  };

  return (
    <div className="min-h-screen bg-[#070D1B] text-slate-100 font-sans antialiased selection:bg-blue-600 selection:text-white">
      {/* Top Fixed Header */}
      <LandingNavbar onOpenAuth={handleOpenAuth} />

      <main className="w-full">
        {/* 1. Hero Section with MacBook Mockup on Desktop & Vertical Stacked Phone on Mobile */}
        <LandingHero
          onGetStarted={handleGetStarted}
          onWatchDemo={handleWatchDemo}
        />

        {/* 2. Powerful Features: Everything You Need. In One Place. (White light section) */}
        <FeaturesSection onSelectFeature={handleSelectFeature} />

        {/* 3. Value Strip: Dark rounded banner with 4 icon+label items + CTA */}
        <ValueStrip onGetStarted={handleGetStarted} />

        {/* 4. Built For Real Traders & Dual Phone / Watchlist Demo */}
        <BuiltForTraders />

        {/* 5. Mountain Skyline Atmospheric Banner (Discipline today. Freedom tomorrow.) */}
        <MountainBanner onGetStarted={handleGetStarted} />

        {/* 6. Alpha Copilot Live Chat Preview */}
        <AlphaCopilotPreview onOpenAuth={handleGetStarted} />

        {/* 7. Pricing Section (Free ₹0 vs Pro ₹499/month with Monthly/Yearly Toggle) */}
        <PricingSection onSelectPlan={handleSelectPlan} />

        {/* 8. App Store & Google Play Badges Showcase */}
        <AppStoreSection />

        {/* 9. Interactive FAQ Accordion */}
        <FAQAccordion />

        {/* 10. Research & Blog Section */}
        <BlogSection />

        {/* 11. Closing CTA Banner */}
        <ClosingCTABanner onGetStarted={handleGetStarted} />
      </main>

      {/* 12. Footer: Logo, nav links, social icons, copyright */}
      <LandingFooter />

      {/* Modals and Background Overlays */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onGetStarted={handleGetStarted}
      />

      {/* Retained Auth Flow Components */}
      <WaitlistForm />
      <AuthModal />
      <AdminPanel />
      <FloatingBot />
    </div>
  );
}
