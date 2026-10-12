import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.js';

export const Footer: React.FC = () => {
  const { navigateTo, setIsGoalsModalOpen } = useApp();

  return (
    <footer className="bg-[#241410] text-[#FFFDF8] border-t border-[#4A3830] pt-14 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-[#4A3830]">
          
          {/* Brand & Mission with Official Emblem */}
          <div className="lg:col-span-2 space-y-3.5">
            <div className="flex items-center gap-3">
              <img
                src="/worthwhile-icon.svg"
                alt="WorthWhile Brand Emblem"
                className="w-9 h-9 object-contain shrink-0"
              />
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-[#FFFDF8] block leading-none">
                  WorthWhile
                </span>
                <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#E7DED2] block mt-1">
                  Campus Decision Intelligence
                </span>
              </div>
            </div>
            
            <p className="text-xs text-[#E7DED2] max-w-sm leading-relaxed font-normal">
              "The right events. At the right time. For your goals." The decision-making platform helping university students evaluate curriculum relevance, schedule feasibility, and attendance-verified peer audits.
            </p>

            <div className="pt-1 flex items-center gap-2 text-xs text-[#E5C178] font-mono font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#E5C178] shrink-0" />
              <span>Evidence-audited claims · Organizer check-in trust</span>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E5C178] mb-4">
              Intelligence
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E7DED2]">
              <li>
                <button onClick={() => navigateTo('discover')} className="hover:text-white transition-colors text-left">
                  Curated Discovery
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('freetime')} className="hover:text-white transition-colors text-left">
                  2-Hour Free Window
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('heatmap')} className="hover:text-white transition-colors text-left">
                  Campus Walking Heatmap
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('compare')} className="hover:text-white transition-colors text-left">
                  Multi-Factor Trade-off Matrix
                </button>
              </li>
            </ul>
          </div>

          {/* Students */}
          <div>
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E5C178] mb-4">
              Students
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E7DED2]">
              <li>
                <button onClick={() => navigateTo('myevents')} className="hover:text-white transition-colors text-left">
                  Activity Portfolio
                </button>
              </li>
              <li>
                <button onClick={() => setIsGoalsModalOpen(true)} className="hover:text-white transition-colors text-left">
                  Adjust Semester Goals
                </button>
              </li>
              <li>
                <button onClick={() => navigateTo('myevents')} className="hover:text-white transition-colors text-left">
                  Saved Sessions
                </button>
              </li>
              <li>
                <span className="text-[#D5C7B5]">Co-Curricular Transcript</span>
              </li>
            </ul>
          </div>

          {/* Organizers */}
          <div>
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#E5C7B5] mb-4">
              Organizers
            </h4>
            <ul className="space-y-2.5 text-xs text-[#E7DED2]">
              <li>
                <button onClick={() => navigateTo('organizer')} className="hover:text-white transition-colors text-left">
                  Organizer Console
                </button>
              </li>
              <li>
                <span className="text-[#D5C7B5]">Claim Audit Protocol</span>
              </li>
              <li>
                <span className="text-[#D5C7B5]">Attendance Verification</span>
              </li>
              <li>
                <span className="text-[#D5C7B5]">Punctuality Scorecard</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Credits with Solid High-Contrast Colors */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#D5C7B5] gap-3 font-mono">
          <p>© 2026 WorthWhile. Campus Event Decision Intelligence.</p>
          <p className="text-[#E7DED2]">
            Delhi Campus Coverage · IIITD, DTU, IGDTUW, IIT Delhi
          </p>
        </div>
      </div>
    </footer>
  );
};
