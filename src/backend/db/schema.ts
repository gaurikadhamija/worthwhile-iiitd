import { db } from './connection.js';

export function initializeSchema() {
  db.exec(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      avatar_url TEXT,
      password_hash TEXT,
      salt TEXT,
      session_token TEXT,
      reset_token TEXT,
      reset_expires TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Profiles table
    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      year_of_study TEXT NOT NULL DEFAULT 'Junior (3rd Year)',
      degree TEXT NOT NULL DEFAULT 'B.Tech',
      major TEXT NOT NULL DEFAULT 'Computer Science & Engineering',
      free_hours_per_week INTEGER NOT NULL DEFAULT 8,
      commute_mode TEXT NOT NULL DEFAULT 'Metro / Walking',
      campus_location TEXT NOT NULL DEFAULT 'South Delhi (IIT Delhi)',
      delhi_region TEXT NOT NULL DEFAULT 'South Delhi',
      preferred_time_of_day TEXT NOT NULL DEFAULT 'Afternoon & Evening',
      onboarding_completed INTEGER NOT NULL DEFAULT 1,
      goals_json TEXT NOT NULL DEFAULT '["Get an internship", "Learn technical skills", "Build projects"]',
      interests_json TEXT NOT NULL DEFAULT '["Artificial Intelligence", "Startups & Venture", "Distributed Systems"]',
      priorities_json TEXT NOT NULL DEFAULT '{"career": 35, "learning": 25, "networking": 20, "convenience": 10, "fun": 10}',
      career_interests_json TEXT NOT NULL DEFAULT '["Software Engineering", "AI Research", "Product Management"]',
      preferred_event_types_json TEXT NOT NULL DEFAULT '["Workshops", "Hackathons", "Networking"]',
      preferred_duration_max INTEGER NOT NULL DEFAULT 120,
      preferred_distance_max INTEGER NOT NULL DEFAULT 15,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Organizers table
    CREATE TABLE IF NOT EXISTS organizers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 1,
      trust_score REAL NOT NULL DEFAULT 85,
      historical_events_count INTEGER NOT NULL DEFAULT 10,
      avg_punctuality_rating REAL NOT NULL DEFAULT 4.5,
      description TEXT,
      contact_email TEXT
    );

    -- Venues table (Delhi / NCR Institutions & Centers)
    CREATE TABLE IF NOT EXISTS venues (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      building TEXT NOT NULL,
      room TEXT NOT NULL,
      campus_zone TEXT NOT NULL,
      address TEXT NOT NULL DEFAULT 'Delhi, India',
      place_id TEXT,
      city_region TEXT NOT NULL DEFAULT 'Delhi NCR',
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      map_x REAL NOT NULL,
      map_y REAL NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 100,
      wheelchair_accessible INTEGER NOT NULL DEFAULT 1
    );

    -- Events table
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      tagline TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      organizer_id TEXT NOT NULL,
      venue_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      cost_cents INTEGER NOT NULL DEFAULT 0,
      is_free INTEGER NOT NULL DEFAULT 1,
      cover_image TEXT NOT NULL,
      max_capacity INTEGER NOT NULL DEFAULT 100,
      certificate_offered INTEGER NOT NULL DEFAULT 0,
      networking_potential TEXT NOT NULL DEFAULT 'Moderate',
      career_value_rating REAL NOT NULL DEFAULT 80,
      learning_value_rating REAL NOT NULL DEFAULT 80,
      tags_json TEXT NOT NULL DEFAULT '[]',
      skills_taught_json TEXT NOT NULL DEFAULT '[]',
      prerequisites TEXT DEFAULT 'None. Open to all students.',
      is_published INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (organizer_id) REFERENCES organizers(id) ON DELETE CASCADE,
      FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
    CREATE INDEX IF NOT EXISTS idx_events_start_time ON events(start_time);
    CREATE INDEX IF NOT EXISTS idx_events_organizer ON events(organizer_id);

    -- Event Outcomes (Skills, Career, Credential, Networking, Portfolio)
    CREATE TABLE IF NOT EXISTS event_outcomes (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      outcome_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      highlight TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Organizer Claims
    CREATE TABLE IF NOT EXISTS organizer_claims (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      claim_text TEXT NOT NULL,
      claim_category TEXT NOT NULL,
      promised_outcome TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'insufficient_evidence',
      evidence_score REAL NOT NULL DEFAULT 0,
      student_sample_size INTEGER NOT NULL DEFAULT 0,
      notes TEXT,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Claim Evidence submitted by students
    CREATE TABLE IF NOT EXISTS claim_evidence (
      id TEXT PRIMARY KEY,
      claim_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      confirmed INTEGER NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (claim_id) REFERENCES organizer_claims(id) ON DELETE CASCADE,
      FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Event Analytics & behavioral signals
    CREATE TABLE IF NOT EXISTS event_analytics (
      event_id TEXT PRIMARY KEY,
      seats_total INTEGER NOT NULL DEFAULT 100,
      seats_registered INTEGER NOT NULL DEFAULT 0,
      seats_attended_live INTEGER NOT NULL DEFAULT 0,
      attendance_rate_pct REAL NOT NULL DEFAULT 0,
      delay_minutes_avg REAL NOT NULL DEFAULT 0,
      peak_queue_time TEXT,
      demand_level TEXT NOT NULL DEFAULT 'moderate',
      signal_type TEXT NOT NULL DEFAULT 'historical',
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Reviews table
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      user_degree TEXT,
      is_verified_attendee INTEGER NOT NULL DEFAULT 0,
      rating_overall REAL NOT NULL,
      rating_content REAL NOT NULL,
      rating_speaker REAL NOT NULL,
      rating_networking REAL NOT NULL,
      rating_time_spent REAL NOT NULL,
      rating_logistics REAL NOT NULL,
      comment TEXT,
      tags_json TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_reviews_event ON reviews(event_id);

    -- Saved Events
    CREATE TABLE IF NOT EXISTS saved_events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      saved_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, event_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    );

    -- Event Registrations & Check-ins
    CREATE TABLE IF NOT EXISTS event_registrations (
      id TEXT PRIMARY KEY,
      event_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      attended INTEGER NOT NULL DEFAULT 0,
      checked_in_at TEXT,
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- Notifications table
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      event_id TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `);

  // Migrate existing tables to ensure all new columns exist
  function ensureColumn(table: string, column: string, columnDef: string) {
    try {
      const cols = db.prepare(`PRAGMA table_info(${table})`).all() as any[];
      const exists = cols.some((c: any) => c.name === column);
      if (!exists) {
        db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${columnDef}`);
      }
    } catch (e) {
      // Ignore if table doesn't exist yet
    }
  }

  // Ensure venues columns
  ensureColumn('venues', 'address', "TEXT NOT NULL DEFAULT 'Delhi, India'");
  ensureColumn('venues', 'place_id', "TEXT");
  ensureColumn('venues', 'city_region', "TEXT NOT NULL DEFAULT 'Delhi NCR'");

  // Backfill specific Delhi venue addresses if currently defaulted
  try {
    db.prepare(`
      UPDATE venues SET 
        address = CASE id
          WHEN 'ven_iit_delhi' THEN 'Hauz Khas, New Delhi, Delhi 110016'
          WHEN 'ven_du_north' THEN 'University Enclave, New Delhi, Delhi 110007'
          WHEN 'ven_nsut_dwarka' THEN 'Sector 3, Dwarka, New Delhi, Delhi 110078'
          WHEN 'ven_dtu_rohini' THEN 'Shahbad Daulatpur, Main Bawana Rd, Delhi 110042'
          WHEN 'ven_ihc_lodhi' THEN 'Lodhi Rd, Gokalpuri, Institutional Area, New Delhi 110003'
          WHEN 'ven_iiit_delhi' THEN 'Okhla Industrial Estate, Phase III, Near Govind Puri Metro, New Delhi 110020'
          ELSE address
        END,
        city_region = CASE id
          WHEN 'ven_iit_delhi' THEN 'South Delhi'
          WHEN 'ven_du_north' THEN 'North Delhi'
          WHEN 'ven_nsut_dwarka' THEN 'West Delhi'
          WHEN 'ven_dtu_rohini' THEN 'North West Delhi'
          WHEN 'ven_ihc_lodhi' THEN 'Central Delhi'
          WHEN 'ven_iiit_delhi' THEN 'South Delhi'
          ELSE city_region
        END
      WHERE address = 'Delhi, India' OR address IS NULL
    `).run();
  } catch (e) {
    // ignore
  }

  // Ensure users auth columns
  ensureColumn('users', 'password_hash', 'TEXT');
  ensureColumn('users', 'salt', 'TEXT');
  ensureColumn('users', 'session_token', 'TEXT');
  ensureColumn('users', 'reset_token', 'TEXT');
  ensureColumn('users', 'reset_expires', 'TEXT');

  // Ensure profiles columns
  ensureColumn('profiles', 'delhi_region', "TEXT NOT NULL DEFAULT 'South Delhi'");
  ensureColumn('profiles', 'campus_location', "TEXT NOT NULL DEFAULT 'South Delhi (IIT Delhi)'");
  ensureColumn('profiles', 'career_interests_json', "TEXT NOT NULL DEFAULT '[\"Software Engineering\", \"AI Research\"]'");
  ensureColumn('profiles', 'preferred_time_of_day', "TEXT NOT NULL DEFAULT 'Afternoon & Evening'");
  ensureColumn('profiles', 'onboarding_completed', "INTEGER NOT NULL DEFAULT 1");
  ensureColumn('profiles', 'priorities_json', "TEXT NOT NULL DEFAULT '{\"career\": 35, \"learning\": 25, \"networking\": 20, \"convenience\": 10, \"fun\": 10}'");

  applyTrustMigrations();
}

