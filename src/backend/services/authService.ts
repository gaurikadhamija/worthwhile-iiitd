import crypto from 'node:crypto';
import { db } from '../db/connection.js';
import { User, UserProfile } from '../types/index.js';
import { UserService } from './userService.js';
import { demoModeEnabled } from '../config.js';

export interface AuthSession {
  user: User;
  profile: UserProfile | null;
  token: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export class AuthService {
  static signup(data: {
    email: string;
    password: string;
    name: string;
    role?: 'student' | 'organizer';
    delhi_region?: string;
  }): AuthSession {
    if (typeof data.email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email.trim())) throw new Error('A valid email is required.');
    if (typeof data.password !== 'string' || data.password.length < 8) throw new Error('Password must be at least 8 characters.');
    if (typeof data.name !== 'string' || !data.name.trim()) throw new Error('Name is required.');
    // Only 'student' or 'organizer' can be self-selected; 'organizer' grants no authority until an admin links the account to an organizer.
    data.role = data.role === 'organizer' ? 'organizer' : 'student';
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(data.email.trim().toLowerCase());
    if (existing) {
      throw new Error('An account with this email already exists.');
    }

    const userId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(data.password, salt);
    const sessionToken = crypto.randomBytes(32).toString('hex');

    db.prepare(`
      INSERT INTO users (id, email, name, role, avatar_url, password_hash, salt, session_token, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `).run(
      userId,
      data.email.trim().toLowerCase(),
      data.name.trim(),
      data.role || 'student',
      `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}&backgroundColor=6B1E23,5A3828`,
      passwordHash,
      salt,
      sessionToken
    );

    // Create default profile for the user with Delhi defaults and onboarding_completed = 0
    db.prepare(`
      INSERT INTO profiles (
        user_id, year_of_study, degree, major, free_hours_per_week,
        commute_mode, campus_location, delhi_region, preferred_time_of_day,
        onboarding_completed, goals_json, interests_json, priorities_json,
        career_interests_json, preferred_event_types_json, preferred_duration_max, preferred_distance_max
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      userId,
      'Junior (3rd Year)',
      'B.Tech',
      'Computer Science & Engineering',
      10,
      'Delhi Metro / Walk',
      data.delhi_region ? `${data.delhi_region} Campus` : 'South Delhi (IIT Delhi)',
      data.delhi_region || 'South Delhi',
      'Afternoon & Evening',
      JSON.stringify(['Get an internship', 'Learn technical skills', 'Build projects']),
      JSON.stringify(['Artificial Intelligence', 'Full-Stack Development', 'Venture Capital']),
      JSON.stringify({ career: 35, learning: 25, networking: 20, convenience: 10, fun: 10 }),
      JSON.stringify(['Software Engineering', 'AI Research', 'Product Management']),
      JSON.stringify(['Workshops', 'Hackathons', 'Networking']),
      120,
      15
    );

    const user = UserService.getUser(userId)!;
    const profile = UserService.getProfile(userId);

    return { user, profile, token: sessionToken };
  }

  static login(email: string, password: string): AuthSession {
    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any;
    if (!row) {
      throw new Error('Invalid email or password.');
    }

    if (!row.password_hash || !row.salt) {
      // Seeded demo accounts have no password. They can be used ONLY when demo mode is explicitly enabled.
      if (row.is_demo && demoModeEnabled()) {
        // explicit dev/demo opt-in
      } else {
        throw new Error('Invalid email or password.');
      }
    } else {
      const computedHash = hashPassword(password, row.salt);
      if (computedHash !== row.password_hash) {
        throw new Error('Invalid email or password.');
      }
    }

    const sessionToken = crypto.randomBytes(32).toString('hex');
    db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(sessionToken, row.id);

    const user = UserService.getUser(row.id)!;
    const profile = UserService.getProfile(row.id);

    return { user, profile, token: sessionToken };
  }

  /** `googleData` MUST come from verifyGoogleIdToken(); never from client-supplied fields. */
  static googleLogin(googleData: { email: string; name: string; avatar_url?: string }): AuthSession {
    const email = googleData.email.trim().toLowerCase();
    let row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;

    if (!row) {
      const userId = `usr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const sessionToken = crypto.randomBytes(32).toString('hex');

      db.prepare(`
        INSERT INTO users (id, email, name, role, avatar_url, session_token, created_at)
        VALUES (?, ?, ?, 'student', ?, ?, datetime('now'))
      `).run(
        userId,
        email,
        googleData.name || 'Student',
        googleData.avatar_url || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleData.name)}`,
        sessionToken
      );

      // Create default profile
      db.prepare(`
        INSERT INTO profiles (
          user_id, year_of_study, degree, major, free_hours_per_week,
          commute_mode, campus_location, delhi_region, preferred_time_of_day,
          onboarding_completed, goals_json, interests_json, priorities_json,
          career_interests_json, preferred_event_types_json, preferred_duration_max, preferred_distance_max
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        'Junior (3rd Year)',
        'B.Tech',
        'Computer Science',
        8,
        'Delhi Metro',
        'South Delhi (IIT Delhi)',
        'South Delhi',
        'Afternoon & Evening',
        JSON.stringify(['Get an internship', 'Learn technical skills']),
        JSON.stringify(['Artificial Intelligence', 'Startups']),
        JSON.stringify({ career: 35, learning: 25, networking: 20, convenience: 10, fun: 10 }),
        JSON.stringify(['Software Engineering']),
        JSON.stringify(['Workshops', 'Networking']),
        120,
        15
      );

      row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    } else {
      const sessionToken = crypto.randomBytes(32).toString('hex');
      db.prepare('UPDATE users SET session_token = ? WHERE id = ?').run(sessionToken, row.id);
      row.session_token = sessionToken;
    }

