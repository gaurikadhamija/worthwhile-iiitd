import { db } from '../db/connection.js';
import { ClaimVerificationService } from './claimVerificationService.js';

const avg = (xs: number[]) => (xs.length ? Number((xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1)) : null);

export class OrganizerService {
  /**
   * `summaryCards` contains ONLY genuine platform activity (demo users/reviews/claims excluded);
   * values are null when there is no evidence — never a flattering default.
   * Seeded illustrative analytics are returned separately under `demoSample`.
   */
  static getDashboardMetrics(organizerId: string) {
    const org = db.prepare('SELECT * FROM organizers WHERE id = ?').get(organizerId) as any;
    if (!org) return null;

    const events = db.prepare(`
      SELECT e.*, a.seats_registered AS demo_registered, a.seats_attended_live AS demo_attended,
             a.attendance_rate_pct AS demo_rate, a.is_demo AS analytics_is_demo
      FROM events e LEFT JOIN event_analytics a ON e.id = a.event_id
      WHERE e.organizer_id = ?
    `).all(organizerId) as any[];

    const regStmt = db.prepare(`
      SELECT COUNT(*) AS reg,
             COALESCE(SUM(CASE WHEN er.attended = 1 AND er.attendance_source = 'organizer_checkin' THEN 1 ELSE 0 END), 0) AS att
      FROM event_registrations er JOIN users u ON u.id = er.user_id
      WHERE er.event_id = ? AND u.is_demo = 0
    `);
    const perEvent = events.map(e => {
      const r = regStmt.get(e.id) as { reg: number; att: number };
      return { e, reg: Number(r.reg), att: Number(r.att) };
    });
    const totalRegistrations = perEvent.reduce((a, x) => a + x.reg, 0);
    const totalAttended = perEvent.reduce((a, x) => a + x.att, 0);

    const allReviews = db.prepare(`
      SELECT r.* FROM reviews r JOIN events e ON r.event_id = e.id WHERE e.organizer_id = ?
    `).all(organizerId) as any[];
    const reviews = allReviews.filter(r => !r.is_demo);
    const demoReviews = allReviews.filter(r => r.is_demo);

    const claims = events.flatMap(e =>
      ClaimVerificationService.getClaimsForEvent(e.id).map(c => ({ ...c, event_title: e.title }))
    );
    const realClaims = claims.filter(c => c.evidence_tier !== 'demo');
    const demoClaims = claims.filter(c => c.evidence_tier === 'demo');
    const verifiedReal = realClaims.filter(c => c.verification_status === 'verified').length;
    const verifiedDemo = demoClaims.filter(c => c.verification_status === 'verified').length;

    const tagFreq: Record<string, number> = {};
    for (const r of reviews) for (const t of JSON.parse(r.tags_json || '[]')) tagFreq[t] = (tagFreq[t] || 0) + 1;

    const demoRegistered = events.reduce((a, e) => a + (e.analytics_is_demo ? e.demo_registered || 0 : 0), 0);
    const demoAttended = events.reduce((a, e) => a + (e.analytics_is_demo ? e.demo_attended || 0 : 0), 0);
    const demoRates = events.filter(e => e.analytics_is_demo && e.demo_rate).map(e => e.demo_rate as number);

    return {
      organizer: { ...org, verified: false, is_demo: Boolean(org.is_demo) },
      summaryCards: {
        totalRegistrations,
        totalAttended,
        attendanceRatePct: totalRegistrations > 0 ? Number(((totalAttended / totalRegistrations) * 100).toFixed(1)) : null,
        averageRating: avg(reviews.map(r => r.rating_overall)),
        contentScore: avg(reviews.map(r => r.rating_content)),
        networkingScore: avg(reviews.map(r => r.rating_networking)),
        reviewCount: reviews.length,
        verifiedReviewCount: reviews.filter(r => r.is_verified_attendee).length,
        claimVerificationHealthPct: realClaims.length > 0 ? Math.round((verifiedReal / realClaims.length) * 100) : null,
        activeEventsCount: events.length
      },
      demoSample: org.is_demo ? {
        isDemo: true,
        note: 'Seeded illustrative figures — not real organizer performance.',
        totalRegistrations: demoRegistered,
        totalAttended: demoAttended,
        attendanceRatePct: avg(demoRates),
        averageRating: avg(demoReviews.map(r => r.rating_overall)),
        contentScore: avg(demoReviews.map(r => r.rating_content)),
        networkingScore: avg(demoReviews.map(r => r.rating_networking)),
        reviewCount: demoReviews.length,
        claimVerificationHealthPct: demoClaims.length > 0 ? Math.round((verifiedDemo / demoClaims.length) * 100) : null,
      } : null,
      // Sample narrative text is illustrative and only returned for demo organizers.
      studentsLoved: org.is_demo ? [
        { topic: 'Zero-boilerplate code repositories', votes: 42, quote: 'The LangGraph demo ran on first execution without debugging environment path issues.' },
        { topic: 'Strict start-time punctuality', votes: 31, quote: 'Started exactly on time and finished right before campus shuttle departure.' }
      ] : [],
      studentsDisliked: org.is_demo ? [
        { topic: 'Catering runouts for late check-ins', severity: 'moderate', note: 'Sample feedback for demonstration.' },
        { topic: 'Check-in line bottle-neck', severity: 'low', note: 'Sample feedback for demonstration.' }
      ] : [],
      sampleFeedbackIsDemo: Boolean(org.is_demo),
      weakEvidenceClaims: claims
        .filter(c => c.verification_status === 'partially_verified' || c.verification_status === 'contradicted')
        .map(wc => ({
          id: wc.id,
          eventTitle: wc.event_title,
          claimText: wc.claim_text,
          status: wc.verification_status,
          score: wc.evidence_score,
          sampleSize: wc.student_sample_size,
          isDemo: wc.evidence_tier === 'demo',
          recommendation: wc.evidence_score < 60
            ? 'Consider revising the wording of this promise to match what attendees experienced.'
            : 'Improve how this promise is delivered or documented.'
        })),
      recentEvents: perEvent.map(({ e, reg, att }) => ({
        id: e.id,
        title: e.title,
        category: e.category,
        startTime: e.start_time,
        registered: reg,
        attended: att,
        capacity: e.max_capacity,
        demoRegistered: e.analytics_is_demo ? e.demo_registered : null,
        demoAttended: e.analytics_is_demo ? e.demo_attended : null
      }))
    };
  }
}