/**
 * Trust/provenance migration (idempotent, safe to run on every start).
 *  - is_demo flags separate seeded demonstration rows from genuine activity.
 *  - event_registrations.attendance_source records HOW attendance was established.
 *    Only 'organizer_checkin' counts as attendance evidence; 'demo_seed' never does.
 *  - reviews get a DB-level UNIQUE(event_id, user_id) and verification is recomputed
 *    from attendance records (legacy rows were all stamped "verified").
 */
export function applyTrustMigrations() {
  const cols = (t: string) => (db.prepare(`PRAGMA table_info(${t})`).all() as any[]).map(c => c.name);
  const addCol = (t: string, c: string, def: string) => {
    if (!cols(t).includes(c)) db.exec(`ALTER TABLE ${t} ADD COLUMN ${c} ${def}`);
  };

  db.exec(`CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT)`);
  const migrated = db.prepare("SELECT value FROM app_meta WHERE key = 'trust_migration_v1'").get();

  for (const t of ['users', 'organizers', 'events', 'organizer_claims', 'event_analytics', 'reviews']) {
    addCol(t, 'is_demo', 'INTEGER NOT NULL DEFAULT 0');
  }
  addCol('organizers', 'owner_user_id', 'TEXT');
  addCol('event_registrations', 'attendance_source', 'TEXT');
  addCol('event_registrations', 'checked_in_by', 'TEXT');
  addCol('reviews', 'verification_basis', 'TEXT');
  addCol('claim_evidence', 'updated_at', 'TEXT');

  if (!migrated) {
    // Legacy database: everything that existed before this migration was seeded demo content,
    // except reviews written through the API (ids rev_<timestamp>), which stay non-demo.
    db.exec(`
      UPDATE users SET is_demo = 1 WHERE id IN ('usr_demo_student','usr_organizer_acm','usr_admin_dean');
      UPDATE organizers SET is_demo = 1;
      UPDATE events SET is_demo = 1;
      UPDATE organizer_claims SET is_demo = 1;
      UPDATE event_analytics SET is_demo = 1;
      UPDATE reviews SET is_demo = 1 WHERE id IN ('rev_1','rev_2','rev_3','rev_4','rev_5','rev_6');
      UPDATE event_registrations SET attendance_source = 'demo_seed' WHERE attended = 1 AND attendance_source IS NULL;
    `);
    db.prepare("INSERT OR REPLACE INTO app_meta (key, value) VALUES ('trust_migration_v1', datetime('now'))").run();
  }

  db.exec(`UPDATE organizers SET owner_user_id = 'usr_organizer_acm' WHERE id = 'org_acm' AND owner_user_id IS NULL`);

  // Remove duplicate reviews/evidence (legacy bug allowed them), keeping the earliest, then enforce uniqueness in the DB.
  db.exec(`
    DELETE FROM reviews WHERE rowid NOT IN (SELECT MIN(rowid) FROM reviews GROUP BY event_id, user_id);
    DELETE FROM claim_evidence WHERE rowid NOT IN (SELECT MIN(rowid) FROM claim_evidence GROUP BY claim_id, student_id);
    CREATE UNIQUE INDEX IF NOT EXISTS uq_reviews_event_user ON reviews(event_id, user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS uq_claim_evidence_claim_student ON claim_evidence(claim_id, student_id);
  `);

  refreshReviewVerification();
}

