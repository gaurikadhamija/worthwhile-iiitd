import { db } from '../db/connection.js';
import { OrganizerClaim } from '../types/index.js';
import { HttpError } from './errors.js';
import { canManageOrganizer } from '../middleware/auth.js';

/**
 * Claim verification rules (inspectable, derived on read from persisted evidence):
 *
 *  - A student's response is SUBMITTED evidence. By itself it never verifies anything.
 *  - A response counts toward status only if its author has an organizer check-in attendance
 *    record for the event (registration alone does not count). Call these "attendee responses".
 *  - Status is derived only when attendee responses >= MIN_ATTENDEE_RESPONSES:
 *      >=80% confirmed => verified, >=50% => partially_verified, else contradicted.
 *  - Seeded claims carry illustrative figures and are tier 'demo'. Their seeded baseline is
 *    NEVER mixed with real responses; real status replaces it only once the threshold above is met.
 *  - Otherwise: "Submitted — awaiting verification" (or "No evidence yet").
 *  - Free-text evidence notes are never returned publicly.
 */
export const MIN_ATTENDEE_RESPONSES = 5;

function rowToClaim(r: any): OrganizerClaim {
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS submitted,
      COALESCE(SUM(CASE WHEN er.attended = 1 AND er.attendance_source = 'organizer_checkin' THEN 1 ELSE 0 END), 0) AS att,
      COALESCE(SUM(CASE WHEN er.attended = 1 AND er.attendance_source = 'organizer_checkin' AND ce.confirmed = 1 THEN 1 ELSE 0 END), 0) AS att_ok
    FROM claim_evidence ce
    LEFT JOIN event_registrations er ON er.event_id = ? AND er.user_id = ce.student_id
    WHERE ce.claim_id = ?
  `).get(r.event_id, r.id) as { submitted: number; att: number; att_ok: number };

  const isDemo = Boolean(r.is_demo);
  const base = {
    id: r.id,
    event_id: r.event_id,
    claim_text: r.claim_text,
    claim_category: r.claim_category,
    promised_outcome: r.promised_outcome,
    is_demo: isDemo,
    submitted_count: stats.submitted,
    attendee_responses: stats.att,
  };

  if (stats.att >= MIN_ATTENDEE_RESPONSES) {
    const pct = Math.round((stats.att_ok / stats.att) * 100);
    const status = pct >= 80 ? 'verified' : pct >= 50 ? 'partially_verified' : 'contradicted';
    return {
      ...base,
      verification_status: status,
      evidence_score: pct,
      student_sample_size: stats.att,
      notes: undefined,
      evidence_tier: 'verified',
      evidence_label: `Corroborated by ${stats.att_ok} of ${stats.att} checked-in attendees`,
    };
  }

  if (isDemo) {
    return {
      ...base,
      verification_status: r.verification_status,
      evidence_score: r.evidence_score,
      student_sample_size: r.student_sample_size,
      notes: r.notes,
      evidence_tier: 'demo',
      evidence_label: 'Demo sample — illustrative figures, not real attendee data',
    };
  }

  return {
    ...base,
    verification_status: 'insufficient_evidence',
    evidence_score: 0,
    student_sample_size: 0,
    notes: r.notes,
    evidence_tier: stats.submitted > 0 ? 'submitted' : 'none',
    evidence_label: stats.submitted > 0
      ? `Submitted — awaiting verification (${stats.submitted} response${stats.submitted === 1 ? '' : 's'}, ${stats.att} from checked-in attendees; ${MIN_ATTENDEE_RESPONSES} needed)`
      : 'No evidence yet',
  };
}

export class ClaimVerificationService {
  static getClaimsForEvent(eventId: string): OrganizerClaim[] {
    const rows = db.prepare('SELECT * FROM organizer_claims WHERE event_id = ?').all(eventId) as any[];
    return rows.map(rowToClaim);
  }

  static submitEvidence(data: {
    claim_id: string;
    student_id: string;
    student_role: string;
    confirmed: unknown;
    notes?: unknown;
  }): { success: boolean; updatedClaim: OrganizerClaim } {
    if (typeof data.confirmed !== 'boolean') throw new HttpError(400, 'confirmed must be true or false.');
    if (data.notes !== undefined && data.notes !== null && (typeof data.notes !== 'string' || data.notes.length > 500)) {
      throw new HttpError(400, 'notes must be a string of at most 500 characters.');
    }

    const claim = db.prepare(`
      SELECT oc.*, e.organizer_id FROM organizer_claims oc JOIN events e ON e.id = oc.event_id WHERE oc.id = ?
    `).get(data.claim_id) as any;
    if (!claim) throw new HttpError(404, 'Claim not found');

    if (canManageOrganizer(data.student_id, data.student_role, claim.organizer_id)) {
      throw new HttpError(403, 'Organizers cannot submit evidence about their own claims.');
    }
    const reg = db.prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?').get(claim.event_id, data.student_id);
    if (!reg) throw new HttpError(403, 'Only students registered for this event can submit evidence.');

    // One response per student per claim (also enforced by a UNIQUE index).
    db.prepare(`
      INSERT INTO claim_evidence (id, claim_id, student_id, confirmed, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(claim_id, student_id) DO UPDATE SET
        confirmed = excluded.confirmed, notes = excluded.notes, updated_at = datetime('now')
    `).run(
      `evd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      data.claim_id, data.student_id, data.confirmed ? 1 : 0, (data.notes as string) || null
    );

    return { success: true, updatedClaim: rowToClaim(claim) };
  }
}
