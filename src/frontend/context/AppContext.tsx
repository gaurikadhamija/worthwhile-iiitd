import React, { createContext, useContext, useState, useEffect } from 'react';
import { EventItem, UserProfile, Notification, UserRole } from '../types/index.js';
import { api } from '../services/api.js';

export type NavigationPage =
  | 'discover'
  | 'freetime'
  | 'heatmap'
  | 'compare'
  | 'myevents'
  | 'organizer'
  | 'event-details';

interface AppContextType {
  activePage: NavigationPage;
  selectedEventId: string | null;
  currentUserRole: UserRole;
  setCurrentUserRole: (role: UserRole) => void;
  navigateTo: (page: NavigationPage, eventId?: string) => void;

  // Saved & Registered
  savedEventIds: Set<string>;
  registeredEventIds: Set<string>;
  toggleSave: (eventId: string) => Promise<void>;
  registerForEvent: (eventId: string) => Promise<void>;

  // Comparison
  compareEventIds: string[];
  addToCompare: (eventId: string) => void;
  removeFromCompare: (eventId: string) => void;
  clearCompare: () => void;

  // Profile & Goals
  profile: UserProfile | null;
  updateSemesterGoals: (goals: string[], interests: string[], career_interests: string[]) => Promise<void>;

  // Notifications
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;

  // Modals
  isGoalsModalOpen: boolean;
  setIsGoalsModalOpen: (open: boolean) => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;
  scoreModalEvent: EventItem | null;
  setScoreModalEvent: (event: EventItem | null) => void;
  reviewModalEvent: EventItem | null;
  setReviewModalEvent: (event: EventItem | null) => void;

  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<NavigationPage>('discover');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>('student');

  const [savedEventIds, setSavedEventIds] = useState<Set<string>>(new Set());
  const [registeredEventIds, setRegisteredEventIds] = useState<Set<string>>(new Set());
  const [compareEventIds, setCompareEventIds] = useState<string[]>(['evt_genai_masterclass', 'evt_faang_mock_interviews']);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scoreModalEvent, setScoreModalEvent] = useState<EventItem | null>(null);
  const [reviewModalEvent, setReviewModalEvent] = useState<EventItem | null>(null);

  const refreshData = async () => {
    try {
      const [profileData, savedData, notifs] = await Promise.all([
        api.getUserProfile().catch(err => {
          console.warn('Could not load user profile:', err);
          return null;
        }),
        api.getSavedEvents().catch(err => {
          console.warn('Could not load saved events:', err);
          return [];
        }),
        api.getNotifications().catch(err => {
          console.warn('Could not load notifications:', err);
          return [];
        })
      ]);

      if (profileData?.profile) {
        setProfile(profileData.profile);
      }

      if (Array.isArray(savedData)) {
        setSavedEventIds(new Set(savedData.map(e => e.id)));
      }

      if (Array.isArray(notifs)) {
        setNotifications(notifs);
      }
    } catch (err) {
      console.warn('Unexpected error in refreshData:', err);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const navigateTo = (page: NavigationPage, eventId?: string) => {
    if (eventId) {
      setSelectedEventId(eventId);
    }
    setActivePage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSave = async (eventId: string) => {
    try {
      const res = await api.toggleSaveEvent(eventId);
      setSavedEventIds(prev => {
        const next = new Set(prev);
        if (res.saved) {
          next.add(eventId);
        } else {
          next.delete(eventId);
        }
        return next;
      });
    } catch (err) {
      console.error('Toggle save error:', err);
    }
  };

  const registerForEvent = async (eventId: string) => {
    try {
      await api.registerForEvent(eventId);
      setRegisteredEventIds(prev => new Set(prev).add(eventId));
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  const addToCompare = (eventId: string) => {
    if (compareEventIds.includes(eventId)) return;
    if (compareEventIds.length >= 4) {
      // replace last or cap
      setCompareEventIds(prev => [...prev.slice(1), eventId]);
    } else {
      setCompareEventIds(prev => [...prev, eventId]);
    }
  };

  const removeFromCompare = (eventId: string) => {
    setCompareEventIds(prev => prev.filter(id => id !== eventId));
  };

  const clearCompare = () => {
    setCompareEventIds([]);
  };

  const updateSemesterGoals = async (goals: string[], interests: string[], career_interests: string[]) => {
    try {
      const updated = await api.updateSemesterGoals({ goals, interests, career_interests });
      setProfile(updated);
      setIsGoalsModalOpen(false);
      // Trigger data refresh so recalculated scores propagate immediately
      await refreshData();
    } catch (err) {
      console.error('Update goals error:', err);
    }
  };

  const markNotificationAsRead = async (id: string) => {
    await api.markNotificationRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsAsRead = async () => {
    await api.markAllNotificationsRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadNotificationCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider
      value={{
        activePage,
        selectedEventId,
        currentUserRole,
        setCurrentUserRole,
        navigateTo,
        savedEventIds,
        registeredEventIds,
        toggleSave,
        registerForEvent,
        compareEventIds,
        addToCompare,
        removeFromCompare,
        clearCompare,
        profile,
        updateSemesterGoals,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        isGoalsModalOpen,
        setIsGoalsModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        scoreModalEvent,
        setScoreModalEvent,
        reviewModalEvent,
        setReviewModalEvent,
        refreshData
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
