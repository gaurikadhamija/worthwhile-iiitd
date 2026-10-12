import { EventService } from './eventService.js';
import { UserProfile, Event } from '../types/index.js';

export interface ComparisonResult {
  events: (Event & { relevance: any })[];
  scheduleConflicts: Array<{
    eventAId: string;
    eventATitle: string;
    eventBId: string;
    eventBTitle: string;
    overlapMinutes: number;
    description: string;
  }>;
  recommendedChoice?: {
    eventId: string;
    eventTitle: string;
    reason: string;
    priorityMatched: string;
    winMargin: string;
  };
}

export class ComparisonService {
  static compareEvents(
    eventIds: string[],
    priority: 'career' | 'learning' | 'networking' | 'convenience' | 'fun' = 'career',
    profile: UserProfile | null = null
  ): ComparisonResult {
    const events: (Event & { relevance: any })[] = [];

    for (const id of eventIds) {
      const ev = EventService.getEventById(id, profile);
      if (ev) {
        events.push(ev);
      }
    }

    // 1. Detect schedule conflicts between any pairs
    const conflicts: ComparisonResult['scheduleConflicts'] = [];

    for (let i = 0; i < events.length; i++) {
      for (let j = i + 1; j < events.length; j++) {
        const evA = events[i];
        const evB = events[j];

        const startA = new Date(evA.start_time).getTime();
        const endA = new Date(evA.end_time).getTime();
        const startB = new Date(evB.start_time).getTime();
        const endB = new Date(evB.end_time).getTime();

        const overlapStart = Math.max(startA, startB);
        const overlapEnd = Math.min(endA, endB);

        if (overlapEnd > overlapStart) {
          const overlapMinutes = Math.round((overlapEnd - overlapStart) / (1000 * 60));
          conflicts.push({
            eventAId: evA.id,
            eventATitle: evA.title,
            eventBId: evB.id,
            eventBTitle: evB.title,
            overlapMinutes,
            description: `Direct time conflict: overlaps by ${overlapMinutes} minutes.`
          });
        }
      }
    }

    // 2. "Which should I choose?" personalized decision engine
    let recommendedChoice: ComparisonResult['recommendedChoice'] = undefined;

    if (events.length > 0) {
      // Calculate priority score for each event
      const scored = events.map(ev => {
        let pScore = 0;
        let pReason = '';

        switch (priority) {
          case 'career':
            pScore = ev.career_value_rating * 1.5 + (ev.organizer?.trust_score ?? 50) * 0.5;
            pReason = `Offers top career leverage (${ev.career_value_rating}/100) with recruiter and alumni engagement.`;
            break;
          case 'learning':
            pScore = ev.learning_value_rating * 1.5 + (ev.certificate_offered ? 15 : 0);
            pReason = `Highest technical depth (${ev.learning_value_rating}/100) and hands-on skill gain.`;
            break;
          case 'networking':
            const netWeight = ev.networking_potential === 'Exceptional' ? 100 : ev.networking_potential === 'High' ? 85 : 55;
            pScore = netWeight * 1.6 + (ev.rating_avg ?? 3) * 10;
            pReason = `Unmatched peer and industry networking potential (${ev.networking_potential}).`;
            break;
          case 'convenience':
            pScore = (ev.relevance.convenience || 85) * 1.5;
            pReason = `Closest proximity to your dorm with rapid check-in and low travel overhead.`;
            break;
          case 'fun':
            const funBonus = ev.category === 'Cultural' ? 100 : ev.category === 'Competitions' ? 80 : 50;
            pScore = funBonus + (ev.rating_avg ?? 3) * 15;
            pReason = `High engagement social atmosphere and relaxed co-curricular experience.`;
            break;
        }

        return {
          event: ev,
          pScore,
          pReason
        };
      });

      scored.sort((a, b) => b.pScore - a.pScore);
      const winner = scored[0];
      const runnerUp = scored[1];
      const diff = runnerUp ? Math.round(winner.pScore - runnerUp.pScore) : 15;

      recommendedChoice = {
        eventId: winner.event.id,
        eventTitle: winner.event.title,
        reason: winner.pReason,
        priorityMatched: priority,
        winMargin: diff > 20 ? 'Clear favorite' : 'Close match'
      };
    }

    return {
      events,
      scheduleConflicts: conflicts,
      recommendedChoice
    };
  }
}
