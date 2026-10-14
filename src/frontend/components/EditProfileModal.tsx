import React, { useState, useEffect } from 'react';
import { X, User, Mail, BookOpen, Calendar, MapPin, Globe, Github, Linkedin, Sparkles, Check } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { UserProfile } from '../types/index.js';

const DEGREE_OPTIONS = ['B.Tech', 'B.S.', 'Dual Degree (B.Tech + M.Tech)', 'M.Tech', 'M.S. Research', 'Ph.D.', 'B.Des', 'B.Sc'];
const YEAR_OPTIONS = ['Freshman (1st Year)', 'Sophomore (2nd Year)', 'Junior (3rd Year)', 'Senior (4th Year)', 'Graduate Student'];
const GRAD_YEAR_OPTIONS = ['2025', '2026', '2027', '2028', '2029'];

const DELHI_REGIONS = [
  'South Delhi (IIT Delhi / IIIT Delhi / JNU)',
  'North Delhi (Delhi University North Campus)',
  'West Delhi (NSUT Dwarka)',
  'North West Delhi (DTU Rohini)',
  'Central Delhi (Connaught Place / IHC Lodhi)',
  'Gurugram NCR (Cyber City)',
  'Noida NCR (Sector 62 Institutional)'
];

const PRESET_INTERESTS = [
  'Artificial Intelligence', 'Machine Learning', 'Distributed Systems', 'Full-Stack Web',
  'Cloud Architecture', 'Cybersecurity', 'UI/UX Design', 'Startups & Venture',
  'Robotics & IoT', 'Product Management', 'Competitive Programming', 'Open Source'
];

