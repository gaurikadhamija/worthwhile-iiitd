import React from 'react';

interface Props {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  onClick?: () => void;
}

export const RelevanceScoreRing: React.FC<Props> = ({
  score,
  size = 'md',
  showLabel = true,
  onClick
}) => {
  const radius = size === 'lg' ? 26 : size === 'md' ? 18 : 13;
  const stroke = size === 'lg' ? 4 : size === 'md' ? 3 : 2;
  const normalizedRadius = radius - stroke * 0.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const dimension = radius * 2 + 4;

  // Deep wine for high match, warm brass for strong, dark coffee for moderate (all accessible > 5:1)
  const ringColor = score >= 90 ? '#5B2435' : score >= 80 ? '#8C652D' : '#4A3830';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`inline-flex items-center gap-2 ${onClick ? 'cursor-pointer group' : ''}`}
      title={onClick ? 'Click to inspect mathematical score breakdown' : undefined}
    >
      <div className="relative inline-flex items-center justify-center">
        <svg height={dimension} width={dimension} className="transform -rotate-90">
          <circle
            stroke="#D5C7B5"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={dimension / 2}
            cy={dimension / 2}
          />
          <circle
            stroke={ringColor}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={dimension / 2}
            cy={dimension / 2}
          />
        </svg>
        <span
          className={`absolute font-serif font-bold tabular-nums text-[#241410] ${
            size === 'lg' ? 'text-sm' : size === 'md' ? 'text-[11px]' : 'text-[9.5px]'
          }`}
        >
          {score}
        </span>
      </div>

      {showLabel && (
        <div className="text-left leading-tight">
          <div className="text-[10px] tracking-wider uppercase font-bold text-[#5B2435] group-hover:underline">
            Fit Score
          </div>
          <div className="text-[11px] font-semibold text-[#4A3830]">
            {score >= 90 ? 'High Fit' : score >= 80 ? 'Good Fit' : 'Moderate'}
          </div>
        </div>
      )}
    </div>
  );
};
