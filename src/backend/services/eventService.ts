import { db } from '../db/connection.js';
import { ClaimVerificationService } from './claimVerificationService.js';
import { Event, UserProfile, EventOutcome, OrganizerClaim, EventAnalytics, Venue, Organizer } from '../types/index.js';
import { calculateRelevanceScore } from './relevanceEngine.js';

export class EventService {
  /**
   * Helper to deserialize event rows and attach joined data
   */
  private static hydrateEvent(raw: any): Event {
    return {
      id: raw.id,
      title: raw.title,
      slug: raw.slug,
      tagline: raw.tagline,
      description: raw.description,
      category: raw.category,
      organizer_id: raw.organizer_id,
      venue_id: raw.venue_id,
      start_time: raw.start_time,
      end_time: raw.end_time,
      cost_cents: raw.cost_cents,
      is_free: Boolean(raw.is_free),
      cover_image: raw.cover_image,
      max_capacity: raw.max_capacity,
      certificate_offered: Boolean(raw.certificate_offered),
      networking_potential: raw.networking_potential,
      career_value_rating: raw.career_value_rating,
      learning_value_rating: raw.learning_value_rating,
      tags: JSON.parse(raw.tags_json || '[]'),
      skills_taught: JSON.parse(raw.skills_taught_json || '[]'),
      prerequisites: raw.prerequisites,
      is_published: Boolean(raw.is_published),
      created_at: raw.created_at,
      organizer: raw.org_name
        ? {
            id: raw.organizer_id,
            name: raw.org_name,
            slug: raw.org_slug,
            type: raw.org_type,
            // No organizer verification process exists yet, so seeded 'verified' flags are never surfaced as verification.
            verified: Boolean(raw.org_verified) && !raw.org_is_demo,
            is_demo: Boolean(raw.org_is_demo),
            trust_score: raw.org_trust_score,
            historical_events_count: raw.org_historical_events_count,
            avg_punctuality_rating: raw.org_avg_punctuality_rating,
            description: raw.org_description,
            contact_email: raw.org_contact_email,
          }
        : undefined,
      venue: raw.venue_name
        ? {
            id: raw.venue_id,
            name: raw.venue_name,
            building: raw.venue_building,
            room: raw.venue_room,
            campus_zone: raw.venue_campus_zone,
            address: raw.venue_address || 'Delhi NCR, India',
            place_id: raw.venue_place_id,
            city_region: raw.venue_city_region || 'Delhi NCR',
            latitude: raw.venue_latitude,
            longitude: raw.venue_longitude,
            map_x: raw.venue_map_x,
            map_y: raw.venue_map_y,
            capacity: raw.venue_capacity,
            wheelchair_accessible: Boolean(raw.venue_wheelchair_accessible),
          }
        : undefined,
      // Real reviews win; demo reviews are only ever shown as a labelled sample; no reviews => null (unknown), not a default score.
      rating_avg: Number(raw.real_count) > 0 ? Number(Number(raw.real_avg).toFixed(1))
        : Number(raw.demo_count) > 0 ? Number(Number(raw.demo_avg).toFixed(1)) : null,
      rating_is_demo: Number(raw.real_count) === 0 && Number(raw.demo_count) > 0,
      review_count: Number(raw.real_count) > 0 ? Number(raw.real_count) : Number(raw.demo_count || 0),
      verified_review_count: Number(raw.verified_count || 0),
      is_demo: Boolean(raw.is_demo),
      analytics: raw.an_seats_total
        ? {
            event_id: raw.id,
            seats_total: raw.an_seats_total,
            seats_registered: raw.an_seats_registered,
            seats_attended_live: raw.an_seats_attended_live,
            attendance_rate_pct: raw.an_attendance_rate_pct,
            delay_minutes_avg: raw.an_delay_minutes_avg,
            peak_queue_time: raw.an_peak_queue_time,
            demand_level: raw.an_demand_level,
            signal_type: raw.an_signal_type,
            is_demo: Boolean(raw.an_is_demo),
          }
        : undefined,
    };
  }