export const EditProfileModal: React.FC = () => {
  const { isEditProfileOpen, setIsEditProfileOpen, profile, currentUser, updateProfile } = useApp();

  const [degree, setDegree] = useState('B.Tech');
  const [major, setMajor] = useState('Computer Science & Engineering');
  const [yearOfStudy, setYearOfStudy] = useState('Junior (3rd Year)');
  const [graduationYear, setGraduationYear] = useState('2026');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [campusLocation, setCampusLocation] = useState('South Delhi (IIT Delhi)');
  const [delhiRegion, setDelhiRegion] = useState(DELHI_REGIONS[0]);
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');
  const [github, setGithub] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [website, setWebsite] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDegree(profile.degree || 'B.Tech');
      setMajor(profile.major || 'Computer Science & Engineering');
      setYearOfStudy(profile.year_of_study || 'Junior (3rd Year)');
      setGraduationYear(profile.graduation_year || '2026');
      setCollegeEmail(profile.college_email || currentUser?.email || '');
      setCampusLocation(profile.campus_location || 'South Delhi (IIT Delhi)');
      setDelhiRegion(profile.delhi_region || DELHI_REGIONS[0]);
      setBio(profile.bio || '');
      setInterests(profile.interests || []);
      setGithub(profile.portfolio_links?.github || '');
      setLinkedin(profile.portfolio_links?.linkedin || '');
      setWebsite(profile.portfolio_links?.website || '');
    }
  }, [profile, currentUser, isEditProfileOpen]);

  if (!isEditProfileOpen) return null;

  const handleToggleInterest = (tag: string) => {
    if (interests.includes(tag)) {
      setInterests(interests.filter(i => i !== tag));
    } else {
      setInterests([...interests, tag]);
    }
  };

  const handleAddCustomInterest = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newInterestInput.trim()) {
      e.preventDefault();
      const val = newInterestInput.trim();
      if (!interests.includes(val)) {
        setInterests([...interests, val]);
      }
      setNewInterestInput('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await updateProfile({
        degree,
        major,
        year_of_study: yearOfStudy,
        graduation_year: graduationYear,
        college_email: collegeEmail.trim(),
        campus_location: campusLocation,
        delhi_region: delhiRegion,
        bio: bio.trim(),
        interests,
        portfolio_links: {
          github: github.trim(),
          linkedin: linkedin.trim(),
          website: website.trim()
        }
      });
      setIsEditProfileOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update student profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#241410]/60 backdrop-blur-xs animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#FFFDF8] rounded-2xl border border-[#D5C7B5] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => setIsEditProfileOpen(false)}
          className="absolute top-5 right-5 p-2 rounded-lg text-[#4A3830] hover:bg-[#F8F4EC] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-1">
          <User className="w-3.5 h-3.5" />
          <span>Student Profile Editor</span>
        </div>
        <h2 className="text-2xl font-serif font-bold text-[#241410]">
          Edit Academic & Portfolio Details
        </h2>
        <p className="text-xs text-[#5A453D] mt-1 font-normal">
          Information updated here is persisted in the database and updates your opportunity recommendations and verified transcript.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded-lg bg-[#5B2435]/10 text-xs text-[#5B2435] font-medium border border-[#5B2435]/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5 text-xs">
          
          {/* Degree & Major */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Course / Degree
              </label>
              <select
                value={degree}
                onChange={e => setDegree(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              >
                {DEGREE_OPTIONS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Branch / Discipline
              </label>
              <input
                type="text"
                required
                value={major}
                onChange={e => setMajor(e.target.value)}
                placeholder="e.g. Computer Science & AI"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              />
            </div>
          </div>

          {/* Academic Year & Graduation Year */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Academic Year
              </label>
              <select
                value={yearOfStudy}
                onChange={e => setYearOfStudy(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              >
                {YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Expected Graduation Year
              </label>
              <select
                value={graduationYear}
                onChange={e => setGraduationYear(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              >
                {GRAD_YEAR_OPTIONS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* College Email & Primary Campus Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                College Email (Verified Domain)
              </label>
              <input
                type="email"
                value={collegeEmail}
                onChange={e => setCollegeEmail(e.target.value)}
                placeholder="student@iiitd.ac.in or iitd.ac.in"
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
                Primary Campus Region
              </label>
              <select
                value={delhiRegion}
                onChange={e => {
                  setDelhiRegion(e.target.value);
                  setCampusLocation(e.target.value);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium focus:outline-none focus:border-[#5B2435]"
              >
                {DELHI_REGIONS.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1">
              Short Biography
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Tell campus organizers and peers about your technical focus, research pursuits, or career objectives..."
              className="w-full px-3 py-2.5 rounded-xl border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] font-medium placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435] leading-relaxed"
            />
          </div>

          {/* Areas of Interest Tags */}
          <div>
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#4A3830] mb-1.5">
              Areas of Interest (Click to toggle or type custom tag)
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {PRESET_INTERESTS.map(tag => {
                const isSelected = interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleInterest(tag)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                      isSelected
                        ? 'bg-[#5B2435] text-[#FFFDF8] font-bold shadow-xs'
                        : 'bg-[#F8F4EC] text-[#4A3830] hover:bg-[#EFE5D5] border border-[#E2D7C8]'
                    }`}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {tag}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={newInterestInput}
              onChange={e => setNewInterestInput(e.target.value)}
              onKeyDown={handleAddCustomInterest}
              placeholder="Type custom interest and press Enter..."
              className="w-full px-3 py-2 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] placeholder:text-[#8C7A70] focus:outline-none focus:border-[#5B2435]"
            />
          </div>

          {/* Portfolio & Professional Links */}
          <div className="pt-2 border-t border-[#E2D7C8] space-y-3">
            <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#5B2435]">
              Portfolio & Online Profiles
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-medium text-[#4A3830] mb-1 flex items-center gap-1">
                  <Github className="w-3 h-3 text-[#5B2435]" />
                  <span>GitHub Profile</span>
                </label>
                <input
                  type="url"
                  value={github}
                  onChange={e => setGithub(e.target.value)}
                  placeholder="https://github.com/username"
                  className="w-full px-2.5 py-2 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] focus:outline-none focus:border-[#5B2435]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-[#4A3830] mb-1 flex items-center gap-1">
                  <Linkedin className="w-3 h-3 text-[#5B2435]" />
                  <span>LinkedIn Profile</span>
                </label>
                <input
                  type="url"
                  value={linkedin}
                  onChange={e => setLinkedin(e.target.value)}
                  placeholder="https://linkedin.com/in/username"
                  className="w-full px-2.5 py-2 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] focus:outline-none focus:border-[#5B2435]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-medium text-[#4A3830] mb-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-[#5B2435]" />
                  <span>Portfolio Website</span>
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  placeholder="https://yourportfolio.dev"
                  className="w-full px-2.5 py-2 rounded-lg border border-[#D5C7B5] bg-[#FFFDF8] text-xs text-[#241410] focus:outline-none focus:border-[#5B2435]"
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-[#E2D7C8] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="px-4 py-2 text-xs font-bold text-[#4A3830] hover:text-[#241410] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] transition-colors shadow-xs"
            >
              {saving ? 'Saving Changes...' : 'Save Profile Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
