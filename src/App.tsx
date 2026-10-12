import React from 'react';
import { AppProvider, useApp } from './frontend/context/AppContext.js';
import { Navbar } from './frontend/components/Navbar.js';
import { Footer } from './frontend/components/Footer.js';
import { CoffeeAtmosphere } from './frontend/components/CoffeeAtmosphere.js';
import { DiscoverPage } from './frontend/pages/DiscoverPage.js';
import { FreeTimePage } from './frontend/pages/FreeTimePage.js';
import { HeatmapPage } from './frontend/pages/HeatmapPage.js';
import { ComparePage } from './frontend/pages/ComparePage.js';
import { MyEventsPage } from './frontend/pages/MyEventsPage.js';
import { OrganizerDashboardPage } from './frontend/pages/OrganizerDashboardPage.js';
import { EventDetailsPage } from './frontend/pages/EventDetailsPage.js';
import { GoalsModal } from './frontend/components/GoalsModal.js';
import { ReviewModal } from './frontend/components/ReviewModal.js';
import { RelevanceScoreModal } from './frontend/components/RelevanceScoreModal.js';
import { AuthModal } from './frontend/components/AuthModal.js';

const MainContent: React.FC = () => {
  const { activePage, selectedEventId, scoreModalEvent, setScoreModalEvent, isAuthModalOpen, setIsAuthModalOpen } = useApp();

  return (
    <div className="relative flex flex-col min-h-screen text-[#241410] selection:bg-[#5B2435] selection:text-[#FFFDF8] bg-transparent">
      {/* Multi-Layer Animated Coffee Atmosphere Background */}
      <CoffeeAtmosphere />

      {/* Foreground Content Stack */}
      <div className="relative z-10 flex flex-col flex-1">
        {/* Sticky Top Navigation */}
        <Navbar />

        {/* Main Page Content */}
        <main className="flex-1">
          {activePage === 'discover' && <DiscoverPage />}
          {activePage === 'freetime' && <FreeTimePage />}
          {activePage === 'heatmap' && <HeatmapPage />}
          {activePage === 'compare' && <ComparePage />}
          {activePage === 'myevents' && <MyEventsPage />}
          {activePage === 'organizer' && <OrganizerDashboardPage />}
          {activePage === 'event-details' && (
            <EventDetailsPage eventId={selectedEventId || 'evt_genai_masterclass'} />
          )}
        </main>

        {/* Global Modals */}
        <GoalsModal />
        <ReviewModal />
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
        <RelevanceScoreModal
          event={scoreModalEvent}
          onClose={() => setScoreModalEvent(null)}
        />

        {/* Editorial Dark Coffee/Wine Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
