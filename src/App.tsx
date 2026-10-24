import React from 'react';
import { Routes, Route, useOutletContext } from 'react-router-dom';
import LandingPage from './LandingPage';
import InviteHandler from './components/InviteHandler';
import UserDashboard from './components/UserDashboard';
import OAuthCallback from './components/OAuthCallback';
import DashboardOverview from './components/dashboard/DashboardOverview';
import MarketAnalysis from './components/dashboard/MarketAnalysis';
import TradeJournal from './components/dashboard/TradeJournal';
import BehavioralCoach from './components/dashboard/BehavioralCoach';
import AlertsFeed from './components/dashboard/AlertsFeed';
import PerformanceAnalytics from './components/dashboard/PerformanceAnalytics';
import EducationLearning from './components/dashboard/EducationLearning';
import ProfileSettings from './components/dashboard/ProfileSettings';

import SmartMoneySignals from './components/dashboard/SmartMoneySignals';
import AIWatchlist from './components/dashboard/AIWatchlist';
import OptionChainIntel from './components/dashboard/OptionChainIntel';
import MarketHeatmap from './components/dashboard/MarketHeatmap';
import AlgoBuilder from './components/dashboard/AlgoBuilder';
import BrokerConnect from './components/dashboard/BrokerConnect';
import Community from './components/dashboard/Community';
import Discussions from './components/dashboard/Discussions';
import Billing from './components/dashboard/Billing';
import PatternScanner from './components/dashboard/PatternScanner';
import PaperTrading from './components/dashboard/PaperTrading';
import CoreScanner from './components/dashboard/CoreScanner';
import Orderbook from './components/dashboard/Orderbook';
import NewsFeed from './components/dashboard/NewsFeed';
import GlobalIndices from './components/dashboard/GlobalIndices';
import Settings from './components/dashboard/Settings';
import Referrals from './components/dashboard/Referrals';
import Support from './components/dashboard/Support';
import Documentation from './components/dashboard/Documentation';
import Changelog from './components/dashboard/Changelog';
import FiiDiiData from './components/dashboard/FiiDiiData';
import Reports from './components/dashboard/Reports';
import OpenChartTerminal from './components/dashboard/OpenChartTerminal';
import PublicDocumentation from './pages/PublicDocumentation';
import PublicChangelog from './pages/PublicChangelog';
import LoginPage from './components/LoginPage';


export default function App() {
  return (
    <>
      <Routes>
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/invite/:code" element={<InviteHandler />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<LoginPage />} />
        <Route path="/documentation" element={<PublicDocumentation />} />
        <Route path="/changelog" element={<PublicChangelog />} />
        <Route path="/dashboard" element={<UserDashboard />}>
          <Route index element={<DashboardOverviewWrapper />} />
          <Route path="analysis" element={<MarketAnalysisWrapper />} />
          <Route path="global-indices" element={<GlobalIndicesWrapper />} />
          <Route path="journal" element={<TradeJournalWrapper />} />
          <Route path="coach" element={<BehavioralCoachWrapper />} />
          <Route path="alerts" element={<AlertsFeedWrapper />} />
          <Route path="performance" element={<PerformanceAnalyticsWrapper />} />
          <Route path="education" element={<EducationLearningWrapper />} />
          <Route path="profile" element={<ProfileSettingsWrapper />} />
          
          <Route path="smart-money" element={<SmartMoneySignalsWrapper />} />
          <Route path="watchlist" element={<AIWatchlistWrapper />} />
          <Route path="options" element={<OptionChainIntelWrapper />} />
          <Route path="heatmap" element={<MarketHeatmapWrapper />} />
          <Route path="algo-builder" element={<AlgoBuilderWrapper />} />
          <Route path="paper-trading" element={<PaperTradingWrapper />} />
          <Route path="broker" element={<BrokerConnectWrapper />} />
          <Route path="community" element={<CommunityWrapper />} />
          <Route path="discussions" element={<DiscussionsWrapper />} />
          <Route path="billing" element={<BillingWrapper />} />
          <Route path="scanner" element={<PatternScannerWrapper />} />
          <Route path="core-scanner" element={<CoreScannerWrapper />} />
          <Route path="orderbook" element={<OrderbookWrapper />} />
          <Route path="news" element={<NewsFeedWrapper />} />
          <Route path="settings" element={<SettingsWrapper />} />
          <Route path="referrals" element={<ReferralsWrapper />} />
          <Route path="support" element={<SupportWrapper />} />
          <Route path="fii-dii" element={<FiiDiiDataWrapper />} />
          <Route path="reports" element={<ReportsWrapper />} />
          <Route path="openchart" element={<OpenChartTerminalWrapper />} />
          <Route path="documentation" element={<DocumentationWrapper />} />
          <Route path="changelog" element={<ChangelogWrapper />} />

        </Route>
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </>
  );
}

// Wrappers to pass context

type DashboardContext = { theme: string; toggleTheme?: () => void };

function DashboardOverviewWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <DashboardOverview theme={theme} />;
}
function MarketAnalysisWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <MarketAnalysis theme={theme} />;
}
function TradeJournalWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <TradeJournal theme={theme} />;
}
function BehavioralCoachWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <BehavioralCoach theme={theme} />;
}
function AlertsFeedWrapper() {
  const { theme, unreadAlertsCount, setUnreadAlertsCount, alertsList, setAlertsList } = useOutletContext<any>();
  return (
    <AlertsFeed 
      theme={theme} 
      unreadAlertsCount={unreadAlertsCount} 
      setUnreadAlertsCount={setUnreadAlertsCount} 
      alertsList={alertsList} 
      setAlertsList={setAlertsList} 
    />
  );
}
function PerformanceAnalyticsWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <PerformanceAnalytics theme={theme} />;
}
function EducationLearningWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <EducationLearning theme={theme} />;
}
function ProfileSettingsWrapper() {
  return <ProfileSettings />;
}

// New Wrappers for Sub-components
function SmartMoneySignalsWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <SmartMoneySignals theme={theme} />;
}
function AIWatchlistWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <AIWatchlist theme={theme} />;
}
function OptionChainIntelWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <OptionChainIntel theme={theme} />;
}
function MarketHeatmapWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <MarketHeatmap theme={theme} />;
}
function AlgoBuilderWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <AlgoBuilder theme={theme} />;
}
function PaperTradingWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <PaperTrading theme={theme} />;
}
function BrokerConnectWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <BrokerConnect theme={theme} />;
}
function CommunityWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <Community theme={theme} />;
}
function DiscussionsWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <Discussions theme={theme} />;
}
function BillingWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <Billing theme={theme} />;
}
function PatternScannerWrapper() {
  const { theme } = useOutletContext<DashboardContext>();
  return <PatternScanner theme={theme} />;
}

function CoreScannerWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <CoreScanner theme={theme} />; }
function OrderbookWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <Orderbook theme={theme} />; }
function NewsFeedWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <NewsFeed theme={theme} />; }
function GlobalIndicesWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <GlobalIndices theme={theme} />; }
function SettingsWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <Settings theme={theme} />; }
function ReferralsWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <Referrals theme={theme} />; }
function SupportWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <Support theme={theme} />; }

function DocumentationWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <Documentation theme={theme} />; }
function ChangelogWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <Changelog theme={theme} />; }
function FiiDiiDataWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <FiiDiiData theme={theme} />; }
function ReportsWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <Reports theme={theme} />; }
function OpenChartTerminalWrapper() { const { theme } = useOutletContext<DashboardContext>(); return <OpenChartTerminal theme={theme} />; }
