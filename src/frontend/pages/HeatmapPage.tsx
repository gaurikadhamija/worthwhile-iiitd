import React, { useState, useEffect, useMemo } from 'react';
import { MapPin, Navigation, Sparkles, Filter, Clock, X, ArrowRight, ExternalLink, Map as MapIcon, Layers, Search, Building2 } from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { RelevanceScoreRing } from '../components/RelevanceScoreRing.js';
import { DelhiGoogleMap, MapSelectedLocation } from '../components/DelhiGoogleMap.js';
import { EventItem } from '../types/index.js';
import { KNOWN_DELHI_LOCATIONS, calculateDistanceKm, calculateWalkingMinutes, CampusLocation } from '../services/locationService.js';

export const HeatmapPage: React.FC = () => {
  const { navigateTo } = useApp();

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Selected Location (Defaults to IIT Delhi Main Campus)
  const [currentLocation, setCurrentLocation] = useState<MapSelectedLocation>({
    lat: KNOWN_DELHI_LOCATIONS[2].lat,
    lng: KNOWN_DELHI_LOCATIONS[2].lng,
    name: KNOWN_DELHI_LOCATIONS[2].name,
    address: KNOWN_DELHI_LOCATIONS[2].address
  });

  const [maxMinutes, setMaxMinutes] = useState<number>(15);
  const [viewMode, setViewMode] = useState<'google_map' | 'campus_quad'>('google_map');

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const eventsData = await api.getEvents({});
        setAllEvents(eventsData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Calculate distance & walking minutes for each event from currentLocation
  const eventsWithDistance = useMemo(() => {
    return allEvents.map(ev => {
      if (!ev.venue || !ev.venue.latitude || !ev.venue.longitude) {
        return {
          ...ev,
          distanceKm: 999,
          walkingMinutes: 999
        };
      }

      const dist = calculateDistanceKm(
        currentLocation.lat,
        currentLocation.lng,
        ev.venue.latitude,
        ev.venue.longitude
      );
      const walkMins = calculateWalkingMinutes(dist);

      return {
        ...ev,
        distanceKm: dist,
        walkingMinutes: walkMins
      };
    });
  }, [allEvents, currentLocation]);

  const eventsInRadius = useMemo(() => {
    return eventsWithDistance.filter(e => e.walkingMinutes <= maxMinutes);
  }, [eventsWithDistance, maxMinutes]);

  const count10Min = useMemo(() => {
    return eventsWithDistance.filter(e => e.walkingMinutes <= 10).length;
  }, [eventsWithDistance]);

  const count15Min = useMemo(() => {
    return eventsWithDistance.filter(e => e.walkingMinutes <= 15).length;
  }, [eventsWithDistance]);

  const count20Min = useMemo(() => {
    return eventsWithDistance.filter(e => e.walkingMinutes <= 20).length;
  }, [eventsWithDistance]);

  const campusEvents = useMemo(() => {
    return eventsWithDistance
      .filter(e => e.distanceKm <= 2.5)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }, [eventsWithDistance]);

  const handleSelectCampusPreset = (loc: CampusLocation) => {
    setCurrentLocation({
      lat: loc.lat,
      lng: loc.lng,
      name: loc.name,
      address: loc.address
    });
  };

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-4 border-b border-[#E2D7C8] gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-2">
              <MapPin className="w-3.5 h-3.5" />
              <span>Campus Spatial Intelligence</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-serif font-bold text-[#241410]">
              Campus Event Map & Walking Heatmap
            </h1>
            <p className="text-xs sm:text-sm text-[#4A3830] mt-1 font-normal">
              Select any college or campus quad to evaluate real walking distance, venue density, and upcoming sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Segmented Control */}
            <div className="inline-flex rounded-lg bg-[#FFFDF8] border border-[#D5C7B5] p-1 shadow-xs">
              <button
                type="button"
                onClick={() => setViewMode('google_map')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  viewMode === 'google_map'
                    ? 'bg-[#5B2435] text-[#FFFDF8] shadow-xs'
                    : 'text-[#4A3830] hover:text-[#241410]'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Interactive Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('campus_quad')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                  viewMode === 'campus_quad'
                    ? 'bg-[#5B2435] text-[#FFFDF8] shadow-xs'
                    : 'text-[#4A3830] hover:text-[#241410]'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Campus Quad View</span>
              </button>
            </div>

            <span className="hidden sm:inline-block text-xs font-mono font-bold text-[#241410] bg-[#FFFDF8] px-3 py-1.5 rounded-lg border border-[#D5C7B5] shadow-2xs">
              {eventsInRadius.length} sessions within {maxMinutes}m walk
            </span>
          </div>
        </div>

        {/* Quick Campus Chips Selector */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[#4A3830] shrink-0 mr-1">
            Hubs:
          </span>
          {KNOWN_DELHI_LOCATIONS.slice(0, 7).map(loc => {
            const isSelected = currentLocation.name === loc.name;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => handleSelectCampusPreset(loc)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors border ${
                  isSelected
                    ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435] shadow-xs'
                    : 'bg-[#FFFDF8] text-[#241410] border-[#D5C7B5] hover:bg-[#F8F4EC]'
                }`}
              >
                {loc.name}
              </button>
            );
          })}
        </div>

        {/* Main Grid: Left Map / Quad (8 cols) & Right Venue Feed (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left: Interactive Map Container */}
          <div className="lg:col-span-8 bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 sm:p-6 shadow-xs overflow-hidden">
            
            {/* Filter controls over map */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-[#E2D7C8]">
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="font-bold text-[#4A3830]">Walking Radius:</span>
                
                <button
                  type="button"
                  onClick={() => setMaxMinutes(10)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1.5 border ${
                    maxMinutes === 10
                      ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435]'
                      : 'bg-[#F8F4EC] text-[#241410] border-[#D5C7B5] hover:bg-[#EFE5D5]'
                  }`}
                >
                  <span>10m</span>
                  <span className="text-[10px] font-mono">({count10Min})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMaxMinutes(15)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1.5 border ${
                    maxMinutes === 15
                      ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435]'
                      : 'bg-[#F8F4EC] text-[#241410] border-[#D5C7B5] hover:bg-[#EFE5D5]'
                  }`}
                >
                  <span>15m</span>
                  <span className="text-[10px] font-mono">({count15Min})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMaxMinutes(20)}
                  className={`px-2.5 py-1 rounded-md font-bold transition-colors flex items-center gap-1.5 border ${
                    maxMinutes === 20
                      ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435]'
                      : 'bg-[#F8F4EC] text-[#241410] border-[#D5C7B5] hover:bg-[#EFE5D5]'
                  }`}
                >
                  <span>20m</span>
                  <span className="text-[10px] font-mono">({count20Min})</span>
                </button>
              </div>

              <div className="text-xs text-[#4A3830] font-mono">
                Focus: <strong className="text-[#241410] font-bold">{currentLocation.name}</strong>
              </div>
            </div>

            {/* RENDER VIEW MODE */}
            {viewMode === 'google_map' ? (
              <DelhiGoogleMap
                events={allEvents}
                selectedEventId={selectedEventId}
                onSelectEvent={id => setSelectedEventId(id)}
                selectedLocation={currentLocation}
                onSelectLocation={loc => setCurrentLocation(loc)}
                radiusMinutes={maxMinutes}
                height="460px"
                zoom={12}
                showSearch={true}
                searchPlaceholder="Search campus or metro station..."
              />
            ) : (
              /* DYNAMIC CAMPUS QUAD VIEW */
              <div className="space-y-6">
                <div className="relative h-48 w-full rounded-xl overflow-hidden bg-[#E2D7C8]">
                  <img
                    src="/src/assets/images/campus_quad_arch_1791739530548.jpg"
                    alt="Campus Quad Architecture"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
                  <div className="absolute bottom-4 left-4 right-4 text-[#FFFDF8]">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#E7DED2] font-bold">
                      Campus Quad Dossier
                    </span>
                    <h3 className="font-serif text-2xl font-bold leading-tight text-[#FFFDF8]">
                      {currentLocation.name}
                    </h3>
                    <p className="text-xs text-[#E7DED2] mt-0.5 font-normal">
                      {currentLocation.address} · {campusEvents.length} Sessions at this Quad
                    </p>
                  </div>
                </div>

                {campusEvents.length === 0 ? (
                  <div className="py-10 text-center bg-[#F8F4EC] rounded-xl border border-[#E2D7C8] p-6">
                    <p className="font-serif text-base font-bold text-[#241410]">
                      No events currently scheduled near this quad.
                    </p>
                    <p className="text-xs text-[#4A3830] mt-1 max-w-md mx-auto font-normal">
                      Switch to IIT Delhi, DTU, or IGDTUW to explore active hubs and labs.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {campusEvents.map(ev => (
                      <div
                        key={ev.id}
                        onClick={() => navigateTo('event-details', ev.id)}
                        className="p-4 rounded-xl border border-[#E2D7C8] bg-[#FFFDF8] hover:border-[#5B2435] transition-colors cursor-pointer shadow-2xs"
                      >
                        <div className="flex items-center justify-between text-[11px] font-mono text-[#4A3830] mb-1">
                          <span className="font-bold">{ev.category}</span>
                          <span className="font-bold text-[#5B2435]">{ev.distanceKm.toFixed(1)} km walk</span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-[#241410] line-clamp-1">
                          {ev.title}
                        </h4>
                        <p className="text-xs text-[#4A3830] mt-1 line-clamp-2 font-normal">
                          {ev.tagline}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Venue Density & Upcoming Sessions Feed */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 shadow-xs">
              <h3 className="font-serif font-bold text-lg text-[#241410] mb-1">
                Walking Radius Feed
              </h3>
              <p className="text-xs text-[#4A3830] mb-4 font-normal">
                Within {maxMinutes} minutes walk of {currentLocation.name}.
              </p>

              <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                {eventsInRadius.length === 0 ? (
                  <p className="text-xs text-[#4A3830] py-4 text-center">
                    No sessions within a {maxMinutes}-minute walk. Try widening to 20m.
                  </p>
                ) : (
                  eventsInRadius.map(ev => (
                    <div
                      key={ev.id}
                      onClick={() => navigateTo('event-details', ev.id)}
                      className="p-3.5 rounded-lg border border-[#E2D7C8] bg-[#F8F4EC]/60 hover:bg-[#F8F4EC] transition-colors cursor-pointer shadow-2xs"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#4A3830] mb-1">
                        <span className="font-bold">{ev.venue?.name}</span>
                        <span className="font-bold text-[#5B2435]">{ev.walkingMinutes}m walk</span>
                      </div>
                      <h4 className="font-serif font-bold text-sm text-[#241410] line-clamp-1">
                        {ev.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-xs pt-2 border-t border-[#E2D7C8]">
                        <span className="text-[11px] text-[#4A3830] font-mono font-semibold">
                          {new Date(ev.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </span>
                        <RelevanceScoreRing score={ev.relevance.totalScore} size="sm" showLabel={false} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
