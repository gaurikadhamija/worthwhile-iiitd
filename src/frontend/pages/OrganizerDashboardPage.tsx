import React, { useState, useEffect } from 'react';
import {
  Users, CheckCircle2, AlertTriangle, TrendingUp, Star, ShieldCheck,
  Plus, Calendar, MapPin, X, ArrowUpRight
} from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';

export const OrganizerDashboardPage: React.FC = () => {
  const { navigateTo } = useApp();

  const [dashboardData, setDashboardData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form state for creating a new event
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventCategory, setNewEventCategory] = useState('Workshops');
  const [newEventTagline, setNewEventTagline] = useState('');
  const [newEventCapacity, setNewEventCapacity] = useState(100);
  const [newEventCert, setNewEventCert] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.getOrganizerDashboard('org_acm');
      setDashboardData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.createEvent({
        title: newEventTitle,
        category: newEventCategory,
        tagline: newEventTagline,
        max_capacity: newEventCapacity,
        certificate_offered: newEventCert,
        organizer_id: 'org_acm',
        venue_id: 'ven_turing_aud',
        start_time: new Date(Date.now() + 86400000).toISOString(),
        end_time: new Date(Date.now() + 93600000).toISOString(),
        cost_cents: 0,
        is_free: true,
        cover_image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        networking_potential: 'High',
        career_value_rating: 90,
        learning_value_rating: 92,
        tags: ['New Event', 'Hands-on', 'Tech'],
        skills_taught: ['AI APIs', 'Autonomous Systems']
      });

      setIsCreateModalOpen(false);
      setNewEventTitle('');
      setNewEventTagline('');
      await fetchDashboard();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-16 px-4">
        <div className="mx-auto max-w-6xl animate-pulse space-y-6">
          <div className="h-6 w-40 bg-[#E2D7C8] rounded" />
          <div className="grid grid-cols-4 gap-4 h-32 bg-[#E2D7C8] rounded-xl" />
        </div>
      </div>
    );
  }

  const cards = dashboardData?.summaryCards || {};
  const org = dashboardData?.organizer || {};
  const demo = dashboardData?.demoSample;
  const fmt = (v: number | null | undefined, suffix = '') => (v === null || v === undefined ? '—' : `${v}${suffix}`);

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 pb-4 border-b border-[#E2D7C8] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Organizer Trust & Analytics Console</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241410]">
              {org.name || 'ACM Student Chapter'}
            </h1>
            <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-mono font-medium">
              Trust Score: <strong className="text-[#5B2435] font-bold">{org.trust_score}%</strong>{org.is_demo ? ' (demo)' : ''} · Punctuality Rating: <strong className="text-[#241410] font-bold">{org.avg_punctuality_rating} / 5.0</strong>
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Publish New Session</span>
          </button>
        </div>

        {/* Demo Disclaimer notice */}
        {demo && (
          <div className="mb-6 p-4 rounded-xl bg-[#F8F4EC] border border-[#D5C7B5] text-xs text-[#4A3830]" role="note">
            <strong className="text-[#241410]">Demo sample notice:</strong> {demo.note} Illustrative seed data for this organizer:
            {' '}{demo.totalRegistrations} RSVPs · {demo.totalAttended} attended · rating {demo.averageRating ?? '—'} · claim health {demo.claimVerificationHealthPct ?? '—'}%.
            The metrics below track genuine platform activity.
          </div>
        )}

        {/* Actionable Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A3830] font-bold block mb-1">
              Total RSVPs
            </span>
            <div className="text-2xl font-serif font-bold text-[#241410] font-mono">
              {fmt(cards.totalRegistrations)}
            </div>
            <span className="text-[11px] text-[#194D33] font-bold flex items-center gap-1 mt-1 font-mono">
              <TrendingUp className="w-3 h-3" />
              <span>{cards.attendanceRatePct === null || cards.attendanceRatePct === undefined ? 'No check-ins yet' : `${cards.attendanceRatePct}% verified turnout`}</span>
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A3830] font-bold block mb-1">
              Verified Rating
            </span>
            <div className="text-2xl font-serif font-bold text-[#5B2435] font-mono">
              {cards.averageRating == null ? 'No reviews yet' : `★ ${cards.averageRating}`}
            </div>
            <span className="text-[11px] text-[#4A3830] mt-1 block font-mono font-medium">
              Content: {fmt(cards.contentScore)} · {cards.verifiedReviewCount ?? 0} verified reviews
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A3830] font-bold block mb-1">
              Claim Truth Health
            </span>
            <div className="text-2xl font-serif font-bold text-[#194D33] font-mono">
              {fmt(cards.claimVerificationHealthPct, '%')}
            </div>
            <span className="text-[11px] text-[#194D33] font-bold mt-1 block font-mono">
              Audited by checked-in attendees
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#4A3830] font-bold block mb-1">
              Active Catalog
            </span>
            <div className="text-2xl font-serif font-bold text-[#241410] font-mono">
              {cards.activeEventsCount} Sessions
            </div>
            <span className="text-[11px] text-[#4A3830] mt-1 block font-medium">
              Turing Hall & Innovation Quads
            </span>
          </div>
        </div>

        {/* Two Columns: Attendee Feedback */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Commendations */}
          <div className="p-6 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#194D33] font-bold flex items-center gap-1.5 mb-4">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>What Attendees Commended Most</span>
            </h3>

            <div className="space-y-3">
              {dashboardData?.studentsLoved?.map((item: any, i: number) => (
                <div key={i} className="p-3.5 rounded-lg bg-[#194D33]/5 border border-[#194D33]/25 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#241410]">
                    <span>{item.topic}</span>
                    <span className="text-[#194D33] font-mono font-bold">{item.votes} mentions</span>
                  </div>
                  <p className="text-[11px] text-[#4A3830] italic mt-1 leading-relaxed">
                    "{item.quote}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Friction points */}
          <div className="p-6 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#78350F] font-bold flex items-center gap-1.5 mb-4">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Attendee Friction & Logistical Notes</span>
            </h3>

            <div className="space-y-3">
              {dashboardData?.studentsDisliked?.map((item: any, i: number) => (
                <div key={i} className="p-3.5 rounded-lg bg-[#78350F]/5 border border-[#78350F]/25 text-xs">
                  <div className="flex items-center justify-between font-bold text-[#241410]">
                    <span>{item.topic}</span>
                    <span className="text-[10px] uppercase font-bold text-[#78350F] font-mono">
                      {item.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A3830] mt-1 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Claims with Weak Evidence Alert */}
        {dashboardData?.weakEvidenceClaims && dashboardData.weakEvidenceClaims.length > 0 && (
          <div className="mb-8 p-6 rounded-xl bg-[#FFFDF8] border border-[#5B2435]/30 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#5B2435] font-bold mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Promotional Claims Awaiting Evidence</span>
            </div>
            <p className="text-xs text-[#4A3830] mb-4">
              These promotional statements have attendee confirmation below 80%. Ensure session curriculum delivers on stated deliverables.
            </p>

            <div className="space-y-3">
              {dashboardData.weakEvidenceClaims.map((wc: any) => (
                <div key={wc.id} className="p-3.5 rounded-lg bg-[#5B2435]/5 border border-[#5B2435]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-[#241410] block">
                      "{wc.claimText}"
                    </span>
                    <span className="text-[11px] text-[#4A3830] font-mono">
                      On: {wc.eventTitle} · Confirmation: {wc.score}% ({wc.sampleSize} {wc.isDemo ? 'sample responses' : 'checked-in attendees'})
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-[#5B2435] bg-white px-2.5 py-1 rounded border border-[#5B2435]/30 shrink-0">
                    {wc.recommendation}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Managed Sessions Table */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 sm:p-6 shadow-xs">
          <h3 className="text-base font-serif font-bold text-[#241410] mb-4">
            Managed Sessions & Attendance Records
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E2D7C8] text-[#4A3830] font-mono text-[11px]">
                  <th className="pb-3 font-bold uppercase tracking-wider">Session</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Category</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">RSVPs</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Checked In</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Capacity</th>
                  <th className="pb-3 font-bold uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D7C8]">
                {dashboardData?.recentEvents?.map((ev: any) => (
                  <tr key={ev.id} className="hover:bg-[#F8F4EC]/50">
                    <td className="py-3 font-semibold text-[#241410] max-w-xs truncate">
                      {ev.title}
                    </td>
                    <td className="py-3 text-[#4A3830]">{ev.category}</td>
                    <td className="py-3 font-bold text-[#241410] font-mono">{ev.registered}</td>
                    <td className="py-3 text-[#194D33] font-bold font-mono">{ev.attended}</td>
                    <td className="py-3 text-[#4A3830] font-mono">{ev.capacity}</td>
                    <td className="py-3">
                      <button
                        onClick={() => navigateTo('event-details', ev.id)}
                        className="text-[#5B2435] hover:underline font-bold"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CREATE EVENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-xl bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-lg text-[#4A3830] hover:bg-[#F8F4EC]"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-serif font-bold text-[#241410]">
              Publish Campus Session
            </h2>
            <p className="text-xs text-[#4A3830] mt-1 font-normal">
              Events are scored transparently through our relevance engine. Check-ins are audited by attendees.
            </p>

            <form onSubmit={handleCreateEvent} className="mt-6 space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#241410] block mb-1 uppercase tracking-wider text-[10px] font-mono">
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  placeholder="e.g. Distributed Consensus in Raft: Live Lab"
                  className="w-full rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] p-3 text-xs text-[#241410] font-medium placeholder:text-[#6E5A50] focus:outline-none focus:border-[#5B2435]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-[#241410] block mb-1 uppercase tracking-wider text-[10px] font-mono">
                    Category
                  </label>
                  <select
                    value={newEventCategory}
                    onChange={e => setNewEventCategory(e.target.value)}
                    className="w-full rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] p-3 text-xs text-[#241410] font-semibold focus:outline-none focus:border-[#5B2435]"
                  >
                    <option value="Workshops">Workshops</option>
                    <option value="Career Events">Career Events</option>
                    <option value="Hackathons">Hackathons</option>
                    <option value="Networking">Networking</option>
                    <option value="Competitions">Competitions</option>
                    <option value="Cultural">Cultural</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#241410] block mb-1 uppercase tracking-wider text-[10px] font-mono">
                    Seat Capacity
                  </label>
                  <input
                    type="number"
                    value={newEventCapacity}
                    onChange={e => setNewEventCapacity(Number(e.target.value))}
                    className="w-full rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] p-3 text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#241410] block mb-1 uppercase tracking-wider text-[10px] font-mono">
                  Tagline & Focus
                </label>
                <input
                  type="text"
                  required
                  value={newEventTagline}
                  onChange={e => setNewEventTagline(e.target.value)}
                  placeholder="e.g. Hands-on coding session in Turing Auditorium"
                  className="w-full rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] p-3 text-xs text-[#241410] font-medium placeholder:text-[#6E5A50] focus:outline-none focus:border-[#5B2435]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="certCheck"
                  checked={newEventCert}
                  onChange={e => setNewEventCert(e.target.checked)}
                  className="rounded text-[#5B2435] focus:ring-[#5B2435]"
                />
                <label htmlFor="certCheck" className="text-xs text-[#241410] font-semibold">
                  Official Completion Certificate Provided (Will be verified by students)
                </label>
              </div>

              <div className="pt-4 border-t border-[#E2D7C8] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#4A3830] hover:text-[#241410]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
                >
                  {isSubmitting ? 'Publishing...' : 'Publish to Campus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
