import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Calendar, Clock, Bookmark, CheckCircle2, Star, Sparkles, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { EventItem } from '../types/index.js';
import { EventCard } from '../components/EventCard.js';

export const MyEventsPage: React.FC = () => {
  const { navigateTo, setIsGoalsModalOpen, setReviewModalEvent } = useApp();

  const [activeTab, setActiveTab] = useState<'portfolio' | 'saved' | 'upcoming' | 'attended'>('portfolio');
  const [activity, setActivity] = useState<any | null>(null);
  const [savedEvents, setSavedEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [actData, savedData] = await Promise.all([
          api.getUserActivity(),
          api.getSavedEvents()
        ]);
        setActivity(actData);
        setSavedEvents(savedData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = activity?.stats || {
    eventsAttended: 0,
    skillsExplored: 0,
    certificatesEarned: 0,
    networkingEvents: 0,
    reviewsContributed: 0,
    verifiedHoursLogged: 0
  };

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E2D7C8] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Student Co-Curricular Record</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241410]">
              My Events & Portfolio
            </h1>
            <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
              Your verified transcript of campus activity. Hours, skills, and certificates count only when an organizer records your check-in.
            </p>
          </div>

          <button
            onClick={() => setIsGoalsModalOpen(true)}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#5B2435] text-[#FFFDF8] hover:bg-[#3F1723] transition-colors self-start sm:self-auto shadow-xs"
          >
            Edit Semester Goals
          </button>
        </div>

        {/* Portfolio Scorecard */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#241410] font-mono block">
              {stats.eventsAttended}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Sessions Attended
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#5B2435] font-mono block">
              {stats.skillsExplored}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Skills Acquired
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#194D33] font-mono block">
              {stats.certificatesEarned}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Certificates
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#241410] font-mono block">
              {stats.networkingEvents}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Mixers & Fairs
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#8C652D] font-mono block">
              {stats.reviewsContributed}
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Audits Contributed
            </span>
          </div>

          <div className="p-4 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] text-center shadow-xs">
            <span className="text-2xl font-serif font-bold text-[#241410] font-mono block">
              {stats.verifiedHoursLogged}h
            </span>
            <span className="text-[10px] font-mono font-bold text-[#4A3830] uppercase tracking-wider">
              Checked-in Hours
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 mb-6 border-b border-[#E2D7C8] pb-1 overflow-x-auto">
          {[
            { id: 'portfolio', label: 'Activity Portfolio' },
            { id: 'saved', label: `Saved Sessions (${savedEvents.length})` },
            { id: 'upcoming', label: `Upcoming Registrations (${activity?.upcomingEvents?.length || 1})` },
            { id: 'attended', label: `Attended History (${activity?.attendedEvents?.length || 1})` },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 -mb-1 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-[#5B2435] text-[#5B2435]'
                  : 'border-transparent text-[#4A3830] hover:text-[#241410]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Activity Portfolio */}
        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            {/* Skills Explored Matrix */}
            <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-6 shadow-xs">
              <h3 className="text-base font-serif font-bold text-[#241410] mb-1">
                Verified Skill Takeaways
              </h3>
              <p className="text-xs text-[#4A3830] mb-4 font-normal">
                These capabilities have been verified through checked-in event attendance.
              </p>
              <div className="flex flex-wrap gap-2">
                {activity?.skillsExploredList?.map((skill: string) => (
                  <div
                    key={skill}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F4EC] border border-[#D5C7B5] text-xs font-bold text-[#241410]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#194D33]" />
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick prompt for pending review */}
            <div className="bg-[#5B2435]/5 border border-[#5B2435]/25 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#5B2435]">
                  Audit Pending
                </span>
                <h4 className="text-sm font-bold text-[#241410] mt-0.5">
                  Confirm claims for "Hands-on ROS2 & Real-Time LiDAR SLAM Mapping"
                </h4>
                <p className="text-xs text-[#4A3830] mt-0.5 font-normal">
                  You attended this session. Your feedback directly verifies or refutes organizer claims for future students.
                </p>
              </div>

              <button
                onClick={() => setReviewModalEvent({ id: 'evt_robotics_ros2_lab', title: 'Hands-on ROS2 & Real-Time LiDAR SLAM Mapping' } as any)}
                className="px-4 py-2 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shrink-0 shadow-xs"
              >
                Submit 30-Sec Review
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Saved Events */}
        {activeTab === 'saved' && (
          <div>
            {savedEvents.length === 0 ? (
              <div className="py-16 text-center bg-[#FFFDF8] rounded-xl border border-[#E2D7C8] p-8">
                <Bookmark className="w-8 h-8 text-[#665249]/50 mx-auto mb-2" />
                <h3 className="font-serif text-lg font-bold text-[#241410]">
                  No saved campus sessions yet
                </h3>
                <p className="text-xs text-[#4A3830] mt-1 max-w-sm mx-auto font-normal">
                  Click the bookmark icon on any event card to save sessions for later consideration.
                </p>
                <button
                  onClick={() => navigateTo('discover')}
                  className="mt-4 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-[#5B2435] text-[#FFFDF8] shadow-xs"
                >
                  Explore Discovery
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {savedEvents.map(ev => (
                  <EventCard key={ev.id} event={ev} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Upcoming Registrations */}
        {activeTab === 'upcoming' && (
          <div className="space-y-4">
            {activity?.upcomingEvents?.map((reg: any) => (
              <div key={reg.id} className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#194D33] font-bold block mb-1">
                    Confirmed Registration · {reg.category}
                  </span>
                  <h4 className="font-serif font-bold text-lg text-[#241410]">
                    {reg.title}
                  </h4>
                  <p className="text-xs text-[#4A3830] mt-0.5 font-normal">
                    {new Date(reg.start_time).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} · {new Date(reg.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>

                <button
                  onClick={() => navigateTo('event-details', reg.id)}
                  className="px-4 py-2 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
                >
                  Session Dossier
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Attended History */}
        {activeTab === 'attended' && (
          <div className="space-y-4">
            {activity?.attendedEvents?.map((att: any) => (
              <div key={att.id} className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#194D33] font-bold">
                      ✓ Checked In by Organizer
                    </span>
                    <span className="text-[#CFC1AF]">·</span>
                    <span className="text-[10px] font-mono font-bold text-[#4A3830]">{att.category}</span>
                  </div>
                  <h4 className="font-serif font-bold text-lg text-[#241410]">
                    {att.title}
                  </h4>
                  <p className="text-xs text-[#4A3830] mt-0.5 font-normal">
                    Attended on {new Date(att.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>

                <button
                  onClick={() => setReviewModalEvent(att)}
                  className="px-4 py-2 rounded-lg border border-[#D5C7B5] bg-[#F8F4EC] hover:bg-[#EFE5D5] text-[#241410] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
                >
                  Write Review
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
