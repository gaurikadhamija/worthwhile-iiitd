import { db } from './connection.js';
import { initializeSchema, markSeedDataAsDemo } from './schema.js';

export function seedDatabase(force = false) {
  initializeSchema();

  const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number }).count;
  const hasDelhiVenue = (db.prepare("SELECT COUNT(*) as count FROM venues WHERE id = 'ven_igdtuw_kashmere'").get() as { count: number } | undefined)?.count || 0;
  
  if (userCount > 0 && hasDelhiVenue > 0 && !force) {
    return; // Already seeded with full Delhi NCR campuses
  }

  // Force re-seed to install full Delhi NCR campuses including IGDTUW, DTU, IIT Delhi
  force = true;

  // Clear if forced
  if (force) {
    db.exec(`
      DELETE FROM notifications;
      DELETE FROM event_registrations;
      DELETE FROM saved_events;
      DELETE FROM reviews;
      DELETE FROM claim_evidence;
      DELETE FROM organizer_claims;
      DELETE FROM event_analytics;
      DELETE FROM event_outcomes;
      DELETE FROM events;
      DELETE FROM venues;
      DELETE FROM organizers;
      DELETE FROM profiles;
      DELETE FROM users;
    `);
  }

  // 1. Seed Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, name, role, avatar_url, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `);

  insertUser.run('usr_demo_student', 'alex.chen@campus.edu', 'Alex Chen', 'student', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');
  insertUser.run('usr_organizer_acm', 'acm-lead@campus.edu', 'Sarah Lin (ACM President)', 'organizer', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80');
  insertUser.run('usr_admin_dean', 'studentlife-admin@campus.edu', 'Dean of Student Life', 'admin', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80');

  // 2. Seed Student Profile
  const insertProfile = db.prepare(`
    INSERT INTO profiles (
      user_id, year_of_study, degree, major, free_hours_per_week,
      commute_mode, campus_location, goals_json, interests_json,
      career_interests_json, preferred_event_types_json, preferred_duration_max, preferred_distance_max
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertProfile.run(
    'usr_demo_student',
    'Junior (3rd Year)',
    'B.S. Engineering',
    'Computer Science & AI',
    10,
    'Walking',
    'Turing Hall / North Quad',
    JSON.stringify(['Get an internship', 'Learn technical skills', 'Build projects', 'Meet people']),
    JSON.stringify(['Artificial Intelligence', 'Full-Stack Development', 'Venture Capital', 'Cloud Architecture', 'Robotics']),
    JSON.stringify(['Software Engineer', 'AI Research Engineer', 'Product Manager']),
    JSON.stringify(['Workshops', 'Hackathons', 'Networking', 'Career Events']),
    120,
    15
  );

  // 3. Seed Venues (Delhi / NCR Campuses & Cultural Centers)
  const insertVenue = db.prepare(`
    INSERT INTO venues (id, name, building, room, campus_zone, address, place_id, city_region, latitude, longitude, map_x, map_y, capacity, wheelchair_accessible)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const venues = [
    ['ven_iit_delhi', 'Dogra Hall & Bharti Building', 'IIT Delhi', 'Seminar Room 101', 'South Delhi (Hauz Khas)', 'IIT Delhi Main Campus, Hauz Khas, New Delhi 110016', 'ChIJ74-Xb7jjDDkR3jG5L9Xn788', 'South Delhi', 28.5450, 77.1926, 45, 62, 350, 1],
    ['ven_du_north', 'Faculty of Technology Auditorium', 'Delhi University', 'North Campus Hall 4', 'North Delhi (Vishwa Vidyalaya)', 'University Enclave, Delhi University, Delhi 110007', 'ChIJk7QZ84wCDTkREqR9T_nK1iI', 'North Delhi', 28.6890, 77.2090, 52, 22, 280, 1],
    ['ven_nsut_dwarka', 'Main Convention Complex', 'NSUT Delhi', 'Auditorium 2', 'West Delhi (Dwarka Sector 3)', 'Netaji Subhas University of Tech, Sector 3, Dwarka, New Delhi 110078', 'ChIJx_bN2D0eDTkRkM3p6Xb5iV8', 'Dwarka / West Delhi', 28.6080, 77.0370, 22, 54, 300, 1],
    ['ven_dtu_rohini', 'BR Ambedkar Convention Center', 'DTU Delhi', 'Hall A', 'North West Delhi (Bawana / Rohini)', 'Shahbad Daulatpur, Bawana Road, Delhi 110042', 'ChIJa9Wv5c4bDTkR7cK3m7F8sD0', 'Rohini / North West Delhi', 28.7501, 77.1177, 35, 12, 450, 1],
    ['ven_iiitd_okhla', 'R&D Block Amphitheatre', 'IIIT Delhi', 'Ground Floor Arena', 'South East Delhi (Okhla Phase III)', 'Okhla Industrial Estate, Phase III, Near Govind Puri, New Delhi 110020', 'ChIJx_Z_3eDhDDkR4k0z5H8f1A0', 'South East Delhi', 28.5439, 77.2724, 72, 65, 180, 1],
    ['ven_jnu_convention', 'JNU Convention Centre', 'JNU Campus', 'Auditorium I', 'South Delhi (New Mehrauli Road)', 'Jawaharlal Nehru University, New Delhi 110067', 'ChIJQ_8F9fjhDDkR8c5Y6K7m2B4', 'South Delhi', 28.5400, 77.1666, 38, 70, 250, 1],
    ['ven_ihc_lodhi', 'Stein Auditorium & Amphitheatre', 'India Habitat Centre', 'Level 1', 'Central Delhi (Lodhi Road)', 'Lodhi Rd, Near Air Force Bal Bharati School, New Delhi 110003', 'ChIJl9J55hjhDDkRxQ4j2K1p0C9', 'Central Delhi', 28.5898, 77.2250, 56, 48, 500, 1],
    ['ven_bharat_mandapam', 'Plenary Summit Hall', 'Bharat Mandapam', 'Hall 5', 'Central Delhi (Pragati Maidan)', 'Pragati Maidan, New Delhi 110001', 'ChIJ_1K5bHvhDDkR9m1z2X3y4D5', 'Central Delhi', 28.6190, 77.2410, 64, 40, 600, 1],
    ['ven_cyberhub_ggn', 'DLF CyberHub Amphitheatre', 'Cyber City Hub', 'Building 10 Forum', 'Gurugram (NCR)', 'DLF Cyber City, DLF Phase 2, Sector 24, Gurugram, Haryana 122002', 'ChIJu_8B2e0WDTkR5b4L3M2p1N0', 'Gurugram NCR', 28.4950, 77.0890, 15, 82, 220, 1],
    ['ven_noida_sec62', 'Expocentre Innovation Arena', 'Sector 62 Institutional', 'Main Arena', 'Noida (NCR)', 'Sector 62, Noida, Uttar Pradesh 201309', 'ChIJ9_X7Yc7lDDkR3b4n2M1p0D1', 'Noida NCR', 28.6270, 77.3650, 88, 48, 260, 1],
    ['ven_igdtuw_kashmere', 'Indira Gandhi STEM Auditorium', 'IGDTUW Delhi', 'Main Campus Hall 1', 'Old Delhi (Kashmere Gate)', 'James Church Rd, Kashmere Gate, New Delhi 110006', 'ChIJk7QZ84wCDTkREqR9T_nK1iI', 'North Delhi / Kashmere Gate', 28.6653, 77.2324, 58, 30, 320, 1]
  ];

  for (const v of venues) {
    insertVenue.run(...v);
  }

  // 4. Seed Organizers
  const insertOrganizer = db.prepare(`
    INSERT INTO organizers (id, name, slug, type, verified, trust_score, historical_events_count, avg_punctuality_rating, description, contact_email)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const organizers = [
    ['org_acm', 'ACM Student Chapter', 'acm-student-chapter', 'student_club', 1, 94.5, 38, 4.8, 'Official Association for Computing Machinery campus chapter. Renowned for rigorous technical workshops.', 'acm@campus.edu'],
    ['org_venture_club', 'Campus Venture & Founders Club', 'campus-venture-founders', 'student_club', 1, 91.0, 24, 4.6, 'Student-run syndicate connecting aspiring founders with angel investors and tech leaders.', 'venture@campus.edu'],
    ['org_career_dev', 'University Career Development Center', 'career-development-center', 'department', 1, 88.0, 65, 4.2, 'Official university department providing recruitment pipelines, resume reviews, and company fairs.', 'careers@campus.edu'],
    ['org_design_collective', 'The Design Collective', 'the-design-collective', 'student_club', 1, 89.2, 19, 4.7, 'Product designers, UI/UX researchers, and creative technologists hosting portfolio critiques.', 'design@campus.edu'],
    ['org_women_cs', 'Women in Computer Science (WiCS)', 'women-in-cs', 'student_club', 1, 96.0, 42, 4.9, 'Community championing gender diversity in tech through mentorship and technical bootcamps.', 'wics@campus.edu'],
    ['org_quant_finance', 'Quantitative Trading & AI Society', 'quant-trading-society', 'student_club', 1, 87.5, 16, 4.4, 'Algorithms, algorithmic trading, ML in hedge funds, and mathematical problem-solving sessions.', 'quant@campus.edu'],
    ['org_robotics_guild', 'Autonomous Robotics Guild', 'robotics-guild', 'student_club', 1, 93.0, 29, 4.7, 'Hands-on hardware hacking, ROS2, computer vision, and autonomous vehicle competitions.', 'robotics@campus.edu'],
    ['org_cultural_union', 'Intercultural Student Alliance', 'intercultural-student-alliance', 'student_club', 1, 92.0, 31, 4.5, 'Celebrating campus diversity with food festivals, acoustic music jams, and storytelling nights.', 'culture@campus.edu']
  ];

  for (const org of organizers) {
    insertOrganizer.run(...org);
  }

  // 5. Seed Events (20 rich, realistic campus events)
  const insertEvent = db.prepare(`
    INSERT INTO events (
      id, title, slug, tagline, description, category, organizer_id, venue_id,
      start_time, end_time, cost_cents, is_free, cover_image, max_capacity,
      certificate_offered, networking_potential, career_value_rating, learning_value_rating,
      tags_json, skills_taught_json, prerequisites, is_published, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const eventsData = [
    {
      id: 'evt_genai_masterclass',
      title: 'Building Production LLM Agents with Gemini & LangGraph',
      slug: 'genai-llm-agents-masterclass',
      tagline: 'From zero prompt engineering to deploying autonomous multi-agent tool loops.',
      description: 'Join Google Developer Experts and senior researchers for an intensive 2-hour lab building production-ready autonomous agents. Bring your laptop: we will deploy live vector retrieval, structured function calling, and evaluation pipelines.',
      category: 'Workshops',
      organizer_id: 'org_acm',
      venue_id: 'ven_iit_delhi',
      start_time: '2026-10-08T15:15:00.000Z',
      end_time: '2026-10-08T17:15:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 180,
      certificate_offered: 1,
      networking_potential: 'High',
      career_value_rating: 94,
      learning_value_rating: 96,
      tags: ['AI/ML', 'Hands-on', 'Python', 'Free Food', 'Fast Check-in'],
      skills_taught: ['Gemini 2.5 API', 'LangGraph', 'Function Calling', 'RAG Evaluation'],
      prerequisites: 'Basic Python knowledge. Have Node or Python 3.11 installed.'
    },
    {
      id: 'evt_startup_pitch_mixer',
      title: 'Founders & Angel Pitch Mixer: Fall Cohort Demo',
      slug: 'founders-angel-pitch-mixer',
      tagline: '12 student ventures pitch for $50k in nondilutive micro-grants in front of Silicon Valley angels.',
      description: 'Experience 12 rapid-fire 3-minute founder pitches followed by an open networking dinner on the terrace. Meet potential co-founders, early-stage angel investors, and venture scouts.',
      category: 'Networking',
      organizer_id: 'org_venture_club',
      venue_id: 'ven_ihc_lodhi',
      start_time: '2026-10-08T16:00:00.000Z',
      end_time: '2026-10-08T18:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 120,
      certificate_offered: 0,
      networking_potential: 'Exceptional',
      career_value_rating: 91,
      learning_value_rating: 74,
      tags: ['Startups', 'Venture Capital', 'Co-founder Search', 'Dinner Included'],
      skills_taught: ['Pitch Deck Framing', 'Cap Table Basics', 'Early Traction Metrics'],
      prerequisites: 'Open to all students interested in founding or joining early startups.'
    },
    {
      id: 'evt_faang_mock_interviews',
      title: 'Faang Staff Engineers: Live Whiteboard & System Design Clinic',
      slug: 'faang-system-design-mock-interviews',
      tagline: 'Real senior engineers deconstruct mock coding and system design interviews in real-time.',
      description: 'Two current Staff Software Engineers from Meta and Google run authentic 45-minute mock interviews on stage with brave student volunteers. Learn the exact rubrics used for L4/L5 SWE hiring and how to pass behavioral rounds.',
      category: 'Career Events',
      organizer_id: 'org_career_dev',
      venue_id: 'ven_du_north',
      start_time: '2026-10-08T17:30:00.000Z',
      end_time: '2026-10-08T19:30:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 90,
      certificate_offered: 0,
      networking_potential: 'High',
      career_value_rating: 97,
      learning_value_rating: 92,
      tags: ['SWE Interviews', 'System Design', 'Resume Referral', 'Senior Mentors'],
      skills_taught: ['System Architecture', 'Sharding & Cache Design', 'STAR Method Interviewing'],
      prerequisites: 'Basic data structures & algorithms recommended.'
    },
    {
      id: 'evt_hack_for_health',
      title: 'HackHealth 2026: 36-Hour Biomedical AI Sprint',
      slug: 'hackhealth-biomedical-ai-sprint',
      tagline: '$15,000 prize pool building multimodal diagnostic prototypes and health accessibility tools.',
      description: 'Our annual flagship hackathon brings together doctors, bioengineers, and programmers. Access anonymized clinical datasets, GPUs sponsored by cloud providers, and direct sponsor recruiter tables.',
      category: 'Hackathons',
      organizer_id: 'org_women_cs',
      venue_id: 'ven_iiitd_okhla',
      start_time: '2026-10-09T18:00:00.000Z',
      end_time: '2026-10-11T12:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 250,
      certificate_offered: 1,
      networking_potential: 'Exceptional',
      career_value_rating: 95,
      learning_value_rating: 98,
      tags: ['Hackathon', 'Prize Money', 'Hardware Lab', 'Sponsor Booths', 'All Meals Free'],
      skills_taught: ['Multimodal Medical Imaging', 'FastAPI Microservices', 'Team Pitching'],
      prerequisites: 'Teams of 2-4. Individual registrants will be paired at mixer.'
    },
    {
      id: 'evt_design_sprint_portfolio',
      title: 'Design Critique & Portfolio Teardown by Linear Designers',
      slug: 'design-sprint-portfolio-teardown',
      tagline: 'Brutally honest feedback on your Figma case studies, micro-interactions, and visual craft.',
      description: 'Bring 1 case study link. Former Linear and Airbnb product designers will conduct 7-minute lightning teardowns on the projector, pinpointing what makes a student portfolio look junior vs staff-level.',
      category: 'Workshops',
      organizer_id: 'org_design_collective',
      venue_id: 'ven_bharat_mandapam',
      start_time: '2026-10-08T15:30:00.000Z',
      end_time: '2026-10-08T17:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 70,
      certificate_offered: 0,
      networking_potential: 'High',
      career_value_rating: 89,
      learning_value_rating: 91,
      tags: ['Figma', 'UI/UX Design', 'Portfolio Review', 'Intimate Cohort'],
      skills_taught: ['Design Systems', 'Micro-Interactions', 'Case Study Storytelling'],
      prerequisites: 'Bring a link to at least 1 design project or Figma file.'
    },
    {
      id: 'evt_quant_trading_comp',
      title: 'Algorithmic Order Book Simulation Challenge',
      slug: 'algorithmic-order-book-simulation',
      tagline: 'Write Python market-making bots against live synthetic order flow in a 90-minute arena.',
      description: 'Compete in a simulated high-frequency trading arena with Citadel and Jane Street alumni. Prizes for highest Sharpe ratio and lowest maximum drawdown.',
      category: 'Competitions',
      organizer_id: 'org_quant_finance',
      venue_id: 'ven_nsut_dwarka',
      start_time: '2026-10-08T18:00:00.000Z',
      end_time: '2026-10-08T20:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 100,
      certificate_offered: 1,
      networking_potential: 'High',
      career_value_rating: 93,
      learning_value_rating: 89,
      tags: ['Quant Trading', 'Python', 'Algorithms', 'Interview Fast-track'],
      skills_taught: ['Order Book Dynamics', 'Market Making', 'Backtesting'],
      prerequisites: 'Python and basic probability / linear algebra.'
    },
    {
      id: 'evt_robotics_ros2_lab',
      title: 'Hands-on ROS2 & Real-Time LiDAR SLAM Mapping',
      slug: 'hands-on-ros2-lidar-slam',
      tagline: 'Program physical TurtleBot4 rovers to autonomously map and navigate obstacle courses.',
      description: 'Spend 2 hours in the Kohler lab pairing up on physical TurtleBots equipped with Ouster LiDAR. Implement navigation nodes, tune costmaps, and compete in an obstacle race.',
      category: 'Workshops',
      organizer_id: 'org_robotics_guild',
      venue_id: 'ven_dtu_rohini',
      start_time: '2026-10-08T14:00:00.000Z',
      end_time: '2026-10-08T16:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 45,
      certificate_offered: 0,
      networking_potential: 'Moderate',
      career_value_rating: 86,
      learning_value_rating: 95,
      tags: ['Robotics', 'C++', 'Hardware', 'Limited Seats', 'Hands-on'],
      skills_taught: ['ROS2 Humble', 'Nav2 Stack', 'Cartographer SLAM'],
      prerequisites: 'Linux terminal comfort and basic C++ or Python.'
    },
    {
      id: 'evt_coffeehouse_acoustic_night',
      title: 'Campfire Coffeehouse & Acoustic Songwriter Circle',
      slug: 'campfire-coffeehouse-acoustic-night',
      tagline: 'Artisanal drip brews, warm cinnamon pastries, and unamplified live campus indie performances.',
      description: 'Take a break from midterm stress. Sip hand-poured Ethiopian and Colombian pour-overs crafted by student baristas while enjoying intimate acoustic sets by student songwriters.',
      category: 'Cultural',
      organizer_id: 'org_cultural_union',
      venue_id: 'ven_jnu_convention',
      start_time: '2026-10-08T19:30:00.000Z',
      end_time: '2026-10-08T21:30:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 120,
      certificate_offered: 0,
      networking_potential: 'Moderate',
      career_value_rating: 35,
      learning_value_rating: 40,
      tags: ['Live Music', 'Free Coffee', 'Chill Vibes', 'De-Stress', 'No Prep Needed'],
      skills_taught: ['Active Listening', 'Creative Expression'],
      prerequisites: 'No prerequisites. Bring friends or relax solo.'
    },
    {
      id: 'evt_ycombinator_alumni_chat',
      title: 'From Dorm Room to Y Combinator: W26 Founders Fireside',
      slug: 'ycombinator-dorm-to-seed-fireside',
      tagline: 'Three recent grads share the raw, unedited story of landing $500k in safe notes before graduation.',
      description: 'An intimate conversation on how to validate B2B SaaS ideas, cold email enterprise buyers while skipping classes, and survive YC batch pressure. Q&A followed by private 10-minute office hours.',
      category: 'Career Events',
      organizer_id: 'org_venture_club',
      venue_id: 'ven_cyberhub_ggn',
      start_time: '2026-10-08T18:15:00.000Z',
      end_time: '2026-10-08T19:45:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 85,
      certificate_offered: 0,
      networking_potential: 'Exceptional',
      career_value_rating: 92,
      learning_value_rating: 82,
      tags: ['Startups', 'Y Combinator', 'Venture Capital', 'Fireside Chat'],
      skills_taught: ['Customer Discovery', 'Cold Outreach', 'Fundraising Storytelling'],
      prerequisites: 'None.'
    },
    {
      id: 'evt_rust_systems_deepdive',
      title: 'Zero-Cost Abstractions: High-Performance Networking in Rust',
      slug: 'rust-zero-cost-abstractions-networking',
      tagline: 'Building a memory-safe asynchronous TCP reverse proxy from scratch using Tokio.',
      description: 'Led by a contributor to the Tokio project. Dive deep into pinning, memory lifetimes, lock-free queues, and epoll primitives in Rust. Code along and leave with a benchmarked micro-proxy.',
      category: 'Workshops',
      organizer_id: 'org_acm',
      venue_id: 'ven_iit_delhi',
      start_time: '2026-10-09T16:00:00.000Z',
      end_time: '2026-10-09T18:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 110,
      certificate_offered: 1,
      networking_potential: 'Moderate',
      career_value_rating: 90,
      learning_value_rating: 97,
      tags: ['Rust', 'Systems Programming', 'Async Tokio', 'Open Source'],
      skills_taught: ['Rust Ownership & Lifetimes', 'Async/Await Internals', 'Epoll I/O'],
      prerequisites: 'Comfortable with basic systems programming (C/C++ or Rust syntax).'
    },
    {
      id: 'evt_resume_speed_dating',
      title: 'Resume Roast & Speed-Critique with Tech Recruiters',
      slug: 'resume-roast-speed-critique',
      tagline: '6 minutes per table. 8 different industry recruiters. Walk away with an ATS-proof resume.',
      description: 'Stop guessing why your applications disappear into the void. Recruiters from Stripe, Datadog, and Bloomberg review your resume face-to-face and mark up your bullet points with red pens.',
      category: 'Career Events',
      organizer_id: 'org_career_dev',
      venue_id: 'ven_du_north',
      start_time: '2026-10-08T14:30:00.000Z',
      end_time: '2026-10-08T16:30:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 160,
      certificate_offered: 0,
      networking_potential: 'Exceptional',
      career_value_rating: 96,
      learning_value_rating: 85,
      tags: ['Resume Review', 'Recruiting', 'Speed Dating Format', 'High ROI'],
      skills_taught: ['Action-Impact Bullets', 'ATS Keyword Tuning', 'Portfolio Pitching'],
      prerequisites: 'Bring 5 printed copies of your 1-page resume.'
    },
    {
      id: 'evt_cybersec_ctf_qualifiers',
      title: 'Red Team vs Blue Team: Campus CTF Midnight Qualifier',
      slug: 'campus-cybersecurity-ctf-qualifiers',
      tagline: 'Defend server nodes, reverse engineer malicious binaries, and capture flags for $4k in hardware.',
      description: 'Live battleground with real compromised Linux targets. Challenges span binary exploitation, web security, cryptographic side-channels, and memory dump forensics.',
      category: 'Competitions',
      organizer_id: 'org_acm',
      venue_id: 'ven_nsut_dwarka',
      start_time: '2026-10-09T20:00:00.000Z',
      end_time: '2026-10-10T02:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 150,
      certificate_offered: 1,
      networking_potential: 'High',
      career_value_rating: 91,
      learning_value_rating: 94,
      tags: ['Cybersecurity', 'CTF', 'Prizes', 'Free Pizza at Midnight'],
      skills_taught: ['Ghidra Reverse Engineering', 'Web XSS/SQLi Exploit', 'Network PCAP Analysis'],
      prerequisites: 'Basic command line and networking concepts.'
    },
    {
      id: 'evt_multimodal_vision_transformers',
      title: 'Vision Transformers & Diffusion Models: Mathematical Architecture',
      slug: 'vision-transformers-diffusion-architecture',
      tagline: 'Deep dive into cross-attention, patch tokenization, and denoising score matching.',
      description: 'Professor and PhD lab researchers break down the exact mathematics of CLIP, ViT, and flow matching models. Includes a 40-minute PyTorch implementation walkthrough from scratch.',
      category: 'Workshops',
      organizer_id: 'org_women_cs',
      venue_id: 'ven_iiitd_okhla',
      start_time: '2026-10-09T14:00:00.000Z',
      end_time: '2026-10-09T16:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 100,
      certificate_offered: 1,
      networking_potential: 'Moderate',
      career_value_rating: 88,
      learning_value_rating: 98,
      tags: ['Computer Vision', 'PyTorch', 'Research Paper Deep Dive', 'Math Heavy'],
      skills_taught: ['Attention Mechanics', 'Latent Diffusion', 'Tensor Operations in PyTorch'],
      prerequisites: 'Multivariable calculus and linear algebra.'
    },
    {
      id: 'evt_latin_dance_social',
      title: 'Salsa & Bachata Sunset Social on the Rooftop Terrace',
      slug: 'salsa-bachata-sunset-social',
      tagline: 'Beginner-friendly lesson at 6 PM, open dance social under string lights until 9 PM.',
      description: 'No partner needed! Professional instructors teach basic footwork, partner turns, and musicality. Refreshing non-alcoholic sangria and tapas provided.',
      category: 'Cultural',
      organizer_id: 'org_cultural_union',
      venue_id: 'ven_ihc_lodhi',
      start_time: '2026-10-08T18:00:00.000Z',
      end_time: '2026-10-08T21:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 150,
      certificate_offered: 0,
      networking_potential: 'High',
      career_value_rating: 20,
      learning_value_rating: 45,
      tags: ['Dance', 'Social Mixer', 'Music', 'Beginner Friendly', 'Free Tapas'],
      skills_taught: ['Rhythm & Musicality', 'Partner Dance Lead/Follow'],
      prerequisites: 'None. Comfortable shoes recommended.'
    },
    {
      id: 'evt_product_management_case_study',
      title: 'Breaking into Product Management: Real APM Case Frameworks',
      slug: 'product-management-apm-case-frameworks',
      tagline: 'How to answer product design, metrics execution, and estimation questions like an Associate PM.',
      description: 'Current Google APM and Uber PM fellows walk through product sense interview questions like "Design an alarm clock for the blind" and "Diagnose why YouTube comments dropped 12%".',
      category: 'Career Events',
      organizer_id: 'org_career_dev',
      venue_id: 'ven_cyberhub_ggn',
      start_time: '2026-10-09T17:00:00.000Z',
      end_time: '2026-10-09T18:30:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 80,
      certificate_offered: 0,
      networking_potential: 'High',
      career_value_rating: 92,
      learning_value_rating: 88,
      tags: ['Product Management', 'APM Programs', 'Case Interviews', 'Strategy'],
      skills_taught: ['CIRCLES Framework', 'North Star Metric Selection', 'Root Cause Analysis'],
      prerequisites: 'Open to all majors.'
    },
    {
      id: 'evt_embedded_iot_firmware',
      title: 'ESP32 & Zephyr RTOS: Building Low-Power BLE Sensor Nodes',
      slug: 'esp32-zephyr-rtos-ble-sensors',
      tagline: 'Every attendee receives an ESP32-C3 board to flash real-time sensor firmware.',
      description: 'Learn RTOS task scheduling, inter-process communication, deep-sleep power states, and Bluetooth Low Energy advertising packets.',
      category: 'Workshops',
      organizer_id: 'org_robotics_guild',
      venue_id: 'ven_dtu_rohini',
      start_time: '2026-10-08T16:15:00.000Z',
      end_time: '2026-10-08T18:15:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 50,
      certificate_offered: 1,
      networking_potential: 'Moderate',
      career_value_rating: 87,
      learning_value_rating: 94,
      tags: ['Embedded Systems', 'IoT', 'Hardware Included', 'C Programming'],
      skills_taught: ['Zephyr RTOS', 'BLE GATT Protocols', 'Current Shunt Debugging'],
      prerequisites: 'Basic C programming familiarity.'
    },
    {
      id: 'evt_campus_chess_rapid',
      title: 'Grandmaster Blitz & Rapid Open: Campus Championship Qualifiers',
      slug: 'campus-chess-rapid-championship',
      tagline: 'FIDE rated rapid rounds, live clock feeds, and post-game engine tactical analysis.',
      description: '5 Swiss rounds of 10+5 rapid chess. Open to unrated beginners up to National Masters. Boards, clocks, and post-match coffee provided.',
      category: 'Competitions',
      organizer_id: 'org_cultural_union',
      venue_id: 'ven_jnu_convention',
      start_time: '2026-10-08T15:00:00.000Z',
      end_time: '2026-10-08T18:30:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 100,
      certificate_offered: 0,
      networking_potential: 'Moderate',
      career_value_rating: 30,
      learning_value_rating: 60,
      tags: ['Chess', 'Tournament', 'Strategy', 'Casual & Competitive'],
      skills_taught: ['Calculated Risk', 'Time Management Under Pressure'],
      prerequisites: 'Knowledge of standard chess rules.'
    },
    {
      id: 'evt_venture_capital_due_diligence',
      title: 'Venture Capital Due Diligence Sprint: Deconstruct a Seed Round',
      slug: 'venture-capital-due-diligence-sprint',
      tagline: 'Review actual confidential founder investor data rooms and draft investment memos.',
      description: 'Work in small syndicates of 3 to analyze unit economics, market size TAM/SAM, competitive moats, and cap table dilution. Led by visiting VC associates from Bessemer.',
      category: 'Workshops',
      organizer_id: 'org_venture_club',
      venue_id: 'ven_noida_sec62',
      start_time: '2026-10-09T15:00:00.000Z',
      end_time: '2026-10-09T17:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 65,
      certificate_offered: 1,
      networking_potential: 'High',
      career_value_rating: 90,
      learning_value_rating: 89,
      tags: ['Finance', 'Venture Capital', 'Investment Memo', 'Interactive Case'],
      skills_taught: ['TAM Estimation', 'Unit Economics', 'Term Sheet Negotiation'],
      prerequisites: 'Interest in entrepreneurship or finance.'
    },
    {
      id: 'evt_igdtuw_women_ai',
      title: 'IGDTUW Women in AI & DeepTech HackSprint',
      slug: 'igdtuw-women-in-ai-hacksprint',
      tagline: 'Build generative AI, multimodal agents, and computer vision systems for healthcare & accessibility.',
      description: 'Annual flagship hackathon hosted at Indira Gandhi Delhi Technical University for Women. Teams pitch prototypes to mentors from Google, Microsoft, and AI startups.',
      category: 'Hackathons',
      organizer_id: 'org_women_cs',
      venue_id: 'ven_igdtuw_kashmere',
      start_time: '2026-10-09T10:00:00.000Z',
      end_time: '2026-10-10T18:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 200,
      certificate_offered: 1,
      networking_potential: 'Exceptional',
      career_value_rating: 96,
      learning_value_rating: 95,
      tags: ['Hackathon', 'AI/ML', 'Women in Tech', 'Mentorship', 'Prizes'],
      skills_taught: ['Gemini API', 'PyTorch', 'Microservice Deployment'],
      prerequisites: 'Open to student teams. Inter-college teams welcome.'
    },
    {
      id: 'evt_igdtuw_cybersecurity',
      title: 'IGDTUW Cyber Forensics & Ethical Defense Lab',
      slug: 'igdtuw-cyber-forensics-defense-lab',
      tagline: 'Reverse engineering malware artifacts, memory forensics, and defensive threat triage.',
      description: 'Hands-on offensive & defensive security workshop hosted at IGDTUW. Learn memory capture analysis with Volatility and dissect malicious payloads in sandboxed environments.',
      category: 'Workshops',
      organizer_id: 'org_acm',
      venue_id: 'ven_igdtuw_kashmere',
      start_time: '2026-10-08T15:00:00.000Z',
      end_time: '2026-10-08T17:30:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 120,
      certificate_offered: 1,
      networking_potential: 'High',
      career_value_rating: 93,
      learning_value_rating: 94,
      tags: ['Cybersecurity', 'Forensics', 'Ethical Hacking', 'Hands-on'],
      skills_taught: ['Memory Forensics', 'Binary Analysis', 'Network Packet Decoding'],
      prerequisites: 'Basic Linux shell and networking fundamentals.'
    },
    {
      id: 'evt_dtu_innovatex',
      title: 'DTU InnovateX: Autonomous Systems & Hardware Sprint',
      slug: 'dtu-innovatex-autonomous-systems-sprint',
      tagline: '24-hour robotics, edge computing, and smart mobility challenge at DTU Rohini.',
      description: 'Design and deploy working autonomous robotics, IoT telemetry, and computer vision hardware stacks at the DTU convention complex. Access 3D printers and laser cutters.',
      category: 'Hackathons',
      organizer_id: 'org_robotics_guild',
      venue_id: 'ven_dtu_rohini',
      start_time: '2026-10-09T11:00:00.000Z',
      end_time: '2026-10-10T14:00:00.000Z',
      cost_cents: 0,
      is_free: 1,
      cover_image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
      max_capacity: 180,
      certificate_offered: 1,
      networking_potential: 'Exceptional',
      career_value_rating: 94,
      learning_value_rating: 96,
      tags: ['Robotics', 'Hardware', 'DTU Rohini', 'Prizes', 'Free Food'],
      skills_taught: ['Edge AI', 'ROS2 Navigation', 'Firmware Prototyping'],
      prerequisites: 'Open to engineering and design students.'
    }
  ];

  for (const ev of eventsData) {
    insertEvent.run(
      ev.id,
      ev.title,
      ev.slug,
      ev.tagline,
      ev.description,
      ev.category,
      ev.organizer_id,
      ev.venue_id,
      ev.start_time,
      ev.end_time,
      ev.cost_cents,
      ev.is_free,
      ev.cover_image,
      ev.max_capacity,
      ev.certificate_offered,
      ev.networking_potential,
      ev.career_value_rating,
      ev.learning_value_rating,
      JSON.stringify(ev.tags),
      JSON.stringify(ev.skills_taught),
      ev.prerequisites,
      1
    );
  }

  // 6. Seed Event Outcomes
  const insertOutcome = db.prepare(`
    INSERT INTO event_outcomes (id, event_id, outcome_type, title, description, highlight)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const outcomesData = [
    // GenAI
    ['oc_1', 'evt_genai_masterclass', 'skills', 'Production AI Tool Calling', 'Mastered structured JSON schema outputs, temperature tuning, and zero-shot tool loops.', 'Gemini 2.5 SDK'],
    ['oc_2', 'evt_genai_masterclass', 'portfolio', 'GitHub Multi-Agent Repo', 'Finished standalone codebase implementing an autonomous research assistant with LangGraph.', 'Ready for GitHub'],
    ['oc_3', 'evt_genai_masterclass', 'credential', 'Verified ACM AI Certificate', 'Cryptographically verified certificate issued for completing all workshop coding benchmarks.', 'Verifiable Credential'],
    ['oc_4', 'evt_genai_masterclass', 'networking', 'Google Developer Community', 'Connect with 120+ active campus AI builders and guest Google Developer Experts.', '120+ Attendees'],

    // Founders Pitch Mixer
    ['oc_5', 'evt_startup_pitch_mixer', 'networking', 'Angel Investor & Co-founder Access', 'Direct access to 8 angel investors and 40+ student software engineers and designers.', 'High Signal Mixer'],
    ['oc_6', 'evt_startup_pitch_mixer', 'career', 'Venture Scout Pipeline', 'Several campus venture funds actively recruit investment associates from this mixer.', 'Scout Opportunity'],

    // FAANG Mock
    ['oc_7', 'evt_faang_mock_interviews', 'career', 'Internal Recruiter Referral Fast-track', 'Attendees who volunteer or ask top questions receive direct resume priority with alumni.', 'Direct Alumni Referral'],
    ['oc_8', 'evt_faang_mock_interviews', 'skills', 'Distributed Systems Design', 'Mastered cache coherence, horizontal database sharding, and consistent hashing diagrams.', 'Senior SWE Rubric'],

    // HackHealth
    ['oc_9', 'evt_hack_for_health', 'portfolio', 'Completed Hackathon Project', 'Working prototype submitted to Devpost with pitch deck and GitHub repository.', 'Portfolio Piece'],
    ['oc_10', 'evt_hack_for_health', 'credential', 'Official HackHealth 2026 Certificate', 'Issued to all teams that successfully demo a functioning prototype on Sunday.', 'Official Certificate'],
    ['oc_11', 'evt_hack_for_health', 'career', 'HealthTech Sponsor Recruiting', 'Sponsors interview directly on Sunday afternoon for Summer 2027 internships.', 'Sponsor Booths'],

    // Design Sprint
    ['oc_12', 'evt_design_sprint_portfolio', 'portfolio', 'Portfolio Case Study Polish', 'Direct feedback addressing weak UX rationale, typography hierarchy, and visual storytelling.', 'Expert Critique'],
    ['oc_13', 'evt_design_sprint_portfolio', 'skills', 'Design System Architecture', 'Learned how Linear and Airbnb structure multi-brand tokens and layout auto-layout grids.', 'Staff Level Tips']
  ];

  for (const oc of outcomesData) {
    insertOutcome.run(...oc);
  }

  // 7. Seed Organizer Claims & Student Evidence (Critical for "Organizer Says vs Students Report")
  const insertClaim = db.prepare(`
    INSERT INTO organizer_claims (
      id, event_id, claim_text, claim_category, promised_outcome,
      verification_status, evidence_score, student_sample_size, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const claimsData = [
    // GenAI Masterclass
    ['clm_1', 'evt_genai_masterclass', 'Verified certificate provided upon workshop completion', 'certificate', 'Official completion credential provided via email', 'verified', 96.4, 48, '46 of 48 past attendees confirmed credential arrived within 24 hours.'],
    ['clm_2', 'evt_genai_masterclass', 'Hands-on coding repository with zero boilerplate setup', 'hands_on', 'Students deploy live code during the session', 'verified', 94.0, 50, 'Repo had devcontainer and clear Google Colab links ready.'],
    ['clm_3', 'evt_genai_masterclass', 'Hot catering / pizza provided for all participants', 'food', 'Free dinner during workshop', 'partially_verified', 68.0, 44, 'Pizza ran out 15 minutes before end for late arrivals in previous session.'],

    // Pitch Mixer
    ['clm_4', 'evt_startup_pitch_mixer', 'Active angel investors and venture capitalists in attendance', 'mentorship', 'Direct conversation with accredited investors', 'verified', 91.5, 36, 'Past attendees confirmed meeting active partners from local funds.'],
    ['clm_5', 'evt_startup_pitch_mixer', 'Every student founder receives 1-on-1 pitch feedback', 'mentorship', 'Personalized mentor review', 'partially_verified', 52.0, 29, 'High attendance created queues; only teams pitching on stage got deep review.'],

    // FAANG Mock
    ['clm_6', 'evt_faang_mock_interviews', 'Direct referral links to hiring managers at tier-1 tech firms', 'recruiting', 'Recruiter email introductions', 'contradicted', 24.0, 38, 'Past attendees reported advice was excellent, but explicit referral links were limited to top volunteers.'],
    ['clm_7', 'evt_faang_mock_interviews', 'Detailed scoring rubrics used in actual engineering interviews shared', 'speakers', 'Authentic internal interview rubrics provided', 'verified', 98.0, 41, 'Staff engineer handed out exact multi-page rubrics for L4 coding.'],

    // Design Sprint
    ['clm_8', 'evt_design_sprint_portfolio', 'Every participant receives live portfolio critique', 'mentorship', 'Live screen teardown for everyone', 'partially_verified', 62.0, 26, 'Due to 90m time cap, 14 out of 25 attendees had portfolios torn down.'],
    ['clm_9', 'evt_design_sprint_portfolio', 'Taught by current Linear & Airbnb design staff', 'speakers', 'Real industry practitioners', 'verified', 100.0, 28, 'Verified alumni on LinkedIn verified identities.']
  ];

  for (const clm of claimsData) {
    insertClaim.run(...clm);
  }

  // 8. Seed Event Analytics & Behavioral Signals
  const insertAnalytics = db.prepare(`
    INSERT INTO event_analytics (
      event_id, seats_total, seats_registered, seats_attended_live,
      attendance_rate_pct, delay_minutes_avg, peak_queue_time, demand_level, signal_type
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const analyticsData = [
    ['evt_genai_masterclass', 180, 162, 148, 91.3, 8.5, '3:10 PM', 'high', 'historical'],
    ['evt_startup_pitch_mixer', 120, 118, 105, 88.9, 14.0, '4:05 PM', 'surge', 'historical'],
    ['evt_faang_mock_interviews', 90, 90, 84, 93.3, 5.0, '5:25 PM', 'surge', 'historical'],
    ['evt_hack_for_health', 250, 240, 218, 90.8, 18.0, '6:15 PM', 'high', 'historical'],
    ['evt_design_sprint_portfolio', 70, 68, 62, 91.1, 7.0, '3:25 PM', 'high', 'historical'],
    ['evt_quant_trading_comp', 100, 89, 79, 88.7, 10.0, '5:55 PM', 'moderate', 'historical'],
    ['evt_robotics_ros2_lab', 45, 45, 43, 95.5, 4.0, '1:55 PM', 'surge', 'historical'],
    ['evt_coffeehouse_acoustic_night', 120, 94, 82, 87.2, 12.0, '7:40 PM', 'moderate', 'historical'],
    ['evt_ycombinator_alumni_chat', 85, 85, 81, 95.2, 6.0, '6:10 PM', 'surge', 'historical'],
    ['evt_rust_systems_deepdive', 110, 88, 77, 87.5, 5.0, '3:55 PM', 'moderate', 'historical'],
    ['evt_resume_speed_dating', 160, 155, 142, 91.6, 9.0, '2:25 PM', 'high', 'historical'],
    ['evt_cybersec_ctf_qualifiers', 150, 134, 122, 91.0, 15.0, '8:10 PM', 'high', 'historical'],
    ['evt_multimodal_vision_transformers', 100, 92, 84, 91.3, 8.0, '1:55 PM', 'moderate', 'historical'],
    ['evt_latin_dance_social', 150, 112, 98, 87.5, 15.0, '6:10 PM', 'moderate', 'historical'],
    ['evt_product_management_case_study', 80, 78, 73, 93.5, 6.0, '4:55 PM', 'high', 'historical'],
    ['evt_embedded_iot_firmware', 50, 50, 48, 96.0, 5.0, '4:10 PM', 'surge', 'historical'],
    ['evt_campus_chess_rapid', 100, 72, 65, 90.2, 12.0, '3:05 PM', 'moderate', 'historical'],
    ['evt_venture_capital_due_diligence', 65, 64, 59, 92.1, 7.0, '2:55 PM', 'high', 'historical'],
    ['evt_igdtuw_women_ai', 200, 192, 180, 93.8, 8.0, '9:45 AM', 'surge', 'historical'],
    ['evt_igdtuw_cybersecurity', 120, 110, 102, 92.7, 6.0, '2:50 PM', 'high', 'historical'],
    ['evt_dtu_innovatex', 180, 175, 164, 93.7, 10.0, '10:45 AM', 'surge', 'historical']
  ];

  for (const an of analyticsData) {
    insertAnalytics.run(...an);
  }

  // 9. Seed Reviews (DEMO sample reviews; never attendance-verified)
  const insertReview = db.prepare(`
    INSERT INTO reviews (
      id, event_id, user_id, user_name, user_degree, is_verified_attendee,
      rating_overall, rating_content, rating_speaker, rating_networking,
      rating_time_spent, rating_logistics, comment, tags_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '-3 days'))
  `);

  const reviewsData = [
    // GenAI
    ['rev_1', 'evt_genai_masterclass', 'usr_demo_student', 'Jordan Lee', 'M.S. Computer Science', 1, 4.8, 5.0, 5.0, 4.5, 4.8, 4.5, 'Exceptional workshop. The LangGraph agent notebook worked on first run and I adapted the code directly into my research lab repo.', JSON.stringify(['Hands-on', 'Good for resume', 'Worth attending', 'Great networking'])],
    ['rev_2', 'evt_genai_masterclass', 'usr_organizer_acm', 'Priya Patel', 'B.S. Artificial Intelligence', 1, 4.6, 5.0, 4.8, 4.0, 4.5, 4.2, 'High density of actual code, zero corporate fluff. The certificate arrived in my inbox by midnight.', JSON.stringify(['Hands-on', 'Worth attending', 'Beginner friendly'])],

    // Pitch Mixer
    ['rev_3', 'evt_startup_pitch_mixer', 'usr_demo_student', 'David Kim', 'B.S. Business & CS', 1, 4.4, 4.0, 4.5, 5.0, 4.5, 4.0, 'Met two fantastic engineers who joined our fintech project. Food on the terrace was great, but get there early to find seats.', JSON.stringify(['Great networking', 'Free food', 'Worth attending'])],

    // FAANG Mock
    ['rev_4', 'evt_faang_mock_interviews', 'usr_demo_student', 'Elena Rostova', 'Senior CS', 1, 4.7, 5.0, 5.0, 4.2, 4.8, 4.4, 'The Meta staff engineer went line by line on why candidates fail the system design portion. Invaluable prep for my upcoming on-site.', JSON.stringify(['Good for resume', 'Worth attending', 'Hands-on'])],

    // Design Sprint
    ['rev_5', 'evt_design_sprint_portfolio', 'usr_demo_student', 'Marcus Vance', 'B.A. Interaction Design', 1, 4.5, 4.8, 4.7, 4.0, 4.6, 4.2, 'The guest speaker called out generic SaaS dashboards with purple gradients immediately. Fixed my case study hierarchy that night.', JSON.stringify(['Worth attending', 'Hands-on', 'Good for resume'])],

    // HackHealth
    ['rev_6', 'evt_hack_for_health', 'usr_demo_student', 'Chloe Nguyen', 'Bioengineering & CS', 1, 4.9, 5.0, 4.8, 5.0, 4.9, 4.7, 'Best campus hackathon by far. Clinical mentors gave real feedback on our ultrasound segmentation model.', JSON.stringify(['Great networking', 'Hands-on', 'Free food', 'Good for resume', 'Worth attending'])]
  ];

  for (const rev of reviewsData) {
    insertReview.run(...rev);
  }

  // 10. Seed Saved Events for demo student
  const insertSaved = db.prepare(`
    INSERT INTO saved_events (id, user_id, event_id, saved_at)
    VALUES (?, ?, ?, datetime('now', '-1 day'))
  `);

  insertSaved.run('sav_1', 'usr_demo_student', 'evt_genai_masterclass');
  insertSaved.run('sav_2', 'usr_demo_student', 'evt_faang_mock_interviews');
  insertSaved.run('sav_3', 'usr_demo_student', 'evt_hack_for_health');

  // 11. Seed Registrations
  const insertReg = db.prepare(`
    INSERT INTO event_registrations (id, event_id, user_id, registered_at, attended, checked_in_at)
    VALUES (?, ?, ?, datetime('now', '-2 days'), ?, ?)
  `);

  insertReg.run('reg_1', 'evt_genai_masterclass', 'usr_demo_student', 0, null);
  insertReg.run('reg_2', 'evt_startup_pitch_mixer', 'usr_demo_student', 1, '2026-10-01T16:04:00.000Z');

  // 12. Seed Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, type, event_id, read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  insertNotif.run('ntf_1', 'usr_demo_student', 'Saved Event Starts Soon', 'Building Production LLM Agents with Gemini begins in 2 hours at Alan Turing Auditorium.', 'starting_soon', 'evt_genai_masterclass', 0, '-2 hours');
  insertNotif.run('ntf_2', 'usr_demo_student', 'Schedule Conflict Alert', 'Faang Mock Interviews overlaps with your evening study group by 30 minutes.', 'schedule_conflict', 'evt_faang_mock_interviews', 0, '-5 hours');
  insertNotif.run('ntf_3', 'usr_demo_student', '30-Second Review Prompt', 'You checked in to Founders & Angel Pitch Mixer. How was the content and networking?', 'review_prompt', 'evt_startup_pitch_mixer', 0, '-1 day');
  insertNotif.run('ntf_4', 'usr_demo_student', '94% Relevance Match Detected', 'HackHealth 2026 matches your "Build projects" and "AI" semester goals.', 'recommendation', 'evt_hack_for_health', 1, '-2 days');
  // Everything inserted above is illustrative demo content, never genuine platform activity.
  markSeedDataAsDemo();
}
