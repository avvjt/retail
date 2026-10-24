import React, { useEffect } from 'react';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import Footer from '../components/Footer';
import Changelog from '../components/dashboard/Changelog';

export default function PublicChangelog() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="app-container bg-[#0a0a0a] min-h-screen text-white">
      <Navbar />
      <main className="pt-24 pb-12">
        <Changelog theme="dark" />
      </main>
      <AuthModal />
      <Footer />
    </div>
  );
}
