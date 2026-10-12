import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, AlertTriangle, CheckCircle, Trophy, ArrowRight, X, Plus } from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { RelevanceScoreRing } from '../components/RelevanceScoreRing.js';

export const ComparePage: React.FC = () => {
  const { compareEventIds, removeFromCompare, navigateTo } = useApp();

  const [priority, setPriority] = useState<'career' | 'learning' | 'networking' | 'convenience' | 'fun'>('career');
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchComparison = async () => {
      if (compareEventIds.length === 0) {
        setData(null);
        return;
      }
      setLoading(true);
      try {
        const res = await api.compareEvents(compareEventIds, priority);
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [compareEventIds, priority]);

  if (compareEventIds.length === 0) {
    return (
      <div className="min-h-screen bg-transparent py-16 px-4 text-center">
        <div className="mx-auto max-w-md bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-8 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#F8F4EC] text-[#5B2435] flex items-center justify-center mx-auto mb-4 border border-[#D5C7B5]">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#241410]">
            No Sessions in Compare Tray
          </h2>
          <p className="text-xs sm:text-sm text-[#4A3830] mt-2 leading-relaxed">
            Browse the campus catalog and click "Compare" on 2 to 4 events to evaluate conflicting schedules, deliverables, and trade-offs side by side.
          </p>
          <button
            onClick={() => navigateTo('discover')}
            className="mt-6 px-5 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
          >
            Explore Campus Sessions
          </button>
        </div>
      </div>
    );
  }

  const events = data?.events || [];
  const conflicts = data?.scheduleConflicts || [];
  const recommendedChoice = data?.recommendedChoice;

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#E2D7C8] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-2">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Multi-Factor Trade-off Matrix</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241410]">
              Side-by-Side Comparison
            </h1>
            <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
              Evaluating {events.length} sessions against your semester priorities and schedule availability.
            </p>
          </div>

          <button
            onClick={() => navigateTo('discover')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] hover:bg-[#F8F4EC] text-xs font-bold text-[#241410] transition-colors self-start md:self-auto shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#5B2435]" />
            <span>Add Another Session</span>
          </button>
        </div>

        {/* Schedule Conflict Banner */}
        {conflicts.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-[#5B2435]/10 border border-[#5B2435]/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#5B2435] shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#5B2435] font-mono">
                Direct Schedule Overlap
              </h4>
              {conflicts.map((c: any, i: number) => (
                <p key={i} className="text-xs text-[#241410] mt-1">
                  <strong>{c.eventATitle}</strong> and <strong>{c.eventBTitle}</strong> overlap by <strong>{c.overlapMinutes} minutes</strong>. You cannot attend both concurrently.
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Decision Card: "Which Should I Choose?" */}
        {recommendedChoice && (
          <div className="mb-8 rounded-xl bg-[#FFFDF8] border border-[#D5C7B5] p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-[#5B2435] text-[#FFFDF8] flex items-center justify-center shrink-0 shadow-xs">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B2435] font-bold">
                      Recommended for Your Profile
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#4A3830]">
                      ({recommendedChoice.winMargin})
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-serif font-bold text-[#241410] mt-0.5">
                    {recommendedChoice.eventTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#4A3830] mt-1 max-w-2xl leading-relaxed">
                    {recommendedChoice.reason}
                  </p>
                </div>
              </div>

              {/* Priority Selector Tabs */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-[#4A3830]">Target Focus:</span>
                <div className="flex flex-wrap items-center gap-1 bg-[#F8F4EC] p-1 rounded-lg border border-[#D5C7B5]">
                  {(['career', 'learning', 'networking', 'convenience', 'fun'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md capitalize transition-colors ${
                        priority === p
                          ? 'bg-[#5B2435] text-[#FFFDF8] shadow-xs'
                          : 'text-[#4A3830] hover:text-[#241410] hover:bg-[#FFFDF8]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Side-by-Side Specs Matrix Table */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E2D7C8] bg-[#F8F4EC]">
                <th className="p-4 sm:p-5 font-mono uppercase tracking-wider text-[11px] font-bold text-[#4A3830] min-w-[160px]">
                  Metric
                </th>
                {events.map((ev: any) => (
                  <th key={ev.id} className="p-4 sm:p-5 min-w-[260px] align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-[#5B2435] font-bold block font-mono">
                          {ev.category}
                        </span>
                        <h4 className="font-serif font-bold text-base text-[#241410] mt-1 line-clamp-2">
                          {ev.title}
                        </h4>
                      </div>
                      <button
                        onClick={() => removeFromCompare(ev.id)}
                        className="p-1 rounded-md text-[#4A3830] hover:bg-[#E2D7C8] transition-colors"
                        title="Remove from comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D7C8]">
              {/* Relevance Score */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Relevance Score</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5">
                    <RelevanceScoreRing score={ev.relevance.totalScore} size="sm" />
                  </td>
                ))}
              </tr>

              {/* Schedule & Time */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Schedule & Time</td>
                {events.map((ev: any) => {
                  const s = new Date(ev.start_time);
                  return (
                    <td key={ev.id} className="p-4 sm:p-5 text-[#4A3830]">
                      <div className="font-bold text-[#241410]">
                        {s.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </div>
                      <div className="font-mono text-[11px] font-semibold text-[#4A3830]">
                        {s.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </div>
                    </td>
                  );
                })}
              </tr>

              {/* Venue & Zone */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Venue & Zone</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5 text-[#4A3830]">
                    <div className="font-bold text-[#241410]">{ev.venue?.name}</div>
                    <div className="text-[11px] text-[#4A3830] font-medium">{ev.venue?.campus_zone}</div>
                  </td>
                ))}
              </tr>

              {/* Admission Cost */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Admission Cost</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5 font-bold text-[#241410] font-mono">
                    {ev.is_free ? 'Free' : `$${(ev.cost_cents/100).toFixed(2)}`}
                  </td>
                ))}
              </tr>

              {/* Certificate */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Certificate Offered</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5">
                    {ev.certificate_offered ? (
                      <span className="text-[#194D33] font-bold flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Included</span>
                      </span>
                    ) : (
                      <span className="text-[#4A3830] font-medium">None</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Career Value */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Career Value Rating</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5 font-bold font-mono text-[#241410]">
                    {ev.career_value_rating} / 100
                  </td>
                ))}
              </tr>

              {/* Learning Value */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Learning Value Rating</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5 font-bold font-mono text-[#241410]">
                    {ev.learning_value_rating} / 100
                  </td>
                ))}
              </tr>

              {/* Networking Potential */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Networking Level</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5 font-bold text-[#5B2435]">
                    {ev.networking_potential}
                  </td>
                ))}
              </tr>

              {/* Organizer Trust */}
              <tr className="hover:bg-[#F8F4EC]/50">
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Organizer Trust</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5 text-[#4A3830]">
                    <span className="font-bold text-[#241410]">
                      {ev.organizer?.name}
                    </span>
                    <span className="ml-1 text-[11px] text-[#5B2435] font-mono font-bold">
                      ({ev.organizer?.trust_score != null ? `${Math.round(ev.organizer.trust_score)}%${ev.organizer.is_demo ? ' demo' : ''}` : 'unrated'})
                    </span>
                  </td>
                ))}
              </tr>

              {/* Actions row */}
              <tr>
                <td className="p-4 sm:p-5 font-bold text-[#241410]">Action</td>
                {events.map((ev: any) => (
                  <td key={ev.id} className="p-4 sm:p-5">
                    <button
                      onClick={() => navigateTo('event-details', ev.id)}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
                    >
                      <span>Select Event</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};
