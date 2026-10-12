import React, { useState } from 'react';
import { X, Star, CheckCircle, Clock, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { api } from '../services/api.js';

const QUICK_TAGS = [
  'Hands-on practical code',
  'Good for resume portfolio',
  'High quality speaker',
  'Genuinely worth attending',
  'Beginner friendly',
  'Great networking opportunity',
  'Punctual start',
  'Long check-in queue',
  'Started 15m late',
  'Sales pitch heavy'
];

export const ReviewModal: React.FC = () => {
  const { reviewModalEvent, setReviewModalEvent, refreshData } = useApp();

  const [ratings, setRatings] = useState({
    content: 5,
    speaker: 5,
    networking: 4,
    timeSpent: 5,
    logistics: 4
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Hands-on practical code', 'Good for resume portfolio']);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!reviewModalEvent) return null;

  const handleRatingChange = (category: keyof typeof ratings, val: number) => {
    setRatings(prev => ({ ...prev, [category]: val }));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      await api.submitReview({
        event_id: reviewModalEvent.id,
        rating_content: ratings.content,
        rating_speaker: ratings.speaker,
        rating_networking: ratings.networking,
        rating_time_spent: ratings.timeSpent,
        rating_logistics: ratings.logistics,
        comment: comment.trim() || undefined,
        tags: selectedTags
      });
      setSubmitted(true);
      setTimeout(async () => {
        await refreshData();
        setReviewModalEvent(null);
        setSubmitted(false);
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Could not submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (category: keyof typeof ratings, currentVal: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => handleRatingChange(category, star)}
            className="p-1 text-[#D5C7B5] hover:text-[#5B2435] transition-colors"
          >
            <Star
              className={`w-4 h-4 ${
                star <= currentVal ? 'text-[#5B2435] fill-[#5B2435]' : 'text-[#D5C7B5]'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setReviewModalEvent(null)}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#4A3830] hover:bg-[#F8F4EC] transition-colors"
          aria-label="Close review modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span>30-Second Student Audit</span>
          </div>
          <h2 className="text-2xl font-serif font-bold text-[#241410]">
            Audit this campus session
          </h2>
          <p className="text-xs sm:text-sm text-[#4A3830] mt-0.5 font-normal">
            {reviewModalEvent.title}
          </p>
        </div>

        {/* Verification transparency banner */}
        <div className="mb-6 p-3 rounded-lg bg-[#F8F4EC] border border-[#D5C7B5] flex items-center gap-2.5 text-xs text-[#4A3830] font-mono">
          <ShieldCheck className="w-4 h-4 text-[#5B2435] shrink-0" />
          <span>If an organizer checked you in live, this review earns a "✓ Attendance Verified" badge.</span>
        </div>

        {submitted ? (
          <div className="py-12 text-center text-[#194D33] space-y-2">
            <CheckCircle className="w-12 h-12 mx-auto" />
            <h3 className="font-serif text-xl font-bold text-[#241410]">Review Logged</h3>
            <p className="text-xs text-[#4A3830]">Thank you for contributing to campus decision transparency.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-lg bg-[#9A1B28]/10 border border-[#9A1B28]/30 text-xs text-[#9A1B28] font-bold">
                {errorMsg}
              </div>
            )}

            {/* Ratings Grid */}
            <div className="space-y-3 bg-[#F8F4EC] p-4 rounded-xl border border-[#E2D7C8]">
              {[
                { key: 'content', label: 'Curriculum & Depth' },
                { key: 'speaker', label: 'Mentor & Speaker Caliber' },
                { key: 'networking', label: 'Peer Networking Quality' },
                { key: 'timeSpent', label: 'Worth My Free Time' },
                { key: 'logistics', label: 'Punctuality & Venue Setup' },
              ].map(item => (
                <div key={item.key} className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#241410]">{item.label}</span>
                  {renderStars(item.key as any, (ratings as any)[item.key])}
                </div>
              ))}
            </div>

            {/* Quick Tag Pills */}
            <div className="pt-2">
              <label className="text-xs font-mono uppercase tracking-wider text-[#241410] block mb-2 font-bold">
                Select Observed Signals
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TAGS.map(tag => {
                  const active = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-2.5 py-1 text-xs rounded-lg border font-bold transition-colors ${
                        active
                          ? 'border-[#5B2435] bg-[#5B2435] text-[#FFFDF8]'
                          : 'border-[#D5C7B5] bg-[#FFFDF8] text-[#241410] hover:bg-[#F8F4EC]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-xs font-mono uppercase tracking-wider text-[#241410] block mb-1 font-bold">
                Student Notes (Optional)
              </label>
              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
                placeholder="Was the code runnable? Did recruiters attend? Did it start on schedule?"
                className="w-full rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] p-3 text-xs text-[#241410] font-medium placeholder:text-[#6E5A50] focus:outline-none focus:border-[#5B2435]"
              />
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-[#E2D7C8] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setReviewModalEvent(null)}
                className="px-4 py-2 text-xs font-bold text-[#4A3830] hover:text-[#241410]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] disabled:opacity-50 transition-colors shadow-xs"
              >
                {submitting ? 'Submitting Audit...' : 'Publish Audit'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
