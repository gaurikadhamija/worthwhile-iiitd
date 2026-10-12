import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Navigation, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../services/api.js';
import { useApp } from '../context/AppContext.js';
import { RelevanceScoreRing } from '../components/RelevanceScoreRing.js';
import { DelhiGoogleMap, MapSelectedLocation } from '../components/DelhiGoogleMap.js';
import { KNOWN_DELHI_LOCATIONS } from '../services/locationService.js';
import { EventItem } from '../types/index.js';

export const FreeTimePage: React.FC = () => {
  const { navigateTo } = useApp();

  const [startHour, setStartHour] = useState(15); // 3:00 PM
  const [startMinute, setStartMinute] = useState(0);
  const [endHour, setEndHour] = useState(17); // 5:00 PM
  const [endMinute, setEndMinute] = useState(0);

  // Map-Based Starting Location (Defaults to Connaught Place)
  const [startingLocation, setStartingLocation] = useState<MapSelectedLocation>({
    lat: KNOWN_DELHI_LOCATIONS[7].lat,
    lng: KNOWN_DELHI_LOCATIONS[7].lng,
    name: KNOWN_DELHI_LOCATIONS[7].name,
    address: KNOWN_DELHI_LOCATIONS[7].address
  });

  const [allEvents, setAllEvents] = useState<EventItem[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getEvents({}).then(evs => setAllEvents(evs)).catch(err => console.warn(err));
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getFreeTimeRecommendations({
        startHour,
        startMinute,
        endHour,
        endMinute,
        originLat: startingLocation.lat,
        originLng: startingLocation.lng,
        originName: startingLocation.name
      });
      setRecommendations(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch free-time recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [startHour, startMinute, endHour, endMinute, startingLocation]);

  const totalMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  const durationHours = (totalMinutes / 60).toFixed(1);

  const fittingEvents = recommendations.filter(r => r.isRecommended);
  const conflictingEvents = recommendations.filter(r => !r.isRecommended);

  return (
    <div className="min-h-screen bg-transparent py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        
        {/* Editorial Header */}
        <div className="max-w-2xl mb-8">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-2">
            <Clock className="w-3.5 h-3.5" />
            <span>Time-Budget Feasibility Engine</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-[#241410] leading-tight">
            "I Have {durationHours} Hours Free"
          </h1>
          <p className="text-xs sm:text-sm text-[#4A3830] mt-2 leading-relaxed font-normal">
            Specify your schedule window and starting origin. WorthWhile calculates real transit times, campus buffers, and returns only what you can realistically attend.
          </p>
        </div>

        {/* Time Window Toolbar & Controls (Solid cream surfaces + high contrast controls) */}
        <div className="bg-[#FFFDF8] border border-[#E2D7C8] rounded-xl p-5 sm:p-6 shadow-xs mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            
            {/* Start Time */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#241410] block mb-2 font-mono">
                Free Starting At
              </label>
              <select
                value={startHour}
                onChange={e => setStartHour(Number(e.target.value))}
                className="w-full bg-[#FFFDF8] border border-[#D5C7B5] rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold text-[#241410] focus:outline-none focus:border-[#5B2435] shadow-2xs"
              >
                <option value={10}>10:00 AM</option>
                <option value={11}>11:00 AM</option>
                <option value={12}>12:00 PM</option>
                <option value={13}>1:00 PM</option>
                <option value={14}>2:00 PM</option>
                <option value={15}>3:00 PM</option>
                <option value={16}>4:00 PM</option>
                <option value={17}>5:00 PM</option>
                <option value={18}>6:00 PM</option>
              </select>
            </div>

            {/* End Time */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#241410] block mb-2 font-mono">
                Busy Again By
              </label>
              <select
                value={endHour}
                onChange={e => setEndHour(Number(e.target.value))}
                className="w-full bg-[#FFFDF8] border border-[#D5C7B5] rounded-lg px-3 py-2.5 text-xs sm:text-sm font-bold text-[#241410] focus:outline-none focus:border-[#5B2435] shadow-2xs"
              >
                <option value={14}>2:00 PM</option>
                <option value={15}>3:00 PM</option>
                <option value={16}>4:00 PM</option>
                <option value={17}>5:00 PM</option>
                <option value={18}>6:00 PM</option>
                <option value={19}>7:00 PM</option>
                <option value={20}>8:00 PM</option>
                <option value={21}>9:00 PM</option>
              </select>
            </div>

            {/* Current Starting Location Readout */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-[#241410] block mb-2 font-mono">
                Starting Origin
              </label>
              <div className="flex items-center gap-2 bg-[#FFFDF8] border border-[#D5C7B5] rounded-lg px-3 py-2.5 text-xs text-[#241410] shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-[#5B2435] shrink-0" />
                <span className="font-bold truncate">{startingLocation.name || 'Selected Map Location'}</span>
              </div>
            </div>

          </div>

          {/* Quick Preset Location Selector */}
          <div className="mt-4 pt-4 border-t border-[#E2D7C8] flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#4A3830] font-bold shrink-0 mr-1">
              Popular Origins:
            </span>
            {KNOWN_DELHI_LOCATIONS.slice(0, 7).map(loc => {
              const isSelected = startingLocation.name === loc.name;
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => setStartingLocation({
                    lat: loc.lat,
                    lng: loc.lng,
                    name: loc.name,
                    address: loc.address
                  })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-colors border ${
                    isSelected
                      ? 'bg-[#5B2435] text-[#FFFDF8] border-[#5B2435] shadow-xs'
                      : 'bg-[#FFFDF8] text-[#30231F] border-[#E2D7C8] hover:bg-[#F8F4EC]'
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Map & Timeline Grid */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-3 text-xs text-[#4A3830]">
            <div className="flex items-center gap-1.5 font-bold text-[#241410]">
              <MapPin className="w-3.5 h-3.5 text-[#5B2435]" />
              <span>Delhi Campus Commute Routing</span>
            </div>
            <span className="font-mono text-[11px] font-bold text-[#5B2435]">
              Active Origin: {startingLocation.name}
            </span>
          </div>

          <DelhiGoogleMap
            events={allEvents}
            selectedLocation={startingLocation}
            onSelectLocation={loc => setStartingLocation(loc)}
            height="320px"
            zoom={12}
            showSearch={true}
            searchPlaceholder="Search origin: Connaught Place, DTU, Hauz Khas, IIT Delhi..."
          />
        </div>

        {/* Recommendation Results List */}
        <div>
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-[#E2D7C8]">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#241410]">
              Sessions fitting your {durationHours}-hour window
            </h2>
            <span className="text-xs font-mono font-bold text-[#5B2435]">
              {fittingEvents.length} Feasible · {conflictingEvents.length} Overlapping
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-xl bg-[#FFFDF8] border border-[#E2D7C8] animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="py-12 text-center bg-[#FFFDF8] rounded-xl border border-[#E2D7C8] p-6">
              <p className="text-sm font-bold text-[#5B2435]">{error}</p>
              <button
                onClick={fetchRecommendations}
                className="mt-3 px-4 py-2 text-xs font-bold rounded-lg bg-[#5B2435] text-[#FFFDF8]"
              >
                Retry
              </button>
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-16 text-center bg-[#FFFDF8] rounded-xl border border-[#E2D7C8] p-8">
              <Clock className="w-8 h-8 text-[#665249]/60 mx-auto mb-2" />
              <h3 className="font-serif text-lg font-bold text-[#241410]">
                No campus sessions fit this specific window.
              </h3>
              <p className="text-xs text-[#4A3830] mt-1 max-w-sm mx-auto">
                Try widening your free-time window or moving your starting location closer to campus hubs.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendations.map(rec => {
                const ev = rec.event;
                const isFit = rec.isRecommended;

                return (
                  <div
                    key={ev.id}
                    className={`rounded-xl p-5 sm:p-6 transition-all border ${
                      isFit
                        ? 'bg-[#FFFDF8] border-[#E2D7C8] hover:border-[#5B2435] shadow-xs'
                        : 'bg-[#FDFBF7] border-[#E2D7C8]'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      
                      {/* Left: Info & Time Budget Breakdown */}
                      <div className="flex-1 space-y-2">
                        {/* High-Contrast Status Line */}
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                            isFit ? 'bg-[#DCFCE7] text-[#14532D] border border-[#86EFAC]' : 'bg-[#FEE2E2] text-[#991B1B] border border-[#FCA5A5]'
                          }`}>
                            {isFit ? '✓ Fits Window' : '✕ Exceeds Window'}
                          </span>
                          <span className="text-[#CFC1AF]">/</span>
                          <span className="text-[#241410] font-bold">{ev.category}</span>
                          <span className="text-[#CFC1AF]">/</span>
                          <span className="text-[#241410] font-bold">{rec.timeWindowDisplay}</span>
                        </div>

                        <h3 className="font-serif font-bold text-lg sm:text-xl text-[#241410]">
                          {ev.title}
                        </h3>

                        <p className="text-xs text-[#4A3830]">
                          {ev.venue?.name} · {ev.venue?.building} ({ev.venue?.campus_zone})
                        </p>

                        {/* Commute & Feasibility explanation */}
                        <div className="pt-2 text-xs flex flex-wrap items-center gap-2">
                          <span className="font-bold text-[#241410]">
                            ⏱ {rec.commuteEstimateMinutes}m commute ({rec.distanceKm} km via {rec.commuteTransitMode})
                          </span>
                          <span className="text-[#CFC1AF]">·</span>
                          <span className={`font-semibold ${isFit ? 'text-[#194D33]' : 'text-[#78350F]'}`}>
                            {rec.explanation}
                          </span>
                        </div>
                      </div>

                      {/* Right: Score Ring & Action */}
                      <div className="flex items-center gap-4 shrink-0 self-end md:self-center">
                        <RelevanceScoreRing score={rec.fitScore} size="md" />

                        <button
                          type="button"
                          onClick={() => navigateTo('event-details', ev.id)}
                          className="px-4 py-2.5 rounded-lg bg-[#5B2435] hover:bg-[#3F1723] text-[#FFFDF8] font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <span>View Details</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
