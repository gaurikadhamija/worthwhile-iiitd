/// <reference types="@types/google.maps" />
import React, { useEffect, useRef, useState } from 'react';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { MapPin, Navigation, ExternalLink, Sparkles, Clock, ArrowRight, Search, LocateFixed, Check } from 'lucide-react';
import { EventItem } from '../types/index.js';
import { RelevanceScoreRing } from './RelevanceScoreRing.js';
import { KNOWN_DELHI_LOCATIONS, CampusLocation, searchLocations } from '../services/locationService.js';
import { getCategoryTheme } from '../utils/categoryColors.js';

export interface MapSelectedLocation {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

interface Props {
  events: EventItem[];
  selectedEventId?: string | null;
  onSelectEvent?: (eventId: string) => void;
  selectedLocation?: MapSelectedLocation | null;
  onSelectLocation?: (location: MapSelectedLocation) => void;
  radiusMinutes?: number; // e.g. 10, 15, 20 for radius circle
  height?: string;
  zoom?: number;
  showSearch?: boolean;
  searchPlaceholder?: string;
}

// Warm cream / coffee editorial map style matching Reference 1
const COFFEE_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#F4EBDD' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#FFFDF8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#5A3828' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#2A1B16' }, { weight: 2 }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B1E23' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#E5DFC8' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#E8DCC8' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#D9CBB2' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#DFD1B8' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#CAB494' }]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#E8DCC8' }]
  },
  {
    featureType: 'transit.station',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6B1E23' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#D4DDD5' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#5A3828' }]
  }
];

