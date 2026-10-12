import React from 'react';
import { X, Target, Compass, Briefcase, GraduationCap, MapPin, Users, ShieldCheck } from 'lucide-react';
import { EventItem } from '../types/index.js';
import { useApp } from '../context/AppContext.js';

interface Props {
  event: EventItem | null;
  onClose: () => void;
}

export const RelevanceScoreModal: React.FC<Props> = ({ event, onClose }) => {
  const { setIsGoalsModalOpen } = useApp();

  if (!event) return null;

  const rel = event.relevance;

  const factors = [
    { label: 'Semester Goal Alignment', weight: '25%', value: rel.goalFit, icon: Target, desc: 'Direct match with your active semester priorities and milestones.' },
    { label: 'Technical & Domain Depth', weight: '15%', value: rel.interestFit, icon: Compass, desc: 'Curriculum alignment with your technical tracks and engineering focus.' },
    { label: 'Career & Industry Leverage', weight: '15%', value: rel.careerValue, icon: Briefcase, desc: 'Recruiter presence, industry portfolio artifact, and resume signal.' },
    { label: 'Practical Hands-on Learning', weight: '15%', value: rel.learningValue, icon: GraduationCap, desc: 'Demonstrated takeaway code, hardware lab time, or verified repo.' },
    { label: 'Campus Proximity & Transit', weight: '10%', value: rel.convenience, icon: MapPin, desc: 'Walking or transit distance from your primary campus residence.' },
    { label: 'Verified Attendee Feedback', weight: '10%', value: rel.communityScore, icon: Users, desc: 'Historical ratings submitted by verified checked-in attendees.' },
    { label: 'Organizer Trust Rating', weight: '10%', value: rel.organizerTrust, icon: ShieldCheck, desc: 'Historical credibility and claim verification record on campus.' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#4A3830] hover:bg-[#F8F4EC] hover:text-[#241410] transition-colors"
          aria-label="Close score breakdown"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="text-[11px] font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-1">
            Explainable Decision Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241410] leading-tight">
            Why this event scored {rel.totalScore}/100 for you
          </h2>
          <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
            {event.title}
          </p>
        </div>

        {/* Narrative Box */}
        <div className="p-4 rounded-xl bg-[#F8F4EC] border border-[#D5C7B5]">
          <p className="text-xs sm:text-sm text-[#241410] leading-relaxed font-normal">
            {rel.explanation}
          </p>

          {rel.topMatchingFactors && rel.topMatchingFactors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#D5C7B5]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B2435] block mb-1.5 font-mono">
                Dominant Recommendation Factors:
              </span>
              <ul className="space-y-1 text-xs text-[#4A3830]">
                {rel.topMatchingFactors.map((factor, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-[#5B2435] font-bold">·</span>
                    <span className="font-medium">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Factor Breakdown Bars */}
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2D7C8]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#241410] font-mono">
              Mathematical Factor Breakdown
            </h3>
            <button
              onClick={() => {
                onClose();
                setIsGoalsModalOpen(true);
              }}
              className="text-xs text-[#5B2435] hover:underline font-bold"
            >
              Adjust Goals →
            </button>
          </div>

          <div className="space-y-2.5">
            {factors.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-3.5 rounded-xl border border-[#E2D7C8] bg-[#FFFDF8] shadow-2xs">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#241410]">
                      <Icon className="w-3.5 h-3.5 text-[#5B2435]" />
                      <span>{item.label}</span>
                      <span className="text-[#4A3830] text-[11px] font-mono font-medium">({item.weight})</span>
                    </div>
                    <span className="font-mono font-bold text-xs text-[#241410]">
                      {item.value}%
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A3830] mb-2 font-normal">
                    {item.desc}
                  </p>
                  <div className="w-full bg-[#E2D7C8] h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#5B2435] rounded-full transition-all duration-500"
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-[#E2D7C8] flex items-center justify-between text-xs text-[#4A3830]">
          <span className="font-medium">Weights adjust automatically based on your semester goals.</span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
