import React, { useState, useEffect } from 'react';
import { Search, Sparkles, SlidersHorizontal, ArrowRight, RefreshCw } from 'lucide-react';
import { EventItem, EventCategory } from '../types/index.js';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { HeroWine } from '../components/HeroWine.js';
import { EventCard } from '../components/EventCard.js';

const CATEGORIES: EventCategory[] = [
  'All',
  'Workshops',
  'Hackathons',
  'Career Events',
  'Networking',
  'Cultural',
  'Competitions'
];

export const DiscoverPage: React.FC = () => {
  const { profile, setIsGoalsModalOpen, navigateTo } = useApp();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [recommended, setRecommended] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters state
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [freeOnly, setFreeOnly] = useState(false);
  const [certOnly, setCertOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'relevance' | 'time' | 'career'>('relevance');

  const fetchEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const [allEvents, recEvents] = await Promise.all([
        api.getEvents({
          category: selectedCategory,
          search: searchQuery.trim() || undefined,
          is_free: freeOnly ? true : undefined,
          certificate_only: certOnly ? true : undefined,
        }),
        api.getRecommendedEvents()
      ]);

      setEvents(allEvents);
      setRecommended(recEvents.slice(0, 3));
    } catch (err: any) {
      setError(err.message || 'Failed to load campus events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory, freeOnly, certOnly]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  // Sort client-side
  const sortedEvents = [...events].sort((a, b) => {
    if (sortBy === 'relevance') {
      return b.relevance.totalScore - a.relevance.totalScore;
    }
    if (sortBy === 'career') {
      return b.career_value_rating - a.career_value_rating;
    }
    return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
  });

  return (
    <div className="min-h-screen bg-transparent">
      {/* 1. EDITORIAL INTELLIGENCE OPENING */}
      <HeroWine />

      {/* 2. CATALOG & RECOMMENDATIONS BODY */}
      <div id="discover-section" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        {/* "Picked for you" Section (Top 3 Recommendations) */}
        {recommended.length > 0 && !searchQuery && selectedCategory === 'All' && (
          <section className="mb-16">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-[#E2D7C8] gap-4">
              <div>
                <span className="text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold block mb-1">
                  Personalized Priority Matches
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241410]">
                  Picked for your semester goals
                </h2>
                <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
                  Prioritized by active targets: {profile?.goals?.slice(0, 2).join(', ') || 'technical depth & internships'}.
                </p>
              </div>

              <button
                onClick={() => setIsGoalsModalOpen(true)}
                className="text-xs font-bold text-[#5B2435] hover:underline flex items-center gap-1.5 self-start sm:self-auto"
              >
                <span>Tune Semester Goals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {recommended.map(ev => (
                <EventCard key={`rec_${ev.id}`} event={ev} />
              ))}
            </div>
          </section>
        )}

        {/* Full Campus Catalog Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 pb-3 border-b border-[#E2D7C8] gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold block mb-1">
                Comprehensive Evaluation
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241410]">
                Events worth your time
              </h2>
              <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
                Showing {sortedEvents.length} opportunities evaluated by content depth, mentor credibility, and peer evidence.
              </p>
            </div>

            {/* Sorting Dropdown (High Contrast) */}
            <div className="flex items-center gap-2 text-xs font-semibold text-[#241410]">
              <span className="text-[#4A3830] font-bold">Sort by:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-[#FFFDF8] border border-[#D5C7B5] rounded-lg px-3 py-2 text-xs text-[#241410] font-bold focus:outline-none focus:border-[#5B2435] shadow-2xs"
              >
                <option value="relevance">Highest Relevance</option>
                <option value="time">Earliest Schedule</option>
                <option value="career">Career Leverage</option>
              </select>
            </div>
          </div>

          {/* Search & Filter Toolbar (Solid cream surface + high contrast inputs) */}
          <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-4 sm:p-5 shadow-xs mb-8">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              
              {/* Search input with solid background and high contrast text & placeholder */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#665249]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by topic, mentor, skill (e.g. ROS2, LLM, Venture)..."
                  className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] text-[#241410] placeholder:text-[#6E5A50] font-medium focus:outline-none focus:border-[#5B2435] focus:ring-1 focus:ring-[#5B2435]"
                />
              </form>

              {/* Quick toggles with distinct active/inactive contrast */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFreeOnly(!freeOnly)}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-bold transition-colors shadow-2xs ${
                    freeOnly
                      ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435]'
                      : 'border-[#D5C7B5] bg-[#FFFDF8] text-[#241410] hover:bg-[#F8F4EC]'
                  }`}
                >
                  Free Only
                </button>

                <button
                  type="button"
                  onClick={() => setCertOnly(!certOnly)}
                  className={`px-3.5 py-2 rounded-lg border text-xs font-bold transition-colors shadow-2xs ${
                    certOnly
                      ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435]'
                      : 'border-[#D5C7B5] bg-[#FFFDF8] text-[#241410] hover:bg-[#F8F4EC]'
                  }`}
                >
                  Certificate Offered
                </button>

                <button
                  type="button"
                  onClick={() => fetchEvents()}
                  className="p-2.5 rounded-lg border border-[#D5C7B5] text-[#241410] bg-[#FFFDF8] hover:bg-[#F8F4EC] transition-colors shadow-2xs"
                  title="Refresh catalog"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Category Segmented Control with clear active & inactive borders */}
            <div className="mt-4 pt-3 border-t border-[#E2D7C8] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {CATEGORIES.map(cat => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-bold rounded-lg shrink-0 transition-colors border ${
                      active
                        ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435] shadow-xs'
                        : 'text-[#30231F] border-[#E2D7C8] bg-[#FFFDF8] hover:bg-[#F8F4EC] hover:text-[#241410]'
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Loading, Error or Grid State */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="h-80 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] p-5 animate-pulse">
                  <div className="h-40 bg-[#F3EAE0] rounded-lg mb-4" />
                  <div className="h-4 w-1/3 bg-[#F3EAE0] rounded mb-2" />
                  <div className="h-5 w-3/4 bg-[#F3EAE0] rounded mb-2" />
                  <div className="h-3 w-full bg-[#F3EAE0] rounded mb-4" />
                  <div className="h-6 bg-[#F3EAE0] rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="py-16 text-center bg-[#FFFDF8] rounded-xl border border-[#E2D7C8] p-8">
              <p className="text-sm font-bold text-[#5B2435]">Unable to load campus events.</p>
              <p className="text-xs text-[#4A3830] mt-1">{error}</p>
              <button
                onClick={fetchEvents}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-[#5B2435] text-[#FFFDF8]"
              >
                Retry
              </button>
            </div>
          ) : sortedEvents.length === 0 ? (
            <div className="py-20 text-center bg-[#FFFDF8] rounded-xl border border-[#E2D7C8] p-8">
              <h3 className="font-serif text-xl font-bold text-[#241410]">
                No campus sessions match your current criteria.
              </h3>
              <p className="text-xs text-[#4A3830] mt-1 max-w-md mx-auto">
                Try widening your search terms or selecting 'All' categories to view all scheduled events.
              </p>
              <button
                onClick={() => {
                  setSelectedCategory('All');
                  setSearchQuery('');
                  setFreeOnly(false);
                  setCertOnly(false);
                }}
                className="mt-4 px-4 py-2 text-xs font-bold rounded-lg bg-[#5B2435] text-[#FFFDF8]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {sortedEvents.map(ev => (
                <EventCard key={ev.id} event={ev} />
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
};
