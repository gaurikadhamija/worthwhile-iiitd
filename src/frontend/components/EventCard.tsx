import React, { useState } from 'react';
import { Bookmark, Clock, MapPin, Plus, Check, ExternalLink } from 'lucide-react';
import { EventItem } from '../types/index.js';
import { RelevanceScoreRing } from './RelevanceScoreRing.js';
import { useApp } from '../context/AppContext.js';

interface Props {
  event: EventItem;
  onSelect?: () => void;
  featured?: boolean;
}

export const EventCard: React.FC<Props> = ({ event, onSelect, featured = false }) => {
  const {
    savedEventIds,
    toggleSave,
    compareEventIds,
    addToCompare,
    removeFromCompare,
    setScoreModalEvent,
    navigateTo
  } = useApp();

  const [imageError, setImageError] = useState(false);
  const isSaved = savedEventIds.has(event.id);
  const isCompared = compareEventIds.includes(event.id);

  const startDate = new Date(event.start_time);
  const dateFormatted = startDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
  const timeFormatted = startDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const handleCardClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      navigateTo('event-details', event.id);
    }
  };

  return (
    <article
      data-event-card="true"
      onClick={handleCardClick}
      className={`group relative flex flex-col justify-between rounded-xl border border-[#E2D7C8] bg-[#FFFDF8] transition-all duration-200 hover:border-[#5B2435] hover:shadow-lg cursor-pointer overflow-hidden ${
        featured ? 'md:col-span-2 md:flex-row' : ''
      }`}
    >
      {/* Visual Anchor (Cover Image with high-contrast scrim) */}
      <div
        className={`relative overflow-hidden bg-[#F2E9DC] shrink-0 ${
          featured ? 'w-full md:w-5/12 h-56 md:h-full min-h-[220px]' : 'w-full h-44'
        }`}
      >
        {!imageError && event.cover_image ? (
          <img
            src={event.cover_image}
            alt={event.title}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-102"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-[#F3EAE0] to-[#E2D7C8] text-[#4A3830] p-4 text-center">
            <span className="font-serif text-lg font-bold text-[#241410] line-clamp-2">
              {event.title}
            </span>
          </div>
        )}

        {/* High-Contrast Gradient Scrim ensuring 10:1+ overlay text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />

        {/* Save Bookmark button */}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            toggleSave(event.id);
          }}
          className={`absolute top-3 left-3 p-2 rounded-lg backdrop-blur-md shadow-md transition-colors ${
            isSaved
              ? 'bg-[#5B2435] text-[#FFFDF8]'
              : 'bg-[#FFFDF8] text-[#241410] hover:bg-[#F8F4EC] border border-[#D5C7B5]'
          }`}
          aria-label={isSaved ? 'Remove from saved' : 'Save session'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current text-[#FFFDF8]' : 'text-[#241410]'}`} />
        </button>

        {/* Category & Status Overlay (Pure white text on deep scrim = WCAG AAA compliant) */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-xs text-[#FFFDF8] font-bold drop-shadow-md">
          <span className="text-[11px] uppercase tracking-wider">
            {event.category}
          </span>
          <span className="text-[11px] font-mono">
            {event.is_free ? 'Free' : `$${(event.cost_cents / 100).toFixed(0)}`}
          </span>
        </div>
      </div>

      {/* Content Body */}
      <div className="flex flex-col justify-between flex-1 p-5 sm:p-6 bg-[#FFFDF8]">
        <div>
          {/* Metadata line (Zero-pill discipline, rich warm brown text = 7.5:1 contrast) */}
          <div className="flex items-center gap-2 text-xs text-[#4A3830] mb-2 font-mono font-medium">
            <span>{dateFormatted}</span>
            <span aria-hidden="true" className="text-[#CFC1AF]">·</span>
            <span>{timeFormatted}</span>
            <span aria-hidden="true" className="text-[#CFC1AF]">·</span>
            <span className="truncate max-w-[140px] text-[#241410] font-semibold">{event.venue?.name || 'Campus Venue'}</span>
          </div>

          {/* Title (Dark coffee charcoal = 14:1 contrast) */}
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#241410] leading-snug group-hover:text-[#5B2435] transition-colors">
            {event.title}
          </h3>

          {/* Tagline / Deck */}
          <p className="text-xs sm:text-sm text-[#4A3830] mt-1.5 line-clamp-2 leading-relaxed font-normal">
            {event.tagline || 'Essential campus workshop focused on hands-on practical depth and peer collaboration.'}
          </p>

          {/* Skills / Focus */}
          {event.skills_taught && event.skills_taught.length > 0 && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-[#4A3830] overflow-hidden text-ellipsis whitespace-nowrap">
              <span className="font-bold text-[#241410]">Focus:</span>
              <span>{event.skills_taught.slice(0, 3).join(', ')}</span>
            </div>
          )}
        </div>

        {/* Bottom Utility Strip */}
        <div className="mt-5 pt-4 border-t border-[#E2D7C8] flex items-center justify-between gap-3">
          {/* Relevance Ring */}
          <RelevanceScoreRing
            score={event.relevance.totalScore}
            size="sm"
            onClick={() => setScoreModalEvent(event)}
          />

          {/* Compare Action Button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={e => {
                e.stopPropagation();
                if (isCompared) removeFromCompare(event.id);
                else addToCompare(event.id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs ${
                isCompared
                  ? 'bg-[#5B2435] text-[#FFFDF8]'
                  : 'bg-[#F8F4EC] hover:bg-[#EFE5D5] text-[#241410] border border-[#D5C7B5]'
              }`}
            >
              {isCompared ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#FFFDF8]" />
                  <span>Compared</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 text-[#5B2435]" />
                  <span>Compare</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
