import { db } from '../db/connection.js';
import { Review } from '../types/index.js';
import { HttpError } from './errors.js';

export interface CommunityInsights {
  overallRating: number;
  totalReviews: number;
  verifiedReviews: number;
  demoReviews: number;
  /** true when the figures come only from seeded demo reviews */
  isDemoSample: boolean;
  hasData: boolean;
  categoryAverages: {
    contentQuality: number;
    speakerQuality: number;
    networking: number;
    timeWellSpent: number;
    logistics: number;
  };
  topPositiveTags: string[];
  topConstructiveTags: string[];
  summaryStatements: {
    pros: string[];
    caveats: string[];
  };
}

export class ReviewService {
  static getReviewsForEvent(eventId: string): Review[] {
    const rows = db.prepare(`
      SELECT * FROM reviews WHERE event_id = ? ORDER BY created_at DESC
    `).all(eventId) as any[];

    return rows.map(r => ({
      id: r.id,
      event_id: r.event_id,
      user_id: r.user_id,
      user_name: r.user_name,
      user_degree: r.user_degree,
      is_verified_attendee: Boolean(r.is_verified_attendee),
      is_demo: Boolean(r.is_demo),
      verification_basis: r.verification_basis || null,
      rating_overall: r.rating_overall,
      rating_content: r.rating_content,
      rating_speaker: r.rating_speaker,
      rating_networking: r.rating_networking,
      rating_time_spent: r.rating_time_spent,
      rating_logistics: r.rating_logistics,
      comment: r.comment,
      tags: JSON.parse(r.tags_json || '[]'),
      created_at: r.created_at
    }));
  }