export const DelhiGoogleMap: React.FC<Props> = ({
  events,
  selectedEventId,
  onSelectEvent,
  selectedLocation,
  onSelectLocation,
  radiusMinutes,
  height = '500px',
  zoom = 11,
  showSearch = true,
  searchPlaceholder = 'Search campus or any location (e.g. IGDTU, DTU, IIT Delhi)...'
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const eventMarkersRef = useRef<google.maps.Marker[]>([]);
  const locationMarkerRef = useRef<google.maps.Marker | null>(null);
  const radiusCircleRef = useRef<google.maps.Circle | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activePopupEvent, setActivePopupEvent] = useState<EventItem | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CampusLocation[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Default to Connaught Place / Central Delhi
  const defaultCenter = { lat: 28.6139, lng: 77.2090 };

  // 1. Initialize Map
  useEffect(() => {
    let isCancelled = false;
    const apiKey =
      (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY ||
      'AIzaSyDSJef7WYrQvQ5dNIUe8byVmh3nB1Vcivw';

    async function initMap() {
      try {
        setOptions({
          key: apiKey,
          v: 'weekly',
          libraries: ['places']
        });

        const { Map } = (await importLibrary('maps')) as { Map: typeof google.maps.Map };

        if (isCancelled || !mapContainerRef.current) return;

        const initialCenter = selectedLocation
          ? { lat: selectedLocation.lat, lng: selectedLocation.lng }
          : defaultCenter;

        const map = new Map(mapContainerRef.current, {
          center: initialCenter,
          zoom,
          styles: COFFEE_MAP_STYLES,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true
        });

        // Click map to select arbitrary location
        map.addListener('click', (e: google.maps.MapMouseEvent) => {
          if (!e.latLng || !onSelectLocation) return;
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          onSelectLocation({
            lat,
            lng,
            name: 'Selected Map Location',
            address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          });
        });

        mapInstanceRef.current = map;
        setMapLoaded(true);
      } catch (err: any) {
        if (!isCancelled) {
          console.warn('Google Maps load issue:', err);
          setLoadError(err.message || 'Unable to connect to Google Maps service.');
        }
      }
    }

    initMap();

    return () => {
      isCancelled = true;
      eventMarkersRef.current.forEach(m => m.setMap(null));
      eventMarkersRef.current = [];
      if (locationMarkerRef.current) locationMarkerRef.current.setMap(null);
      if (radiusCircleRef.current) radiusCircleRef.current.setMap(null);
    };
  }, []);

  // 2. Handle Selected Location Marker & Radius Circle
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof window === 'undefined' || !(window as any).google?.maps) return;

    const map = mapInstanceRef.current;
    const gmaps = (window as any).google.maps;

    // Remove old location marker
    if (locationMarkerRef.current) {
      locationMarkerRef.current.setMap(null);
      locationMarkerRef.current = null;
    }

    // Remove old circle
    if (radiusCircleRef.current) {
      radiusCircleRef.current.setMap(null);
      radiusCircleRef.current = null;
    }

    if (selectedLocation) {
      const pos = { lat: selectedLocation.lat, lng: selectedLocation.lng };

      // Prominent Location Pin
      const locIcon: google.maps.Symbol = {
        path: gmaps.SymbolPath.CIRCLE,
        fillColor: '#6B1E23',
        fillOpacity: 1,
        strokeColor: '#FFFDF8',
        strokeWeight: 3,
        scale: 9
      };

      const locMarker = new gmaps.Marker({
        position: pos,
        map,
        title: selectedLocation.name || 'Your Location',
        icon: locIcon,
        zIndex: 999
      });

      locationMarkerRef.current = locMarker;

      // Draw Radius Circle if provided (walking distance in meters)
      // 10 min walk: ~800m, 15 min walk: ~1500m, 20 min walk: ~2400m
      if (radiusMinutes) {
        const radiusMeters = radiusMinutes === 10 ? 800 : radiusMinutes === 15 ? 1500 : 2500;

        const circle = new gmaps.Circle({
          strokeColor: '#6B1E23',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#6B1E23',
          fillOpacity: 0.12,
          map,
          center: pos,
          radius: radiusMeters,
          zIndex: 1
        });

        radiusCircleRef.current = circle;
      }

      // Smooth pan to selected location
      map.panTo(pos);
    }
  }, [mapLoaded, selectedLocation, radiusMinutes]);

  // 3. Update Event Markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || typeof window === 'undefined' || !(window as any).google?.maps) return;

    const map = mapInstanceRef.current;
    const gmaps = (window as any).google.maps;

    // Clear previous markers
    eventMarkersRef.current.forEach(m => m.setMap(null));
    eventMarkersRef.current = [];

    events.forEach(ev => {
      if (!ev.venue || !ev.venue.latitude || !ev.venue.longitude) return;

      const isSelected = selectedEventId === ev.id;
      const theme = getCategoryTheme(ev.category);

      // Color-coded Event Marker Icon by Category
      const markerIcon: google.maps.Symbol = {
        path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z',
        fillColor: isSelected ? '#6B1E23' : theme.mapPinColor,
        fillOpacity: 1,
        strokeColor: '#FFFDF8',
        strokeWeight: 2.5,
        scale: isSelected ? 1.7 : 1.35,
        anchor: new gmaps.Point(12, 22)
      };

      const marker: google.maps.Marker = new gmaps.Marker({
        position: { lat: ev.venue.latitude, lng: ev.venue.longitude },
        map,
        title: `${ev.title} (${ev.category})`,
        icon: markerIcon,
        animation: isSelected ? gmaps.Animation.BOUNCE : undefined
      });

      marker.addListener('click', () => {
        setActivePopupEvent(ev);
        if (onSelectEvent) {
          onSelectEvent(ev.id);
        }
      });

      eventMarkersRef.current.push(marker);
    });

    if (selectedEventId) {
      const selectedEv = events.find(e => e.id === selectedEventId);
      if (selectedEv?.venue) {
        map.panTo({ lat: selectedEv.venue.latitude, lng: selectedEv.venue.longitude });
      }
    }
  }, [mapLoaded, events, selectedEventId]);

  // Handle Location Search Input
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (val.trim().length > 0) {
      const results = searchLocations(val);
      setSearchResults(results);
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
    }
  };

  const selectPlace = (loc: CampusLocation) => {
    setSearchQuery(loc.name);
    setIsSearchOpen(false);
    if (onSelectLocation) {
      onSelectLocation({
        lat: loc.lat,
        lng: loc.lng,
        name: loc.name,
        address: loc.address
      });
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-[#D8C5AE] shadow-md bg-[#FAF2E6]">
      
      {/* Search & Location Bar Overlay */}
      {showSearch && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto sm:w-96 z-30">
          <div className="relative">
            <div className="flex items-center gap-2 bg-[#FAF4EB]/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#D8C5AE] shadow-md">
              <Search className="w-4 h-4 text-[#6B1E23] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                onFocus={() => {
                  setSearchResults(searchLocations(searchQuery));
                  setIsSearchOpen(true);
                }}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent text-xs text-[#2A1B16] placeholder:text-[#5A3828]/60 focus:outline-none font-medium"
              />
              {selectedLocation && (
                <button
                  type="button"
                  onClick={() => {
                    if (mapInstanceRef.current) {
                      mapInstanceRef.current.panTo({ lat: selectedLocation.lat, lng: selectedLocation.lng });
                      mapInstanceRef.current.setZoom(13);
                    }
                  }}
                  title="Center on selected location"
                  className="p-1 rounded-md hover:bg-[#F4EBDD] text-[#6B1E23]"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Suggestions */}
            {isSearchOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#FFFDF8] border border-[#E8DCC8] rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-40">
                <div className="px-3 py-1.5 bg-[#F4EBDD]/60 text-[10px] font-bold text-[#5A3828] uppercase tracking-wider">
                  Campus & Metro Locations
                </div>
                {searchResults.map(loc => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => selectPlace(loc)}
                    className="w-full px-3 py-2 text-left hover:bg-[#F4EBDD] flex items-center justify-between text-xs transition-colors border-b border-[#F4EBDD]/50 last:border-0"
                  >
                    <div>
                      <div className="font-semibold text-[#2A1B16]">{loc.name}</div>
                      <div className="text-[11px] text-[#5A3828] truncate">{loc.zone}</div>
                    </div>
                    {selectedLocation?.lat === loc.lat && (
                      <Check className="w-3.5 h-3.5 text-[#6B1E23]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Google Map Container Element */}
      <div ref={mapContainerRef} style={{ width: '100%', height }} className="z-10" />

      {/* Active Selected Location Badge */}
      {selectedLocation && (
        <div className="absolute bottom-3 left-3 z-20 bg-[#FFFDF8]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E8DCC8] shadow-md flex items-center gap-2 text-xs font-semibold text-[#2A1B16]">
          <span className="w-2 h-2 rounded-full bg-[#6B1E23] animate-ping" />
          <span>Location: {selectedLocation.name || 'Selected Point'}</span>
          {radiusMinutes && (
            <span className="text-[11px] text-[#6B1E23] font-bold">
              ({radiusMinutes}m walk radius active)
            </span>
          )}
        </div>
      )}

      {/* Category Color Coding Legend on Map */}
      <div className="absolute top-3 right-3 z-20 hidden sm:flex items-center gap-2 bg-[#FFFDF8]/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#E8DCC8] shadow-md text-[11px] font-medium text-[#2A1B16]">
        <span className="text-[10px] uppercase font-bold text-[#5A3828] mr-0.5 tracking-wider">Pins:</span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#1B4D3E]" />
          <span>Career</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#6B1E23]" />
          <span>Hackathons</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#9A4318]" />
          <span>Workshops</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#B45309]" />
          <span>Networking</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#831843]" />
          <span>Cultural</span>
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-[#C2410C]" />
          <span>Comp</span>
        </span>
      </div>

      {/* Selected Marker Detail Card Overlay */}
      {activePopupEvent && (() => {
        const pTheme = getCategoryTheme(activePopupEvent.category);
        return (
          <div className="absolute bottom-4 right-4 max-w-sm z-30 bg-[#FFFDF8]/95 backdrop-blur-md border border-[#E8DCC8] rounded-2xl p-4 shadow-xl animate-fadeIn">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#6B1E23] mb-1">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-xs ${pTheme.badgeBg}`}>
                    {activePopupEvent.category}
                  </span>
                  <span className="text-[#5A3828]">·</span>
                  <span className="text-[#3E2318] font-medium">{activePopupEvent.venue?.campus_zone}</span>
                </div>
                <h4 className="font-serif font-bold text-base text-[#1E120D] line-clamp-1">
                  {activePopupEvent.title}
                </h4>
                <p className="text-xs text-[#3E2318] mt-0.5 line-clamp-1">
                  {activePopupEvent.venue?.name} · {activePopupEvent.venue?.address}
                </p>
              </div>

              <RelevanceScoreRing score={activePopupEvent.relevance.totalScore} size="sm" showLabel={false} />
            </div>

            <div className="mt-3 pt-3 border-t border-[#F4EBDD] flex items-center justify-between text-xs">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${activePopupEvent.venue?.latitude},${activePopupEvent.venue?.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[#6B1E23] hover:underline font-semibold"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Directions</span>
              </a>

              <button
                onClick={() => {
                  if (onSelectEvent) onSelectEvent(activePopupEvent.id);
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#2C0F12] text-[#FFFDF8] font-semibold text-xs hover:bg-[#6B1E23] transition-colors"
              >
                <span>View Details</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Fallback notification if external script error occurs */}
      {loadError && (
        <div className="absolute inset-0 z-40 bg-[#FFFDF8]/95 flex flex-col items-center justify-center p-6 text-center">
          <MapPin className="w-8 h-8 text-[#6B1E23] mb-2" />
          <h4 className="font-serif font-bold text-lg text-[#2A1B16]">Delhi Interactive Map</h4>
          <p className="text-xs text-[#5A3828] max-w-sm mt-1 mb-4">
            Viewing {events.length} campus event clusters across IIT Delhi, DU North, IGDTUW, NSUT, and DTU Rohini.
          </p>
          <div className="flex flex-wrap gap-2 justify-center max-w-lg">
            {events.slice(0, 6).map(e => (
              <button
                key={e.id}
                onClick={() => onSelectEvent && onSelectEvent(e.id)}
                className="px-3 py-1 rounded-lg border border-[#E8DCC8] bg-[#F4EBDD] text-xs font-semibold text-[#2A1B16] hover:border-[#6B1E23]"
              >
                📍 {e.venue?.name} ({e.relevance.totalScore}%)
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
