import { EventService } from './eventService.js';
import { UserProfile, Event } from '../types/index.js';

export interface FreeTimeRecommendation {
  event: Event & { relevance: any };
  fitScore: number;
  timeWindowDisplay: string;
  durationMinutes: number;
  commuteEstimateMinutes: number;
  distanceKm: number;
  commuteTransitMode: string;
  isRecommended: boolean;
  explanation: string;
  conflictWarning?: string;
  isPerfectWindow: boolean;
}

// Real Delhi NCR transit matrix (Metro + Walk duration in minutes)
function estimateDelhiTravel(originZone: string, destinationZone: string): { minutes: number; distanceKm: number; mode: string } {
  const o = originZone.toLowerCase();
  const d = destinationZone.toLowerCase();

  // Same campus / immediate locality
  if ((o.includes('south') && d.includes('south')) || (o.includes('iit') && d.includes('iit'))) {
    return { minutes: 12, distanceKm: 2.8, mode: 'Walking / E-Rickshaw' };
  }
  if ((o.includes('north') && d.includes('north')) || (o.includes('du') && d.includes('du'))) {
    return { minutes: 14, distanceKm: 3.2, mode: 'Delhi Metro / Walk' };
  }
  if (o.includes('central') && d.includes('central')) {
    return { minutes: 15, distanceKm: 3.5, mode: 'Delhi Metro (Yellow Line)' };
  }
  if (o.includes('dwarka') && d.includes('dwarka')) {
    return { minutes: 12, distanceKm: 3.0, mode: 'Delhi Metro (Blue Line)' };
  }

  // Cross-zone Delhi routes via Delhi Metro lines
  if ((o.includes('south') && d.includes('central')) || (o.includes('central') && d.includes('south'))) {
    return { minutes: 22, distanceKm: 9.5, mode: 'Yellow / Violet Line Metro' };
  }
  if ((o.includes('north') && d.includes('central')) || (o.includes('central') && d.includes('north'))) {
    return { minutes: 24, distanceKm: 10.2, mode: 'Yellow Line Metro' };
  }
  if ((o.includes('south') && d.includes('gurugram')) || (o.includes('gurugram') && d.includes('south'))) {
    return { minutes: 30, distanceKm: 18.0, mode: 'Yellow Line Metro (Sikanderpur)' };
  }
  if ((o.includes('south') && d.includes('noida')) || (o.includes('noida') && d.includes('south'))) {
    return { minutes: 36, distanceKm: 19.5, mode: 'Magenta / Blue Line Metro' };
  }
  if ((o.includes('south') && d.includes('dwarka')) || (o.includes('dwarka') && d.includes('south'))) {
    return { minutes: 38, distanceKm: 18.2, mode: 'Magenta Line Metro' };
  }
  if ((o.includes('north') && d.includes('south')) || (o.includes('south') && d.includes('north'))) {
    return { minutes: 46, distanceKm: 22.0, mode: 'Yellow Line Metro (Vishwa Vidyalaya to Hauz Khas)' };
  }
  if ((o.includes('rohini') || o.includes('dtu')) && d.includes('south')) {
    return { minutes: 54, distanceKm: 32.0, mode: 'Red & Yellow Line Metro' };
  }
  if ((o.includes('dwarka') && d.includes('noida')) || (o.includes('noida') && d.includes('dwarka'))) {
    return { minutes: 58, distanceKm: 34.0, mode: 'Blue Line Express' };
  }

  // Default across Delhi NCR
  return { minutes: 28, distanceKm: 12.0, mode: 'Delhi Metro' };
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export class FreeTimeService {
  static findEventsForFreeTime(options: {
    startHour: number; // e.g. 15 for 3:00 PM
    startMinute?: number;
    endHour: number; // e.g. 17 for 5:00 PM
    endMinute?: number;
    currentZone?: string;
    originLat?: number;
    originLng?: number;
    originName?: string;
    profile: UserProfile | null;
  }): FreeTimeRecommendation[] {
    const allEvents = EventService.getAllEvents({ profile: options.profile });

    const startMinuteTotal = options.startHour * 60 + (options.startMinute || 0);
    const endMinuteTotal = options.endHour * 60 + (options.endMinute || 0);
    const windowDuration = endMinuteTotal - startMinuteTotal;

    const studentLocation = options.originName || options.currentZone || options.profile?.delhi_region || options.profile?.campus_location || 'Selected Location';

    const recommendations: FreeTimeRecommendation[] = [];

    for (const ev of allEvents) {
      const eventStart = new Date(ev.start_time);
      const eventEnd = new Date(ev.end_time);

      const evStartMinute = eventStart.getUTCHours() * 60 + eventStart.getUTCMinutes();
      const evEndMinute = eventEnd.getUTCHours() * 60 + eventEnd.getUTCMinutes();
      const evDuration = evEndMinute - evStartMinute;

      let commuteMins = 25;
      let distanceKm = 8.0;
      let travelMode = 'Delhi Metro';

      if (options.originLat && options.originLng && ev.venue?.latitude && ev.venue?.longitude) {
        distanceKm = haversineKm(options.originLat, options.originLng, ev.venue.latitude, ev.venue.longitude);
        if (distanceKm <= 1.2) {
          commuteMins = Math.max(2, Math.round(distanceKm * 12.5));
          travelMode = 'Walking';
        } else if (distanceKm <= 3.5) {
          commuteMins = Math.round(6 + distanceKm * 3.5);
          travelMode = 'E-Rickshaw / Walk';
        } else {
          commuteMins = Math.round(12 + distanceKm * 2.2);
          travelMode = 'Delhi Metro / Cab';
        }
      } else {
        const venueZone = ev.venue?.campus_zone || ev.venue?.city_region || 'Central Delhi';
        const travel = estimateDelhiTravel(studentLocation, venueZone);
        commuteMins = travel.minutes;
        distanceKm = travel.distanceKm;
        travelMode = travel.mode;
      }

      // Check overlap with the free window
      const hasOverlap = (evStartMinute < endMinuteTotal) && (evEndMinute > startMinuteTotal);
      
      // Calculate reachable session duration after travel
      const arrivalAtVenue = startMinuteTotal + commuteMins;
      const departureFromVenue = endMinuteTotal - commuteMins;
      const usableEventMinutes = Math.min(departureFromVenue, evEndMinute) - Math.max(arrivalAtVenue, evStartMinute);

      const isTravelFeasible = commuteMins * 2 < windowDuration; // Must allow arrival within window
      const isPerfectWindow = (evStartMinute >= arrivalAtVenue) && (evEndMinute <= departureFromVenue);

      let fitScore = ev.relevance.totalScore;
      let isRecommended = false;
      let explanation = '';
      let conflictWarning: string | undefined = undefined;

      if (isPerfectWindow) {
        isRecommended = true;
        fitScore += 8;
        explanation = `✓ Fits your ${(windowDuration/60).toFixed(1)}-hour window (${commuteMins} min travel via ${travelMode} from ${studentLocation}).`;
      } else if (usableEventMinutes >= 25 && isTravelFeasible) {
        isRecommended = true;
        fitScore -= 5;
        explanation = `Partially fits window with ~${usableEventMinutes} mins usable session time (${commuteMins} min travel via ${travelMode}).`;
      } else {
        isRecommended = false;
        fitScore = Math.max(20, fitScore - 25);
        if (!isTravelFeasible || commuteMins * 2 >= windowDuration) {
          explanation = `✕ Does not fit: ${commuteMins} min travel exceeds your available time buffer.`;
          conflictWarning = `Long commute: ${distanceKm} km from ${studentLocation}.`;
        } else {
          explanation = `✕ Does not fit: event schedule does not align with your free window.`;
          conflictWarning = `Tight window after ${commuteMins} mins commute from ${studentLocation}.`;
        }
      }

      // Format nice display string: e.g. "3:15 PM – 4:45 PM"
      const startH = eventStart.getUTCHours() % 12 || 12;
      const startM = eventStart.getUTCMinutes().toString().padStart(2, '0');
      const startAmPm = eventStart.getUTCHours() >= 12 ? 'PM' : 'AM';

      const endH = eventEnd.getUTCHours() % 12 || 12;
      const endM = eventEnd.getUTCMinutes().toString().padStart(2, '0');
      const endAmPm = eventEnd.getUTCHours() >= 12 ? 'PM' : 'AM';

      const timeWindowDisplay = `${startH}:${startM} ${startAmPm} – ${endH}:${endM} ${endAmPm}`;

      recommendations.push({
        event: ev,
        fitScore: Math.min(99, Math.max(20, fitScore)),
        timeWindowDisplay,
        durationMinutes: evDuration,
        commuteEstimateMinutes: commuteMins,
        distanceKm,
        commuteTransitMode: travelMode,
        isRecommended,
        explanation,
        conflictWarning,
        isPerfectWindow
      });
    }

    // Sort by recommended first, then fit score
    return recommendations.sort((a, b) => {
      if (a.isRecommended && !b.isRecommended) return -1;
      if (!a.isRecommended && b.isRecommended) return 1;
      return b.fitScore - a.fitScore;
    });
  }
}