  static getCommunityInsights(eventId: string): CommunityInsights {
    const all = this.getReviewsForEvent(eventId);
    // Real and demo reviews are never averaged together: real reviews win; demo is shown only as a labelled sample.
    const real = all.filter(r => !r.is_demo);
    const demo = all.filter(r => r.is_demo);
    const isDemoSample = real.length === 0 && demo.length > 0;
    const reviews = real.length > 0 ? real : demo;
    const verifiedReviews = real.filter(r => r.is_verified_attendee).length;

    if (reviews.length === 0) {
      return {
        overallRating: 0,
        totalReviews: 0,
        verifiedReviews: 0,
        demoReviews: 0,
        isDemoSample: false,
        hasData: false,
        categoryAverages: { contentQuality: 0, speakerQuality: 0, networking: 0, timeWellSpent: 0, logistics: 0 },
        topPositiveTags: [],
        topConstructiveTags: [],
        summaryStatements: { pros: [], caveats: [] }
      };
    }

    const count = reviews.length;
    const sumOverall = reviews.reduce((acc, r) => acc + r.rating_overall, 0);
    const sumContent = reviews.reduce((acc, r) => acc + r.rating_content, 0);
    const sumSpeaker = reviews.reduce((acc, r) => acc + r.rating_speaker, 0);
    const sumNet = reviews.reduce((acc, r) => acc + r.rating_networking, 0);
    const sumTime = reviews.reduce((acc, r) => acc + r.rating_time_spent, 0);
    const sumLog = reviews.reduce((acc, r) => acc + r.rating_logistics, 0);

    const tagCounts: Record<string, number> = {};
    for (const r of reviews) {
      for (const t of r.tags) {
        tagCounts[t] = (tagCounts[t] || 0) + 1;
      }
    }

    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]);
    const positiveTagList = ['Hands-on', 'Great networking', 'Good for resume', 'Worth attending', 'Beginner friendly', 'Free food'];
    const constructiveTagList = ['Long queues', 'Started late', 'Heavy sales pitch', 'Limited seats'];

    const topPositive = sortedTags
      .filter(([t]) => positiveTagList.includes(t))
      .map(([t]) => t)
      .slice(0, 4);

    const topConstructive = sortedTags
      .filter(([t]) => constructiveTagList.includes(t))
      .map(([t]) => t)
      .slice(0, 3);

    const pros: string[] = [];
    if (topPositive.includes('Hands-on')) pros.push('Reviewers describe it as hands-on');
    if (topPositive.includes('Great networking')) pros.push('Reviewers highlight networking opportunities');
    if (topPositive.includes('Good for resume')) pros.push('Reviewers cite tangible project outcomes');
    if (topPositive.includes('Free food')) pros.push('Reviewers mention catering');
    

    const caveats: string[] = [];
    if (topConstructive.includes('Long queues')) caveats.push('Check-in queues peak 10 minutes before starting');
    if (topConstructive.includes('Started late')) caveats.push('Sessions historically run 5–15 minutes behind schedule');
    

    return {
      overallRating: Number((sumOverall / count).toFixed(1)),
      totalReviews: count,
      verifiedReviews,
      demoReviews: demo.length,
      isDemoSample,
      hasData: true,
      categoryAverages: {
        contentQuality: Number((sumContent / count).toFixed(1)),
        speakerQuality: Number((sumSpeaker / count).toFixed(1)),
        networking: Number((sumNet / count).toFixed(1)),
        timeWellSpent: Number((sumTime / count).toFixed(1)),
        logistics: Number((sumLog / count).toFixed(1)),
      },
      topPositiveTags: topPositive,
      topConstructiveTags: topConstructive,
      summaryStatements: {
        pros,
        caveats
      }
    };
  }

  /**
   * Creates a review. Identity and verification are derived server-side:
   *  - the caller must be registered for the event (association),
   *  - `is_verified_attendee` is true only if an organizer check-in record exists for this user+event.
   * No client field can influence verification.
   */
  static createReview(data: {
    event_id: string;
    user_id: string;
    user_name: string;
    user_degree?: string;
    rating_content: number;
    rating_speaker: number;
    rating_networking: number;
    rating_time_spent: number;
    rating_logistics: number;
    comment?: string;
    tags: string[];
  }): Review {
    const event = db.prepare('SELECT id FROM events WHERE id = ?').get(data.event_id);
    if (!event) throw new HttpError(404, 'Event not found');

    const reg = db.prepare(`
      SELECT attended, attendance_source FROM event_registrations WHERE event_id = ? AND user_id = ?
    `).get(data.event_id, data.user_id) as any;
    if (!reg) throw new HttpError(403, 'Register for this event before reviewing it.');

    const dup = db.prepare('SELECT id FROM reviews WHERE event_id = ? AND user_id = ?').get(data.event_id, data.user_id);
    if (dup) throw new HttpError(409, 'You have already reviewed this event.');

    const isVerified = reg.attended === 1 && reg.attendance_source === 'organizer_checkin';
    const basis = isVerified ? 'organizer_checkin' : null;

    const overall = Number(
      ((data.rating_content + data.rating_speaker + data.rating_networking + data.rating_time_spent + data.rating_logistics) / 5).toFixed(1)
    );
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      db.prepare(`
        INSERT INTO reviews (
          id, event_id, user_id, user_name, user_degree, is_verified_attendee, verification_basis, is_demo,
          rating_overall, rating_content, rating_speaker, rating_networking,
          rating_time_spent, rating_logistics, comment, tags_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).run(
        id, data.event_id, data.user_id, data.user_name, data.user_degree || 'Student',
        isVerified ? 1 : 0, basis, overall,
        data.rating_content, data.rating_speaker, data.rating_networking,
        data.rating_time_spent, data.rating_logistics,
        data.comment || null, JSON.stringify(data.tags || [])
      );
    } catch (e: any) {
      if (String(e?.message).includes('UNIQUE')) throw new HttpError(409, 'You have already reviewed this event.');
      throw e;
    }

    return {
      id,
      event_id: data.event_id,
      user_id: data.user_id,
      user_name: data.user_name,
      user_degree: data.user_degree,
      is_verified_attendee: isVerified,
      is_demo: false,
      verification_basis: basis,
      rating_overall: overall,
      rating_content: data.rating_content,
      rating_speaker: data.rating_speaker,
      rating_networking: data.rating_networking,
      rating_time_spent: data.rating_time_spent,
      rating_logistics: data.rating_logistics,
      comment: data.comment,
      tags: data.tags,
      created_at: new Date().toISOString()
    };
  }

  /** Strict server-side validation of a review payload. Throws HttpError(400). */
  static validatePayload(body: any) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Invalid request body.');
    if (typeof body.event_id !== 'string' || !body.event_id) throw new HttpError(400, 'event_id is required');
    const ratings: Record<string, number> = {};
    for (const k of ['rating_content', 'rating_speaker', 'rating_networking', 'rating_time_spent', 'rating_logistics']) {
      const v = body[k];
      if (typeof v !== 'number' || !Number.isFinite(v) || v < 1 || v > 5) {
        throw new HttpError(400, `${k} must be a number between 1 and 5.`);
      }
      ratings[k] = v;
    }
    let comment: string | undefined;
    if (body.comment !== undefined && body.comment !== null) {
      if (typeof body.comment !== 'string' || body.comment.length > 1000) throw new HttpError(400, 'comment must be a string of at most 1000 characters.');
      comment = body.comment.trim() || undefined;
    }
    let tags: string[] = [];
    if (body.tags !== undefined) {
      if (!Array.isArray(body.tags) || body.tags.length > 10 || body.tags.some((t: any) => typeof t !== 'string' || t.length > 40)) {
        throw new HttpError(400, 'tags must be an array of at most 10 short strings.');
      }
      tags = body.tags;
    }
    // NOTE: is_verified_attendee / isVerified / user_id / user_name in the body are deliberately ignored.
    return { event_id: body.event_id as string, ...ratings, comment, tags } as {
      event_id: string; rating_content: number; rating_speaker: number; rating_networking: number;
      rating_time_spent: number; rating_logistics: number; comment?: string; tags: string[];
    };
  }
}
