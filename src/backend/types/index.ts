export type UserRole = 'student' | 'organizer' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  status?: 'active' | 'pending_approval';
  organization_name?: string;
  created_at: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category: 'technical' | 'creative' | 'leadership' | 'other';
  proficiency: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  evidenceUrl?: string;
  evidenceNotes?: string;
  isVerified?: boolean;
  verifiedSource?: string;
}

export interface PortfolioLinks {
  github?: string;
  linkedin?: string;
  website?: string;
  twitter?: string;
}

export interface UserProfile {
  user_id: string;
  year_of_study: string;
  degree: string;
  major: string;
  free_hours_per_week: number;
  commute_mode: string;
  campus_location: string;
  delhi_region?: string;
  preferred_time_of_day?: string;
  onboarding_completed?: boolean;
  graduation_year?: string;
  bio?: string;
  college_email?: string;
  portfolio_links?: PortfolioLinks;
  skills_portfolio?: SkillItem[];
  goals: string[]; // e.g. ["Get an internship", "Learn technical skills", "Build projects"]
  interests: string[]; // e.g. ["Artificial Intelligence", "Startups", "UI/UX"]
  priorities?: {
    career: number;
    learning: number;
    networking: number;
    convenience: number;
    fun: number;
  };
  career_interests: string[]; // e.g. ["Software Engineering", "Product Management"]
  preferred_event_types: string[]; // e.g. ["Workshops", "Hackathons"]
  preferred_duration_max: number; // minutes
  preferred_distance_max: number; // km
}

export interface Organizer {
  id: string;
  name: string;
  slug: string;
  type: string; // 'department' | 'student_club' | 'alumni_network' | 'career_center'
  verified: boolean; // true only with a real verification process (none implemented yet => always false)
  is_demo?: boolean;
  trust_score: number; // 0-100
  historical_events_count: number;
  avg_punctuality_rating: number; // 0-5
  description: string;
  contact_email: string;
}

export interface Venue {
  id: string;
  name: string;
  building: string;
  room: string;
  campus_zone: string; // 'North Delhi (DU)', 'South Delhi (IIT Delhi)', 'Dwarka (NSUT)', etc.
  address?: string;
  place_id?: string;
  city_region?: string;
  latitude: number;
  longitude: number;
  map_x: number;
  map_y: number;
  capacity: number;
  wheelchair_accessible: boolean;
}

export interface EventOutcome {
  id?: string;
  event_id: string;
  outcome_type: 'skills' | 'career' | 'credential' | 'networking' | 'portfolio';
  title: string;
  description: string;
  highlight?: string;
}

export interface OrganizerClaim {
  id: string;
  event_id: string;
  claim_text: string;
  claim_category: 'certificate' | 'mentorship' | 'food' | 'hands_on' | 'recruiting' | 'speakers';
  promised_outcome: string;
  verification_status: 'verified' | 'partially_verified' | 'contradicted' | 'insufficient_evidence';
  evidence_score: number; // 0-100 (% confirmed)
  student_sample_size: number;
  notes?: string;
  is_demo?: boolean;
  /** demo = seeded illustration; submitted = unchecked evidence; verified = corroborated by organizer-checked-in attendees */
  evidence_tier?: 'demo' | 'submitted' | 'verified' | 'none';
  evidence_label?: string;
  submitted_count?: number;
  attendee_responses?: number;
}

export interface ClaimEvidence {
  id: string;
  claim_id: string;
  student_id: string;
  confirmed: boolean;
  notes?: string;
  created_at: string;
}

export interface EventAnalytics {
  event_id: string;
  seats_total: number;
  seats_registered: number;
  seats_attended_live: number;
  attendance_rate_pct: number;
  delay_minutes_avg: number;
  peak_queue_time?: string;
  demand_level: 'low' | 'moderate' | 'high' | 'surge';
  signal_type: 'live' | 'historical' | 'estimated';
  is_demo?: boolean;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  category: string; // 'Workshops' | 'Hackathons' | 'Career Events' | 'Networking' | 'Cultural' | 'Competitions'
  organizer_id: string;
  venue_id: string;
  start_time: string; // ISO string
  end_time: string; // ISO string
  cost_cents: number; // 0 = free
  is_free: boolean;
  cover_image: string;
  max_capacity: number;
  certificate_offered: boolean;
  networking_potential: 'Low' | 'Moderate' | 'High' | 'Exceptional';
  career_value_rating: number; // 0-100
  learning_value_rating: number; // 0-100
  tags: string[];
  skills_taught: string[];
  prerequisites: string;
  is_published: boolean;
  created_at: string;

  // Joined fields populated by queries
  organizer?: Organizer;
  venue?: Venue;
  outcomes?: EventOutcome[];
  claims?: OrganizerClaim[];
  analytics?: EventAnalytics;
  rating_avg?: number | null;
  review_count?: number;
  verified_review_count?: number;
  rating_is_demo?: boolean;
  is_demo?: boolean;
}

export interface RelevanceBreakdown {
  totalScore: number;
  goalFit: number;
  interestFit: number;
  careerValue: number;
  learningValue: number;
  convenience: number;
  communityScore: number;
  organizerTrust: number;
  explanation: string;
  topMatchingFactors: string[];
}

export interface Review {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_degree?: string;
  is_verified_attendee: boolean;
  is_demo?: boolean;
  verification_basis?: 'organizer_checkin' | null;
  rating_overall: number; // 1-5
  rating_content: number; // 1-5
  rating_speaker: number; // 1-5
  rating_networking: number; // 1-5
  rating_time_spent: number; // 1-5
  rating_logistics: number; // 1-5
  comment?: string;
  tags: string[];
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  registered_at: string;
  attended: boolean;
  checked_in_at?: string;
}

export interface SavedEvent {
  id: string;
  user_id: string;
  event_id: string;
  saved_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'saved_reminder' | 'starting_soon' | 'registration' | 'review_prompt' | 'schedule_conflict' | 'recommendation';
  event_id?: string;
  read: boolean;
  created_at: string;
}