/** Verification is derived from attendance evidence only; never from a stored client/seed claim. */
export function refreshReviewVerification() {
  db.exec(`
    UPDATE reviews SET is_verified_attendee = 0, verification_basis = NULL WHERE is_demo = 1;
    UPDATE reviews SET
      is_verified_attendee = CASE WHEN EXISTS (
        SELECT 1 FROM event_registrations er
        WHERE er.event_id = reviews.event_id AND er.user_id = reviews.user_id
          AND er.attended = 1 AND er.attendance_source = 'organizer_checkin'
      ) THEN 1 ELSE 0 END,
      verification_basis = CASE WHEN EXISTS (
        SELECT 1 FROM event_registrations er
        WHERE er.event_id = reviews.event_id AND er.user_id = reviews.user_id
          AND er.attended = 1 AND er.attendance_source = 'organizer_checkin'
      ) THEN 'organizer_checkin' ELSE NULL END
    WHERE is_demo = 0;
  `);
}

/** Called by the seed script after it (re)inserts demonstration content. */
export function markSeedDataAsDemo() {
  db.exec(`
    UPDATE users SET is_demo = 1;
    UPDATE organizers SET is_demo = 1;
    UPDATE events SET is_demo = 1;
    UPDATE organizer_claims SET is_demo = 1;
    UPDATE event_analytics SET is_demo = 1;
    UPDATE reviews SET is_demo = 1;
    UPDATE event_registrations SET attendance_source = 'demo_seed' WHERE attended = 1;
    UPDATE organizers SET owner_user_id = 'usr_organizer_acm' WHERE id = 'org_acm';
  `);
  refreshReviewVerification();
}
