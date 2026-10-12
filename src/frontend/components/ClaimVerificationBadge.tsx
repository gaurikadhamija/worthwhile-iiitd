import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck } from 'lucide-react';
import { OrganizerClaim } from '../types/index.js';

interface Props {
  claim: OrganizerClaim;
  compact?: boolean;
}

export const ClaimVerificationBadge: React.FC<Props> = ({ claim, compact = false }) => {
  const isVerified = claim.verification_status === 'verified';
  const isPartial = claim.verification_status === 'partially_verified';
  const isContradicted = claim.verification_status === 'contradicted';

  const tier = claim.evidence_tier ?? (claim.is_demo ? 'demo' : 'none');
  const isDemo = tier === 'demo';
  const isAwaiting = tier === 'submitted' || tier === 'none';

  // Strict verification rules: accessible high-contrast colors (WCAG AA & AAA)
  const badgeConfig = isDemo
    ? {
        label: 'Demo Sample',
        icon: AlertTriangle,
        color: 'text-[#4A3830]',
        bg: 'bg-[#F8F4EC]',
        border: 'border-[#D5C7B5]',
        barColor: 'bg-[#8C652D]'
      }
    : isAwaiting
    ? {
        label: 'Awaiting Verification',
        icon: AlertTriangle,
        color: 'text-[#4A3830]',
        bg: 'bg-[#F8F4EC]',
        border: 'border-[#D5C7B5]',
        barColor: 'bg-[#CFC1AF]'
      }
    : isVerified
    ? {
        label: 'Verified Claim',
        icon: CheckCircle2,
        color: 'text-[#194D33]',
        bg: 'bg-[#DCFCE7]/70',
        border: 'border-[#86EFAC]',
        barColor: 'bg-[#194D33]'
      }
    : isPartial
    ? {
        label: 'Partially Verified',
        icon: AlertTriangle,
        color: 'text-[#78350F]',
        bg: 'bg-[#FEF3C7]',
        border: 'border-[#FCD34D]',
        barColor: 'bg-[#B78A4A]'
      }
    : {
        label: 'Contradicted',
        icon: XCircle,
        color: 'text-[#9A1B28]',
        bg: 'bg-[#FEE2E2]',
        border: 'border-[#FCA5A5]',
        barColor: 'bg-[#9A1B28]'
      };

  const Icon = badgeConfig.icon;

  if (compact) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-[#4A3830]" title={claim.evidence_label}>
        <Icon className={`w-3.5 h-3.5 ${badgeConfig.color}`} />
        <span className={`font-bold text-[11px] ${badgeConfig.color}`}>
          {badgeConfig.label}
        </span>
        {!isAwaiting && (
          <span className="text-[11px] font-mono text-[#4A3830]">
            ({claim.evidence_score}% by {claim.student_sample_size} {isDemo ? 'samples' : 'checked-in attendees'})
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#E2D7C8] bg-[#FFFDF8] p-4 transition-colors hover:border-[#5B2435] shadow-xs">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#5B2435] font-bold block">
            Organizer Statement
          </span>
          <p className="text-xs sm:text-sm font-semibold text-[#241410] mt-0.5">
            "{claim.claim_text}"
          </p>
        </div>

        <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider shrink-0 ${badgeConfig.bg} ${badgeConfig.color} ${badgeConfig.border}`}>
          <Icon className="w-3 h-3" />
          <span>{badgeConfig.label}</span>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-[#E2D7C8] flex items-center justify-between text-xs text-[#4A3830]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-[#5B2435] shrink-0" />
          {isAwaiting ? (
            <span className="font-medium">{claim.evidence_label}</span>
          ) : (
            <>
              <span>
                <strong className="font-bold text-[#241410] font-mono">{claim.evidence_score}%</strong> confirmation
              </span>
              <span className="text-[#CFC1AF]">·</span>
              <span>{isDemo ? `${claim.student_sample_size} sample responses (demo)` : claim.evidence_label}</span>
            </>
          )}
        </div>

        {claim.notes && (
          <span className="text-[11px] text-[#4A3830] italic max-w-xs truncate" title={claim.notes}>
            {claim.notes}
          </span>
        )}
      </div>

      <div className="mt-2.5 w-full bg-[#E2D7C8] h-1.5 rounded-full overflow-hidden">
        <div
          className={`h-full ${badgeConfig.barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${isAwaiting ? 0 : claim.evidence_score}%` }}
        />
      </div>
    </div>
  );
};
