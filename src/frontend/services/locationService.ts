// Location & Campus Geographic Intelligence Service
export interface CampusLocation {
  id: string;
  name: string;
  fullName: string;
  zone: string;
  address: string;
  lat: number;
  lng: number;
  type: 'campus' | 'transit' | 'landmark';
}

export const KNOWN_DELHI_LOCATIONS: CampusLocation[] = [
  {
    id: 'loc_igdtuw',
    name: 'IGDTUW',
    fullName: 'Indira Gandhi Delhi Technical University for Women',
    zone: 'Old Delhi / Kashmere Gate',
    address: 'James Church Rd, Kashmere Gate, New Delhi 110006',
    lat: 28.6653,
    lng: 77.2324,
    type: 'campus'
  },
  {
    id: 'loc_dtu',
    name: 'DTU',
    fullName: 'Delhi Technological University (Formerly DCE)',
    zone: 'North West Delhi (Rohini / Bawana)',
    address: 'Shahbad Daulatpur, Bawana Road, Delhi 110042',
    lat: 28.7501,
    lng: 77.1177,
    type: 'campus'
  },
  {
    id: 'loc_iit_delhi',
    name: 'IIT Delhi',
    fullName: 'Indian Institute of Technology Delhi',
    zone: 'South Delhi (Hauz Khas)',
    address: 'IIT Delhi Main Campus, Hauz Khas, New Delhi 110016',
    lat: 28.5450,
    lng: 77.1926,
    type: 'campus'
  },
  {
    id: 'loc_du_north',
    name: 'Delhi University (North Campus)',
    fullName: 'University of Delhi North Campus',
    zone: 'North Delhi (Vishwa Vidyalaya)',
    address: 'University Enclave, Delhi University, Delhi 110007',
    lat: 28.6890,
    lng: 77.2090,
    type: 'campus'
  },
  {
    id: 'loc_nsut',
    name: 'NSUT',
    fullName: 'Netaji Subhas University of Technology',
    zone: 'West Delhi (Dwarka Sector 3)',
    address: 'Netaji Subhas University of Tech, Sector 3, Dwarka, New Delhi 110078',
    lat: 28.6080,
    lng: 77.0370,
    type: 'campus'
  },
  {
    id: 'loc_iiitd',
    name: 'IIIT Delhi',
    fullName: 'Indraprastha Institute of Information Technology Delhi',
    zone: 'South East Delhi (Okhla Phase III)',
    address: 'Okhla Industrial Estate, Phase III, Near Govind Puri, New Delhi 110020',
    lat: 28.5439,
    lng: 77.2724,
    type: 'campus'
  },
  {
    id: 'loc_jnu',
    name: 'JNU',
    fullName: 'Jawaharlal Nehru University',
    zone: 'South Delhi (New Mehrauli Road)',
    address: 'Jawaharlal Nehru University, New Delhi 110067',
    lat: 28.5400,
    lng: 77.1666,
    type: 'campus'
  },
  {
    id: 'loc_connaught_place',
    name: 'Connaught Place',
    fullName: 'Connaught Place (Rajiv Chowk Metro)',
    zone: 'Central Delhi',
    address: 'Connaught Place, New Delhi 110001',
    lat: 28.6315,
    lng: 77.2167,
    type: 'transit'
  },
  {
    id: 'loc_india_gate',
    name: 'India Gate',
    fullName: 'India Gate & Central Vista',
    zone: 'Central Delhi',
    address: 'Rajpath, India Gate, New Delhi 110001',
    lat: 28.6129,
    lng: 77.2295,
    type: 'landmark'
  },
  {
    id: 'loc_ihc_lodhi',
    name: 'India Habitat Centre',
    fullName: 'India Habitat Centre (Lodhi Road)',
    zone: 'Central Delhi',
    address: 'Lodhi Rd, Near Air Force Bal Bharati School, New Delhi 110003',
    lat: 28.5898,
    lng: 77.2250,
    type: 'landmark'
  },
  {
    id: 'loc_hauz_khas_metro',
    name: 'Hauz Khas Metro Station',
    fullName: 'Hauz Khas Interchange (Yellow & Magenta Line)',
    zone: 'South Delhi',
    address: 'Hauz Khas, New Delhi 110016',
    lat: 28.5431,
    lng: 77.2065,
    type: 'transit'
  },
  {
    id: 'loc_rohini_metro',
    name: 'Rohini West Metro Station',
    fullName: 'Rohini West (Red Line Metro)',
    zone: 'North West Delhi',
    address: 'Sector 10, Rohini, Delhi 110085',
    lat: 28.7150,
    lng: 77.1150,
    type: 'transit'
  }
];

// Haversine formula in kilometers
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

// Walking travel time calculation:
// Average walking pace: ~4.8 km/h = ~80 meters / minute = ~12.5 minutes per km
export function calculateWalkingMinutes(distanceKm: number): number {
  if (distanceKm <= 0.05) return 1;
  return Math.max(2, Math.round(distanceKm * 12.5));
}

// Multi-modal transit estimate (walking, e-rickshaw, or Delhi metro)
export function calculateTransitTravel(distanceKm: number): {
  minutes: number;
  mode: string;
  isWalkable: boolean;
} {
  if (distanceKm <= 1.2) {
    const mins = calculateWalkingMinutes(distanceKm);
    return {
      minutes: mins,
      mode: 'Walking',
      isWalkable: true
    };
  }

  if (distanceKm <= 3.5) {
    const mins = Math.round(6 + distanceKm * 3.5);
    return {
      minutes: mins,
      mode: 'E-Rickshaw / Walking',
      isWalkable: false
    };
  }

  // Delhi Metro or Cab
  const mins = Math.round(12 + distanceKm * 2.2);
  return {
    minutes: mins,
    mode: 'Delhi Metro',
    isWalkable: false
  };
}

// Search matching location helper
export function searchLocations(query: string): CampusLocation[] {
  const q = query.toLowerCase().trim();
  if (!q) return KNOWN_DELHI_LOCATIONS.slice(0, 6);

  return KNOWN_DELHI_LOCATIONS.filter(loc =>
    loc.name.toLowerCase().includes(q) ||
    loc.fullName.toLowerCase().includes(q) ||
    loc.zone.toLowerCase().includes(q) ||
    loc.address.toLowerCase().includes(q)
  );
}