  static getAllEvents(filters: {
    category?: string;
    search?: string;
    is_free?: boolean;
    certificate_only?: boolean;
    networking_level?: string;
    profile?: UserProfile | null;
  } = {}): (Event & { relevance: ReturnType<typeof calculateRelevanceScore> })[] {
    let query = `
      SELECT 
        e.*,
        o.name as org_name, o.slug as org_slug, o.type as org_type, 
        o.verified as org_verified, o.is_demo as org_is_demo, o.trust_score as org_trust_score,
        o.historical_events_count as org_historical_events_count,
        o.avg_punctuality_rating as org_avg_punctuality_rating,
        o.description as org_description, o.contact_email as org_contact_email,
        v.name as venue_name, v.building as venue_building, v.room as venue_room,
        v.campus_zone as venue_campus_zone, v.address as venue_address, v.place_id as venue_place_id,
        v.city_region as venue_city_region, v.latitude as venue_latitude,
        v.longitude as venue_longitude, v.map_x as venue_map_x, v.map_y as venue_map_y,
        v.capacity as venue_capacity, v.wheelchair_accessible as venue_wheelchair_accessible,
        a.seats_total as an_seats_total, a.seats_registered as an_seats_registered,
        a.seats_attended_live as an_seats_attended_live, a.attendance_rate_pct as an_attendance_rate_pct,
        a.delay_minutes_avg as an_delay_minutes_avg, a.peak_queue_time as an_peak_queue_time,
        a.demand_level as an_demand_level, a.signal_type as an_signal_type, a.is_demo as an_is_demo,
        (SELECT AVG(r.rating_overall) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 0) as real_avg,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 0) as real_count,
        (SELECT AVG(r.rating_overall) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 1) as demo_avg,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 1) as demo_count,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 0 AND r.is_verified_attendee = 1) as verified_count
      FROM events e
      LEFT JOIN organizers o ON e.organizer_id = o.id
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_analytics a ON e.id = a.event_id
      WHERE e.is_published = 1
    `;

    const params: any[] = [];

    if (filters.category && filters.category !== 'All') {
      query += ` AND e.category = ?`;
      params.push(filters.category);
    }

    if (filters.is_free !== undefined) {
      query += ` AND e.is_free = ?`;
      params.push(filters.is_free ? 1 : 0);
    }

    if (filters.certificate_only) {
      query += ` AND e.certificate_offered = 1`;
    }

    if (filters.networking_level && filters.networking_level !== 'All') {
      query += ` AND e.networking_potential = ?`;
      params.push(filters.networking_level);
    }

    if (filters.search) {
      const term = `%${filters.search.toLowerCase()}%`;
      query += ` AND (LOWER(e.title) LIKE ? OR LOWER(e.tagline) LIKE ? OR LOWER(e.description) LIKE ? OR LOWER(e.tags_json) LIKE ? OR LOWER(o.name) LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    query += ` ORDER BY e.start_time ASC`;

    const rows = db.prepare(query).all(...params);
    const events = rows.map(r => this.hydrateEvent(r));

    // Attach calculated relevance score for every event
    return events.map(ev => {
      const relevance = calculateRelevanceScore(filters.profile || null, ev);
      return {
        ...ev,
        relevance
      };
    });
  }

  static getEventById(id: string, profile?: UserProfile | null): (Event & { relevance: ReturnType<typeof calculateRelevanceScore> }) | null {
    const query = `
      SELECT 
        e.*,
        o.name as org_name, o.slug as org_slug, o.type as org_type, 
        o.verified as org_verified, o.is_demo as org_is_demo, o.trust_score as org_trust_score,
        o.historical_events_count as org_historical_events_count,
        o.avg_punctuality_rating as org_avg_punctuality_rating,
        o.description as org_description, o.contact_email as org_contact_email,
        v.name as venue_name, v.building as venue_building, v.room as venue_room,
        v.campus_zone as venue_campus_zone, v.address as venue_address, v.place_id as venue_place_id,
        v.city_region as venue_city_region, v.latitude as venue_latitude,
        v.longitude as venue_longitude, v.map_x as venue_map_x, v.map_y as venue_map_y,
        v.capacity as venue_capacity, v.wheelchair_accessible as venue_wheelchair_accessible,
        a.seats_total as an_seats_total, a.seats_registered as an_seats_registered,
        a.seats_attended_live as an_seats_attended_live, a.attendance_rate_pct as an_attendance_rate_pct,
        a.delay_minutes_avg as an_delay_minutes_avg, a.peak_queue_time as an_peak_queue_time,
        a.demand_level as an_demand_level, a.signal_type as an_signal_type, a.is_demo as an_is_demo,
        (SELECT AVG(r.rating_overall) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 0) as real_avg,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 0) as real_count,
        (SELECT AVG(r.rating_overall) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 1) as demo_avg,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 1) as demo_count,
        (SELECT COUNT(r.id) FROM reviews r WHERE r.event_id = e.id AND r.is_demo = 0 AND r.is_verified_attendee = 1) as verified_count
      FROM events e
      LEFT JOIN organizers o ON e.organizer_id = o.id
      LEFT JOIN venues v ON e.venue_id = v.id
      LEFT JOIN event_analytics a ON e.id = a.event_id
      WHERE e.id = ?
    `;

    const row = db.prepare(query).get(id);
    if (!row) return null;

    const event = this.hydrateEvent(row);

    // Fetch outcomes
    const outcomesRows = db.prepare('SELECT * FROM event_outcomes WHERE event_id = ?').all(id) as any[];
    event.outcomes = outcomesRows.map(o => ({
      id: o.id,
      event_id: o.event_id,
      outcome_type: o.outcome_type,
      title: o.title,
      description: o.description,
      highlight: o.highlight
    }));

    // Fetch claims
    event.claims = ClaimVerificationService.getClaimsForEvent(id);

    const relevance = calculateRelevanceScore(profile || null, event);

    return {
      ...event,
      relevance
    };
  }

  static createEvent(eventData: Partial<Event>): Event {
    const id = `evt_${Date.now()}`;
    const slug = (eventData.title || 'event')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    let venueId = eventData.venue_id || 'ven_iit_delhi';
    if ((eventData as any).custom_venue) {
      const cv = (eventData as any).custom_venue;
      venueId = `ven_${Date.now()}`;
      db.prepare(`
        INSERT INTO venues (id, name, building, room, campus_zone, address, place_id, city_region, latitude, longitude, map_x, map_y, capacity, wheelchair_accessible)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 50, 50, ?, 1)
      `).run(
        venueId,
        cv.name || 'Custom Delhi Venue',
        cv.building || cv.name || 'Campus Facility',
        cv.room || 'Main Hall',
        cv.campus_zone || 'Delhi NCR',
        cv.address || 'Delhi, India',
        cv.place_id || null,
        cv.city_region || 'Delhi NCR',
        Number(cv.latitude) || 28.5450,
        Number(cv.longitude) || 77.1926,
        eventData.max_capacity || 100
      );
    }

    db.prepare(`
      INSERT INTO events (
        id, title, slug, tagline, description, category, organizer_id, venue_id,
        start_time, end_time, cost_cents, is_free, cover_image, max_capacity,
        certificate_offered, networking_potential, career_value_rating, learning_value_rating,
        tags_json, skills_taught_json, prerequisites, is_published
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).run(
      id,
      eventData.title || 'Untitled Event',
      slug,
      eventData.tagline || '',
      eventData.description || '',
      eventData.category || 'Workshops',
      eventData.organizer_id || 'org_acm',
      venueId,
      eventData.start_time || new Date().toISOString(),
      eventData.end_time || new Date(Date.now() + 7200000).toISOString(),
      eventData.cost_cents || 0,
      eventData.is_free !== false ? 1 : 0,
      eventData.cover_image || 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
      eventData.max_capacity || 100,
      eventData.certificate_offered ? 1 : 0,
      eventData.networking_potential || 'Moderate',
      eventData.career_value_rating || 80,
      eventData.learning_value_rating || 80,
      JSON.stringify(eventData.tags || ['Campus', 'Student']),
      JSON.stringify(eventData.skills_taught || []),
      eventData.prerequisites || 'None'
    );

    // Insert initial analytics
    db.prepare(`
      INSERT INTO event_analytics (
        event_id, seats_total, seats_registered, seats_attended_live,
        attendance_rate_pct, delay_minutes_avg, demand_level, signal_type
      ) VALUES (?, ?, 0, 0, 0, 5, 'moderate', 'estimated')
    `).run(id, eventData.max_capacity || 100);

    return this.getEventById(id)!;
  }

  static updateEvent(id: string, updates: Partial<Event>): Event | null {
    const existing = this.getEventById(id);
    if (!existing) return null;

    db.prepare(`
      UPDATE events SET
        title = COALESCE(?, title),
        tagline = COALESCE(?, tagline),
        description = COALESCE(?, description),
        category = COALESCE(?, category),
        start_time = COALESCE(?, start_time),
        end_time = COALESCE(?, end_time),
        max_capacity = COALESCE(?, max_capacity),
        certificate_offered = COALESCE(?, certificate_offered),
        networking_potential = COALESCE(?, networking_potential),
        prerequisites = COALESCE(?, prerequisites)
      WHERE id = ?
    `).run(
      updates.title ?? null,
      updates.tagline ?? null,
      updates.description ?? null,
      updates.category ?? null,
      updates.start_time ?? null,
      updates.end_time ?? null,
      updates.max_capacity ?? null,
      updates.certificate_offered !== undefined ? (updates.certificate_offered ? 1 : 0) : null,
      updates.networking_potential ?? null,
      updates.prerequisites ?? null,
      id
    );

    return this.getEventById(id);
  }

  static deleteEvent(id: string): boolean {
    const res = db.prepare('DELETE FROM events WHERE id = ?').run(id);
    return res.changes > 0;
  }
}
