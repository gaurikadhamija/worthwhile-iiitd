import React, { useState } from 'react';
import { Bell, Sliders, CheckCircle2, ChevronDown, Menu, X } from 'lucide-react';
import { useApp, NavigationPage } from '../context/AppContext.js';
import { UserRole } from '../types/index.js';

export const Navbar: React.FC = () => {
  const {
    activePage,
    navigateTo,
    currentUserRole,
    setCurrentUserRole,
    compareEventIds,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    setIsGoalsModalOpen,
    setIsAuthModalOpen
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [logoLoadError, setLogoLoadError] = useState(false);

  const navLinks: { label: string; page: NavigationPage }[] = [
    { label: 'Discover', page: 'discover' },
    { label: '2-Hour Window', page: 'freetime' },
    { label: 'Compare', page: 'compare' },
    { label: 'Campus Map', page: 'heatmap' },
    { label: 'Portfolio', page: 'myevents' },
    { label: 'Organizer Desk', page: 'organizer' }
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#FFFDF8]/96 backdrop-blur-md border-b border-[#E2D7C8] shadow-[0_2px_12px_rgba(36,20,16,0.04)] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-6">
          
          {/* ZONE 1: BRAND LOGO (Integrated Official WorthWhile Logo Emblem) */}
          <div className="flex items-center shrink-0">
            <button
              onClick={() => navigateTo('discover')}
              className="flex items-center gap-3 text-left group focus-visible:outline-none"
              aria-label="WorthWhile Home"
            >
              <div className="flex items-center gap-3">
                {!logoLoadError ? (
                  <img
                    src="/worthwhile-icon.svg"
                    alt="WorthWhile Emblem"
                    onError={() => setLogoLoadError(true)}
                    className="h-10 w-10 shrink-0 object-contain transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-[#5B2435] to-[#30231F] flex items-center justify-center text-[#FFFDF8] font-serif font-bold text-xl shadow-xs">
                    W
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="font-serif text-2xl sm:text-[26px] font-bold tracking-tight text-[#241410] leading-none">
                    WorthWhile
                  </span>
                  <span className="text-[9.5px] font-sans font-bold uppercase tracking-widest text-[#5B2435] mt-1 hidden sm:block">
                    The right events · For your goals
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* ZONE 2: HIGH-CONTRAST SINGLE-LINE NAVIGATION LINKS */}
          <nav className="hidden lg:flex items-center gap-6 text-sm">
            {navLinks.map(link => {
              const isActive = activePage === link.page;
              return (
                <button
                  key={link.page}
                  onClick={() => navigateTo(link.page)}
                  className={`relative py-1 text-xs uppercase tracking-wider font-bold whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#5B2435]'
                      : 'text-[#4A3830] hover:text-[#241410]'
                  }`}
                >
                  <span>{link.label}</span>
                  {link.page === 'compare' && compareEventIds.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-[#5B2435] text-[#FFFDF8] font-bold">
                      {compareEventIds.length}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute -bottom-2.5 left-0 right-0 h-0.5 bg-[#5B2435]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ZONE 3: ACTIONS & UTILITIES WITH HIGH READABILITY */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            
            {/* Quick Goals Trigger Button */}
            <button
              onClick={() => setIsGoalsModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#D5C7B5] bg-[#F8F4EC] hover:bg-[#EFE5D5] text-xs font-bold text-[#241410] transition-colors whitespace-nowrap shadow-xs"
              title="Calibrate semester goals to recalculate event fit scores"
            >
              <Sliders className="w-3.5 h-3.5 text-[#5B2435]" />
              <span>My Goals</span>
            </button>

            {/* Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setRoleMenuOpen(!roleMenuOpen)}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] hover:bg-[#F8F4EC] text-xs font-semibold text-[#241410] transition-colors capitalize shadow-xs"
                aria-expanded={roleMenuOpen}
              >
                <span className="w-2 h-2 rounded-full bg-[#5B2435]" />
                <span className="text-[11px] font-bold">{currentUserRole} View</span>
                <ChevronDown className="w-3 h-3 text-[#665249]" />
              </button>

              {roleMenuOpen && (
                <div className="absolute right-0 mt-1.5 w-40 rounded-xl bg-[#FFFDF8] border border-[#D5C7B5] shadow-xl py-1 z-50 animate-fadeIn">
                  {(['student', 'organizer'] as UserRole[]).map(role => (
                    <button
                      key={role}
                      onClick={() => {
                        setCurrentUserRole(role);
                        setRoleMenuOpen(false);
                        if (role === 'organizer') navigateTo('organizer');
                        else if (activePage === 'organizer') navigateTo('discover');
                      }}
                      className={`w-full px-3 py-2 text-left text-xs capitalize flex items-center justify-between ${
                        currentUserRole === role
                          ? 'bg-[#F8F4EC] font-bold text-[#5B2435]'
                          : 'text-[#241410] hover:bg-[#FAF4EB]'
                      }`}
                    >
                      <span>{role} Perspective</span>
                      {currentUserRole === role && <CheckCircle2 className="w-3.5 h-3.5 text-[#5B2435]" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-lg text-[#4A3830] hover:text-[#241410] hover:bg-[#F8F4EC] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#5B2435]" />
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-[#FFFDF8] border border-[#D5C7B5] shadow-2xl p-4 z-50 animate-fadeIn">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E2D7C8]">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#241410]">
                        Campus Intelligence Alerts
                      </h4>
                      {unreadNotificationCount > 0 && (
                        <span className="text-[10px] bg-[#5B2435] text-white px-1.5 py-0.2 rounded-full font-bold">
                          {unreadNotificationCount}
                        </span>
                      )}
                    </div>
                    {unreadNotificationCount > 0 && (
                      <button
                        onClick={markAllNotificationsAsRead}
                        className="text-[11px] text-[#5B2435] hover:underline font-bold"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#665249] py-4 text-center">
                        No notifications right now.
                      </p>
                    ) : (
                      notifications.map(n => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            if (n.event_id) {
                              navigateTo('event-details', n.event_id);
                              setNotificationsOpen(false);
                            }
                          }}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                            n.read
                              ? 'border-transparent bg-[#F8F4EC]/60 text-[#4A3830]'
                              : 'border-[#5B2435]/30 bg-[#F8F4EC] text-[#241410]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <span className="font-bold text-xs text-[#241410]">
                              {n.title}
                            </span>
                            {!n.read && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#5B2435] shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-[11px] text-[#4A3830] mt-0.5 line-clamp-2 leading-relaxed">
                            {n.message}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar / Portfolio Link */}
            <button
              onClick={() => navigateTo('myevents')}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-[#F8F4EC] transition-colors"
              title="View your verified activity transcript"
            >
              <div className="w-8 h-8 rounded-full bg-[#E2D7C8] flex items-center justify-center text-[#5B2435] border border-[#CFC1AF] text-xs font-bold font-serif">
                AC
              </div>
              <span className="hidden sm:inline text-xs font-bold text-[#241410]">
                Alex Chen
              </span>
            </button>

            {/* Quick Auth / Account trigger */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden xl:inline-flex items-center px-2.5 py-1.5 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] hover:bg-[#F8F4EC] text-xs font-bold text-[#5B2435] transition-colors"
              title="Sign in or create account"
            >
              Sign In
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-[#241410] hover:bg-[#F8F4EC]"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E2D7C8] bg-[#FFFDF8] px-4 py-4 space-y-1.5 animate-fadeIn shadow-lg">
          {navLinks.map(link => (
            <button
              key={link.page}
              onClick={() => {
                navigateTo(link.page);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors ${
                activePage === link.page
                  ? 'bg-[#5B2435] text-[#FFFDF8]'
                  : 'text-[#241410] hover:bg-[#F8F4EC]'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-3 border-t border-[#E2D7C8] flex gap-2">
            <button
              onClick={() => {
                setIsGoalsModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="flex-1 py-2 text-center text-xs font-bold rounded-lg bg-[#5B2435] text-[#FFFDF8]"
            >
              Semester Goals
            </button>
            <button
              onClick={() => {
                setCurrentUserRole(currentUserRole === 'student' ? 'organizer' : 'student');
                setMobileMenuOpen(false);
              }}
              className="px-3 py-2 text-xs font-bold rounded-lg border border-[#D5C7B5] text-[#241410] bg-[#FFFDF8]"
            >
              Role: {currentUserRole}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
