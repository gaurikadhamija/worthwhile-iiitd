import React, { useState } from 'react';
import { X, Award, Link, FileText, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { SkillItem } from '../types/index.js';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  existingSkills: SkillItem[];
}

export const AddSkillModal: React.FC<Props> = ({ isOpen, onClose, existingSkills }) => {
  const { updateSkills } = useApp();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<'technical' | 'creative' | 'leadership' | 'other'>('technical');
  const [proficiency, setProficiency] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate');
  const [evidenceUrl, setEvidenceUrl] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a skill name.');
      return;
    }

    setSaving(true);
    setError(null);

    const newSkill: SkillItem = {
      id: `sk_${Date.now()}`,
      name: name.trim(),
      category,
      proficiency,
      evidenceUrl: evidenceUrl.trim() || undefined,
      evidenceNotes: evidenceNotes.trim() || undefined,
      isVerified: false // Self-reported until corroborated by organizer-checked event attendance
    };

    try {
      await updateSkills([...existingSkills, newSkill]);
      setName('');
      setEvidenceUrl('');
      setEvidenceNotes('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add skill.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-7">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#4A3830] hover:bg-[#F8F4EC] transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-1">
          <Award className="w-3.5 h-3.5" />
          <span>Skills Portfolio</span>
        </div>
        <h2 className="text-xl font-serif font-bold text-[#241410]">
          Add Competency to Portfolio
        </h2>
        <p className="text-xs text-[#5A453D] mt-1 font-normal">
          Self-reported skills appear with your claimed proficiency. Verified competencies are automatically badged upon organizer check-in at relevant sessions.
        </p>

        {error && (
          <div className="mt-3 p-2.5 rounded-lg bg-[#5B2435]/10 text-xs text-[#5B2435] font-medium border border-[#5B2435]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
              Skill Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Distributed Systems & Go / UI/UX Prototyping"
              className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              >
                <option value="technical">Technical</option>
                <option value="creative">Creative</option>
                <option value="leadership">Communication & Leadership</option>
                <option value="other">Other Competency</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Self-Reported Proficiency
              </label>
              <select
                value={proficiency}
                onChange={e => setProficiency(e.target.value as any)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              >
                <option value="beginner">Beginner (Foundations)</option>
                <option value="intermediate">Intermediate (Hands-on)</option>
                <option value="advanced">Advanced (Production-ready)</option>
                <option value="expert">Expert (Mentoring / Research)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1 flex items-center gap-1">
              <Link className="w-3 h-3 text-[#5B2435]" />
              <span>Project Evidence Link (Optional)</span>
            </label>
            <input
              type="url"
              value={evidenceUrl}
              onChange={e => setEvidenceUrl(e.target.value)}
              placeholder="https://github.com/username/project or figma.com/..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] focus:outline-none focus:border-[#5B2435]"
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-[#5B2435]" />
              <span>Demonstrated Evidence / Experience Notes (Optional)</span>
            </label>
            <textarea
              rows={2}
              value={evidenceNotes}
              onChange={e => setEvidenceNotes(e.target.value)}
              placeholder="e.g. Implemented raft log compaction and consensus pipeline with 99.9% test coverage."
              className="w-full px-3 py-2 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] focus:outline-none focus:border-[#5B2435]"
            />
          </div>

          <div className="pt-3 border-t border-[#E2D7C8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-[#4A3830] hover:text-[#241410]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
            >
              {saving ? 'Adding...' : 'Add to Portfolio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