    const user = UserService.getUser(row.id)!;
    const profile = UserService.getProfile(row.id);

    return { user, profile, token: row.session_token };
  }

  static getUserByToken(token: string): AuthSession | null {
    if (!token) return null;
    const row = db.prepare('SELECT id FROM users WHERE session_token = ?').get(token) as any;
    if (!row) return null;

    const user = UserService.getUser(row.id);
    if (!user) return null;
    const profile = UserService.getProfile(row.id);

    return { user, profile, token };
  }

  static logout(token: string): boolean {
    if (!token) return true;
    db.prepare('UPDATE users SET session_token = NULL WHERE session_token = ?').run(token);
    return true;
  }

  /**
   * Never reveals whether the email exists and never returns the reset token to the caller
   * (that would allow anyone to take over any account). No email provider is wired up yet, so outside
   * demo mode the token is stored but not delivered; see SETUP/README notes. In demo mode only, the token is returned.
   */
  static requestPasswordReset(email: string): { success: boolean; resetToken?: string } {
    const row = typeof email === 'string'
      ? db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase()) as any
      : null;
    if (!row) return { success: true };

    const resetToken = crypto.randomBytes(24).toString('hex');
    db.prepare(`
      UPDATE users SET reset_token = ?, reset_expires = datetime('now', '+1 hour')
      WHERE id = ?
    `).run(resetToken, row.id);

    return demoModeEnabled() ? { success: true, resetToken } : { success: true };
  }

  static resetPassword(token: string, newPass: string): boolean {
    const row = db.prepare(`
      SELECT id FROM users WHERE reset_token = ? AND reset_expires > datetime('now')
    `).get(token) as any;

    if (!row) {
      throw new Error('Invalid or expired password reset link.');
    }

    if (typeof newPass !== 'string' || newPass.length < 8) throw new Error('Password must be at least 8 characters.');
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = hashPassword(newPass, salt);

    db.prepare(`
      UPDATE users SET password_hash = ?, salt = ?, reset_token = NULL, reset_expires = NULL, session_token = NULL
      WHERE id = ?
    `).run(hash, salt, row.id);

    return true;
  }
}
