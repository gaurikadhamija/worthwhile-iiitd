import React, { useState } from 'react';
import { X, Check, Target, BookOpen } from 'lucide-react';
import { useApp } from '../context/AppContext.js';

const GOAL_OPTIONS = [
  'Get an internship',
  'Build my resume',
  'Learn technical skills',
  'Meet peers & collaborators',
  'Build portfolio projects',
  'Win hackathons',
  'Explore venture careers',
  'Explore creative disciplines',
  'Unwind & social culture'
];

const INTEREST_OPTIONS = [
  'Artificial Intelligence',
  'Full-Stack Development',
  'Venture Capital',
  'Cloud Architecture',
  'Robotics & Embedded',
  'UI/UX Design',
  'Quantitative Finance',
  'Cybersecurity',
  'Product Management'
];

export const GoalsModal: React.FC = () => {
  const { isGoalsModalOpen, setIsGoalsModalOpen, profile, updateSemesterGoals } = useApp();

  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    profile?.goals || ['Get an internship', 'Learn technical skills', 'Build portfolio projects']
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    profile?.interests || ['Artificial Intelligence', 'Full-Stack Development', 'Venture Capital']
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isGoalsModalOpen) return null;

  const toggleGoal = (goal: string) => {
    setSelectedGoals(prev =>
      prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]
    );
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSemesterGoals(
        selectedGoals,
        selectedInterests,
        profile?.career_interests || ['Software Engineer', 'AI Researcher']
      );
      setIsGoalsModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/70 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-xl bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsGoalsModalOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#4A3830] hover:bg-[#F8F4EC] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-1">
            <Target className="w-3.5 h-3.5" />
            <span>Personalization Calibration</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#241410] leading-tight">
            What are your target goals this semester?
          </h2>
          <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
            WorthWhile weights every event relevance score against these selections.
          </p>
        </div>

        {/* Goals Selection */}
        <div className="mt-6">
          <label className="text-xs font-mono uppercase tracking-wider text-[#241410] block mb-2.5 font-bold">
            Primary Semester Targets
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GOAL_OPTIONS.map(goal => {
              const active = selectedGoals.includes(goal);
              return (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={`flex items-center justify-between p-3 rounded-lg border text-xs font-bold text-left transition-colors ${
                    active
                      ? 'border-[#5B2435] bg-[#5B2435] text-[#FFFDF8] shadow-xs'
                      : 'border-[#D5C7B5] bg-[#FFFDF8] text-[#241410] hover:bg-[#F8F4EC]'
                  }`}
                >
                  <span>{goal}</span>
                  {active && <Check className="w-3.5 h-3.5 text-[#FFFDF8] shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Interests Selection */}
        <div className="mt-6">
          <label className="text-xs font-mono uppercase tracking-wider text-[#241410] block mb-2.5 font-bold">
            Technical & Domain Interests
          </label>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(interest => {
              const active = selectedInterests.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-colors ${
                    active
                      ? 'border-[#5B2435] bg-[#5B2435] text-[#FFFDF8] shadow-xs'
                      : 'border-[#D5C7B5] bg-[#FFFDF8] text-[#241410] hover:bg-[#F8F4EC]'
                  }`}
                >
                  {interest}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Student Context */}
        <div className="mt-6 p-3 rounded-lg bg-[#F8F4EC] border border-[#D5C7B5] text-xs text-[#4A3830] flex items-center justify-between font-mono">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-[#5B2435]" />
            <span>Profile: <strong className="text-[#241410]">{profile?.degree || 'B.S.'} in {profile?.major || 'Computer Science'}</strong></span>
          </div>
          <span className="text-[#5B2435] font-bold">{profile?.campus_location || 'North Quad'}</span>
        </div>

        {/* Actions */}
        <div className="mt-6 pt-4 border-t border-[#E2D7C8] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => setIsGoalsModalOpen(false)}
            className="px-4 py-2 text-xs font-bold text-[#4A3830] hover:text-[#241410] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || selectedGoals.length === 0}
            onClick={handleSave}
            className="px-5 py-2.5 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] disabled:opacity-50 transition-colors shadow-xs"
          >
            {isSaving ? 'Recalibrating...' : 'Save & Recalibrate'}
          </button>
        </div>
      </div>
    </div>
  );
};
