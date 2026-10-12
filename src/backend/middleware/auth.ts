import { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { AuthService, AuthSession } from '../services/authService.js';
import { UserService } from '../services/userService.js';
import { HttpError } from '../services/errors.js';
import { demoModeEnabled } from '../config.js';

export { demoModeEnabled };

export function extractToken(req: Request): string {
  const h = (req.headers.authorization as string) || (req.headers['x-auth-token'] as string) || '';
  return h.startsWith('Bearer ') ? h.substring(7) : h;
}

/** Identity comes ONLY from a server-issued session token. Client-supplied user ids are never trusted. */
export function getSession(req: Request): AuthSession | null {
  const token = extractToken(req);
  return token ? AuthService.getUserByToken(token) : null;
}

/**
 * Profile used only to personalise read-only discovery. Anonymous visitors get generic results;
 * the demo student is substituted only when demo mode is explicitly enabled.
 */
export function getPersonalizationProfile(req: Request) {
  const s = getSession(req);
  if (s) return s.profile;
  return demoModeEnabled() ? UserService.getProfile('usr_demo_student') : null;
}

export function requireAuth(req: Request): AuthSession {
  const s = getSession(req);
  if (!s) throw new HttpError(401, 'Authentication required.');
  return s;
}

export function requireRole(req: Request, ...roles: string[]): AuthSession {
  const s = requireAuth(req);
  if (!roles.includes(s.user.role)) throw new HttpError(403, 'You do not have permission to perform this action.');
  return s;
}

/** Admins, or the user recorded as owner of the organizer, may manage that organizer's events. */
export function canManageOrganizer(userId: string, role: string, organizerId: string): boolean {
  if (role === 'admin') return true;
  if (role !== 'organizer') return false;
  const row = db.prepare('SELECT owner_user_id FROM organizers WHERE id = ?').get(organizerId) as any;
  return Boolean(row && row.owner_user_id === userId);
}

export function requireEventManager(req: Request, eventId: string): AuthSession {
  const s = requireRole(req, 'organizer', 'admin');
  const ev = db.prepare('SELECT organizer_id FROM events WHERE id = ?').get(eventId) as any;
  if (!ev) throw new HttpError(404, 'Event not found');
  if (!canManageOrganizer(s.user.id, s.user.role, ev.organizer_id)) {
    throw new HttpError(403, 'You do not manage this event.');
  }
  return s;
}

/** Wrap a handler so HttpError -> its status and anything else -> a safe 500 (no internals leaked). */
export function handle(fn: (req: Request, res: Response) => void) {
  return (req: Request, res: Response, _next?: NextFunction) => {
    try {
      fn(req, res);
    } catch (err: any) {
      if (err instanceof HttpError) return res.status(err.status).json({ success: false, error: err.message });
      console.error('Unhandled API error:', err?.message);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  };
}
