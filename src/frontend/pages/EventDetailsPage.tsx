import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, MapPin, Award, Users, ShieldCheck, Bookmark,
  CheckCircle2, AlertTriangle, ArrowLeft, Brain, Briefcase, FolderGit2, Navigation
} from 'lucide-react';
import { EventItem } from '../types/index.js';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { RelevanceScoreRing } from '../components/RelevanceScoreRing.js';
import { ClaimVerificationBadge } from '../components/ClaimVerificationBadge.js';
import { DelhiGoogleMap } from '../components/DelhiGoogleMap.js';

interface Props {
  eventId: string;
}

export const EventDetailsPage: React.FC<Props> = ({ eventId }) => {
  const {
    navigateTo,
    savedEventIds,
    toggleSave,
    registeredEventIds,
    registerForEvent,
    setScoreModalEvent,
    setReviewModalEvent
  } = useApp();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      try {
        const data = await api.getEventById(eventId);
        setEvent(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load event details');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent py-16 px-4">
        <div className="mx-auto max-w-5xl animate-pulse space-y-6">
          <div className="h-6 w-32 bg-[#E2D7C8] rounded" />
          <div className="h-64 bg-[#E2D7C8] rounded-xl" />
          <div className="h-24 bg-[#E2D7C8] rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-transparent py-16 px-4 text-center">
        <div className="mx-auto max-w-md bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-8 shadow-xs">
          <h2 className="font-serif text-2xl font-bold text-[#241410]">Session Not Found</h2>
          <p className="text-xs sm:text-sm text-[#4A3830] mt-2">{error || 'This campus session might have concluded or expired.'}</p>
          <button
            onClick={() => navigateTo('discover')}
            className="mt-6 px-5 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider shadow-xs"
          >
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const isSaved = savedEventIds.has(event.id);
  const isRegistered = registeredEventIds.has(event.id) || justRegistered;

  const startDate = new Date(event.start_time);
  const dateStr = startDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
  const timeStr = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit'
  });

  const handleRegister = async () => {
    setIsRegistering(true);
    try {
      await registerForEvent(event.id);
      setJustRegistered(true);
    } catch (err) {
      console.error(err);
    } finally {
      setIsRegistering(false);
    }
  };

  const insights = event.community_insights;
  const analytics = event.analytics;

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        
        {/* Top Breadcrumb & Action */}
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={() => navigateTo('discover')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#4A3830] hover:text-[#241410] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Discovery</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleSave(event.id)}
              className={`px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs ${
                isSaved
                  ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435]'
                  : 'bg-[#FFFDF8] text-[#241410] border-[#D5C7B5] hover:bg-[#F8F4EC]'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-[#FFFDF8]' : 'text-[#241410]'}`} />
              <span>{isSaved ? 'Saved' : 'Save Session'}</span>
            </button>
          </div>
        </div>

        {/* Hero Presentation Card */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-2xl overflow-hidden shadow-xs mb-10">
          <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-[#241410]">
            <img
              src={event.cover_image}
              alt={event.title}
              className="w-full h-full object-cover opacity-90"
            />
            {/* Dark Scrim guaranteeing AAA text contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />

            <div className="absolute top-4 left-4 text-xs font-mono font-bold uppercase tracking-wider text-[#FFFDF8] drop-shadow-md">
              <span>{event.category}</span>
            </div>

            {/* Relevance Score Ring on Banner */}
            <div
              onClick={() => setScoreModalEvent(event)}
              className="absolute top-4 right-4 bg-[#FFFDF8] px-3.5 py-2 rounded-xl shadow-lg border border-[#D5C7B5] flex items-center gap-2.5 cursor-pointer hover:border-[#5B2435] transition-colors"
            >
              <RelevanceScoreRing score={event.relevance.totalScore} size="sm" showLabel={false} />
              <div className="text-left">
                <span className="text-xs font-bold font-mono text-[#5B2435] block">
                  {event.relevance.totalScore}/100 Match
                </span>
                <span className="text-[10px] text-[#4A3830] underline font-bold">
                  Inspect breakdown
                </span>
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6 text-white">
              <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#FFFDF8] leading-tight drop-shadow-sm">
                {event.title}
              </h1>
              <p className="text-xs sm:text-sm text-[#F8F4EC] mt-2 max-w-2xl line-clamp-2 leading-relaxed drop-shadow-xs font-normal">
                {event.tagline}
              </p>
            </div>
          </div>

          {/* Quick Specifications Strip */}
          <div className="p-6 bg-[#FFFDF8] border-b border-[#E2D7C8] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-[#4A3830] block text-[10px] font-mono uppercase tracking-wider font-bold">Schedule</span>
              <div className="font-bold text-[#241410] mt-0.5">{dateStr}</div>
              <div className="text-[#4A3830] font-mono font-semibold">{timeStr}</div>
            </div>
            <div>
              <span className="text-[#4A3830] block text-[10px] font-mono uppercase tracking-wider font-bold">Campus Venue</span>
              <div className="font-bold text-[#241410] mt-0.5">{event.venue?.name}</div>
              <div className="text-[#4A3830] font-medium">{event.venue?.building} · {event.venue?.room}</div>
            </div>
            <div>
              <span className="text-[#4A3830] block text-[10px] font-mono uppercase tracking-wider font-bold">Organizer</span>
              <div className="font-bold text-[#241410] mt-0.5">{event.organizer?.name}</div>
              <div className="text-[#5B2435] font-mono font-bold">
                {event.organizer?.trust_score != null ? `${Math.round(event.organizer.trust_score)}% Trust${event.organizer.is_demo ? ' (demo)' : ''}` : 'Trust unrated'}
              </div>
            </div>
            <div>
              <span className="text-[#4A3830] block text-[10px] font-mono uppercase tracking-wider font-bold">Cost & Certificate</span>
              <div className="font-bold text-[#241410] mt-0.5 font-mono">{event.is_free ? 'Free' : `$${(event.cost_cents/100).toFixed(2)}`}</div>
              <div className="text-[#194D33] font-bold">{event.certificate_offered ? '✓ Certificate Offered' : 'No Certificate'}</div>
            </div>
          </div>

          {/* Registration / Attendance CTA Row */}
          <div className="p-6 bg-[#F8F4EC] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-[#4A3830]">
              {analytics && (
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#241410]">
                    {analytics.seats_registered} / {analytics.seats_total} seats registered ({Math.round((analytics.seats_registered/analytics.seats_total)*100)}% capacity)
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => setReviewModalEvent(event)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] hover:bg-[#FAF4EB] text-xs font-bold text-[#241410] transition-colors shadow-2xs"
              >
                Leave Feedback
              </button>

              <button
                onClick={handleRegister}
                disabled={isRegistering || isRegistered}
                className={`w-full sm:w-auto px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shadow-xs ${
                  isRegistered
                    ? 'bg-[#194D33] text-[#FFFDF8] cursor-default'
                    : 'bg-[#5B2435] text-[#FFFDF8] hover:bg-[#3F1723]'
                }`}
              >
                {isRegistered ? '✓ You Are Registered' : isRegistering ? 'Registering...' : 'Register for Session'}
              </button>
            </div>
          </div>
        </div>

        {/* Tangible ROI Deliverables */}
        <section className="mb-12">
          <div className="mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold block">
              Curricular Value
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#241410]">
              What will you get out of this?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Practical Skills */}
            <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
              <div className="flex items-center gap-2 text-[#5B2435] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <Brain className="w-3.5 h-3.5" />
                <span>Practical Skills</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#241410]">
                {event.skills_taught?.map((s, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#5B2435]" />
                    <span className="font-semibold">{s}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Career Leverage */}
            <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
              <div className="flex items-center gap-2 text-[#5B2435] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <Briefcase className="w-3.5 h-3.5" />
                <span>Career Leverage</span>
              </div>
              <p className="text-xs text-[#4A3830] leading-relaxed font-normal">
                Direct recruiter visibility and alumni referrals. Rated {event.career_value_rating}/100 career leverage.
              </p>
            </div>

            {/* Credential */}
            <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
              <div className="flex items-center gap-2 text-[#5B2435] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <Award className="w-3.5 h-3.5" />
                <span>Credential</span>
              </div>
              <p className="text-xs text-[#4A3830] leading-relaxed font-normal">
                {event.certificate_offered
                  ? 'Official cryptographically signed completion certificate sent to your campus email.'
                  : 'No certificate offered for this session; focused entirely on open dialogue & notes.'}
              </p>
            </div>

            {/* Networking */}
            <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
              <div className="flex items-center gap-2 text-[#5B2435] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <Users className="w-3.5 h-3.5" />
                <span>Peer Networking</span>
              </div>
              <p className="text-xs text-[#4A3830] leading-relaxed font-normal">
                {event.networking_potential} potential · Expected {event.max_capacity} attendees across CS, Design & Venture.
              </p>
            </div>

            {/* Portfolio Artifact */}
            <div className="p-5 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] shadow-xs">
              <div className="flex items-center gap-2 text-[#5B2435] text-xs font-bold uppercase tracking-wider mb-2 font-mono">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Portfolio Artifact</span>
              </div>
              <p className="text-xs text-[#4A3830] leading-relaxed font-normal">
                Walk away with runnable code or finished work ready to commit to your GitHub portfolio.
              </p>
            </div>
          </div>
        </section>

        {/* Truth in Advertising: Organizer Claims vs Student Evidence */}
        <section className="mb-12">
          <div className="mb-4">
            <span className="text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold block">
              Truth in Advertising Protocol
            </span>
            <h2 className="text-2xl font-serif font-bold text-[#241410]">
              Organizer Claims vs. Student Evidence
            </h2>
            <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
              A claim is marked verified only when at least 5 organizer-checked-in attendees confirm it. Seeded demo claims are labelled as samples.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            
            {/* Col 1: Organizer Claims */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#4A3830] font-bold pb-2 border-b border-[#E2D7C8]">
                Audited Claims ({event.claims?.length || 0})
              </h3>

              {event.claims && event.claims.length > 0 ? (
                event.claims.map(claim => (
                  <ClaimVerificationBadge key={claim.id} claim={claim} />
                ))
              ) : (
                <div className="p-5 bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl text-xs text-[#4A3830]">
                  No organizer claims have been published for this event.
                </div>
              )}
            </div>

            {/* Col 2: Behavioral Signals */}
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#4A3830] font-bold pb-2 border-b border-[#E2D7C8]">
                Punctuality & Turnout Signals
              </h3>

              {analytics && (
                <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 space-y-3 text-xs text-[#241410] shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-[#E2D7C8]">
                    <span className="text-[#4A3830] font-medium">Queue peak arrival</span>
                    <strong className="font-bold text-[#5B2435] font-mono">
                      {analytics.peak_queue_time || '10 min before start'}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#E2D7C8]">
                    <span className="text-[#4A3830] font-medium">Historical start delay</span>
                    <strong className="font-bold text-[#241410]">
                      {analytics.delay_minutes_avg <= 5
                        ? 'Starts strictly on time'
                        : `Usually starts ~${analytics.delay_minutes_avg} mins late`}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-[#E2D7C8]">
                    <span className="text-[#4A3830] font-medium">Attendance turnout rate</span>
                    <strong className="font-bold text-[#194D33] font-mono">
                      {analytics.attendance_rate_pct}% turnout{analytics.is_demo ? ' (demo)' : ''}
                    </strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[#4A3830] font-medium">Data provenance</span>
                    <span className="text-[10px] font-mono uppercase font-bold text-[#4A3830]">
                      {analytics.is_demo ? 'Demo sample data' : `${analytics.signal_type} analytics`}
                    </span>
                  </div>
                </div>
              )}

              {/* Community Insights Summary */}
              {insights && insights.hasData !== false && (
                <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 text-xs shadow-xs">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-[#5B2435] mb-2 font-mono">
                    Reviewer Consensus
                  </h4>
                  <div className="space-y-2">
                    {insights.summaryStatements.pros.map((pro, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[#241410]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#194D33] shrink-0 mt-0.5" />
                        <span className="font-medium">{pro}</span>
                      </div>
                    ))}
                    {insights.summaryStatements.caveats.map((cav, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[#78350F]">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="font-medium">{cav}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Venue Location & Map */}
        <section className="mb-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 pb-2 border-b border-[#E2D7C8] gap-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold block">
                Venue Location
              </span>
              <h2 className="text-2xl font-serif font-bold text-[#241410]">
                {event.venue?.name}
              </h2>
              <p className="text-xs sm:text-sm text-[#4A3830] mt-0.5 font-normal">
                {event.venue?.building} · {event.venue?.room} ({event.venue?.address})
              </p>
            </div>

            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${event.venue?.latitude},${event.venue?.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#5B2435] hover:bg-[#3F1723] text-[#FFFDF8] font-bold text-xs transition-colors self-start sm:self-auto shadow-xs"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Get Directions</span>
            </a>
          </div>

          <div className="rounded-xl overflow-hidden border border-[#E2D7C8] shadow-xs">
            <DelhiGoogleMap
              events={[event]}
              selectedEventId={event.id}
              selectedLocation={{
                lat: event.venue?.latitude || 28.545,
                lng: event.venue?.longitude || 77.1926,
                name: event.venue?.name,
                address: event.venue?.address
              }}
              height="320px"
              zoom={14}
              showSearch={false}
            />
          </div>
        </section>

        {/* Reviews Feed */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E2D7C8]">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#241410]">
                Student Reviews ({event.reviews?.length || 0})
                {event.reviews && event.reviews.length > 0 && (
                  <span className="ml-2 text-xs font-normal text-[#4A3830] font-mono font-medium">
                    {event.reviews.filter(r => r.is_verified_attendee).length} attendance-verified · {event.reviews.filter(r => r.is_demo).length} demo
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={() => setReviewModalEvent(event)}
              className="text-xs font-bold text-[#5B2435] hover:underline"
            >
              + Submit 30-Second Review
            </button>
          </div>

          <div className="space-y-3">
            {event.reviews && event.reviews.length > 0 ? (
              event.reviews.map(rev => (
                <div key={rev.id} className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 text-xs shadow-xs">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#241410]">{rev.user_name}</span>
                      <span className="text-[#CFC1AF]">·</span>
                      <span className="text-[#4A3830] font-medium">{rev.user_degree}</span>
                      {rev.is_demo ? (
                        <span className="text-[10px] font-mono text-[#4A3830] bg-[#F8F4EC] px-1.5 py-0.5 rounded border border-[#D5C7B5]">
                          Demo sample
                        </span>
                      ) : rev.is_verified_attendee ? (
                        <span className="text-[10px] font-mono font-bold text-[#194D33] bg-[#DCFCE7] border border-[#86EFAC] px-1.5 py-0.5 rounded" title="Organizer checked this student in at the event">
                          ✓ Attendance verified
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-[#4A3830] bg-[#F8F4EC] px-1.5 py-0.5 rounded border border-[#D5C7B5]" title="No organizer check-in on record">
                          Unverified
                        </span>
                      )}
                    </div>
                    <span className="font-bold font-mono text-[#5B2435]">
                      ★ {rev.rating_overall.toFixed(1)} / 5.0
                    </span>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-[#241410] mt-2 leading-relaxed font-normal">
                      "{rev.comment}"
                    </p>
                  )}

                  {rev.tags && rev.tags.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {rev.tags.map(t => (
                        <span key={t} className="text-[10px] bg-[#F8F4EC] text-[#4A3830] border border-[#D5C7B5] px-2 py-0.5 rounded font-semibold">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-[#4A3830] py-4">No student reviews submitted yet for this session.</p>
            )}
          </div>
        </section>

      </div>
    </div>
  );
};
