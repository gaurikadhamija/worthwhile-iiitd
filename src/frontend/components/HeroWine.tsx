import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowRight, Sliders, Clock, ShieldCheck, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useApp } from '../context/AppContext.js';
import { RelevanceScoreRing } from './RelevanceScoreRing.js';

interface SpotlightSlide {
  id: string;
  badge: string;
  tier: string;
  title: string;
  tagline: string;
  category: string;
  venue: string;
  time: string;
  score: number;
  skills: string[];
  attendeeEvidence: string;
  image: string;
  alt: string;
}

const SPOTLIGHT_SLIDES: SpotlightSlide[] = [
  {
    id: 'evt_robotics_ros2_lab',
    badge: 'Highest Recommended Fit',
    tier: 'Tier 1 Match',
    title: 'Hands-on ROS2 & Real-Time LiDAR SLAM Mapping',
    tagline: 'Program physical TurtleBot4 rovers through indoor occupancy grid mapping in the Advanced Robotics Lab.',
    category: 'Workshops',
    venue: 'Turing Hall, IIIT Delhi',
    time: 'Thursday, 3:00 PM – 5:30 PM',
    score: 94,
    skills: ['ROS2 Humble', 'Nav2', 'Occupancy Grids'],
    attendeeEvidence: '92% verified by 24 checked-in attendees',
    image: '/src/assets/images/campus_tech_salon_1791739518311.jpg',
    alt: 'Hands-on ROS2 and SLAM Workshop in Turing Hall'
  },
  {
    id: 'evt_genai_llm_agents',
    badge: 'High Impact Workshop',
    tier: 'Tier 1 Match',
    title: 'Autonomous Generative AI & Multi-Agent Loops',
    tagline: 'Build production vector retrieval pipelines, structured tool-calling, and LangGraph agent loops with industry leads.',
    category: 'Workshops',
    venue: 'Bharti Hall, IIT Delhi',
    time: 'Friday, 3:15 PM – 5:15 PM',
    score: 96,
    skills: ['Gemini 2.5 API', 'LangGraph', 'Function Calling'],
    attendeeEvidence: '96% verified by 68 checked-in attendees',
    image: '/src/assets/images/student_workshop_1791739542898.jpg',
    alt: 'Students collaborating in an interactive AI workshop'
  },
  {
    id: 'evt_startup_pitch_mixer',
    badge: 'Founder & Venture Spotlight',
    tier: 'Tier 1 Match',
    title: 'Founders & Angel Pitch Mixer: Fall Cohort Demo',
    tagline: '12 student ventures pitch for $50k in nondilutive micro-grants in front of Silicon Valley angels on the terrace.',
    category: 'Networking',
    venue: 'Terrace Amphitheatre, IHC Lodhi',
    time: 'Saturday, 4:00 PM – 6:00 PM',
    score: 91,
    skills: ['Pitch Decks', 'Venture Capital', 'Angel Co-founders'],
    attendeeEvidence: '89% verified by 52 founders and scouts',
    image: '/src/assets/images/campus_quad_arch_1791739530548.jpg',
    alt: 'Campus architectural courtyard and evening mixer space'
  },
  {
    id: 'evt_hft_quant_trading',
    badge: 'Competitive Finance Clinic',
    tier: 'Tier 1 Match',
    title: 'HFT Order Books & Algorithmic Market Making',
    tagline: 'Simulate limit order book dynamics and latency arbitrage strategies in high-frequency trading simulations.',
    category: 'Career Events',
    venue: 'Auditorium 2, NSUT Dwarka',
    time: 'Thursday, 6:00 PM – 8:00 PM',
    score: 93,
    skills: ['Python', 'Order Book Dynamics', 'Backtesting'],
    attendeeEvidence: '95% verified by 36 engineering attendees',
    image: '/src/assets/images/worthwhile_coffee_preview_1791446958386.jpg',
    alt: 'Evening campus lecture hall with students at work'
  }
];

export const HeroWine: React.FC = () => {
  const { navigateTo, setIsGoalsModalOpen } = useApp();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToSlide = useCallback((newIndex: number, dir: 'next' | 'prev') => {
    if (isTransitioning) return;
    setDirection(dir);
    setIsTransitioning(true);
    setCurrentIndex(newIndex);
    setTimeout(() => {
      setIsTransitioning(false);
    }, 450);
  }, [isTransitioning]);

  const handleNext = useCallback(() => {
    const nextIdx = (currentIndex + 1) % SPOTLIGHT_SLIDES.length;
    goToSlide(nextIdx, 'next');
  }, [currentIndex, goToSlide]);

  const handlePrev = useCallback(() => {
    const prevIdx = (currentIndex - 1 + SPOTLIGHT_SLIDES.length) % SPOTLIGHT_SLIDES.length;
    goToSlide(prevIdx, 'prev');
  }, [currentIndex, goToSlide]);

  // Autoplay cycle
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      handleNext();
    }, 5500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, handleNext]);

  // Touch gesture support (swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    setTouchStartX(null);
  };

  const currentSlide = SPOTLIGHT_SLIDES[currentIndex];

  return (
    <section className="relative border-b border-[#E2D7C8] bg-transparent pt-12 pb-16 lg:pt-16 lg:pb-20 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Editorial 2-Column Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Column 1: Editorial Intent & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            
            {/* Curatorial Kicker */}
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#5B2435] font-bold mb-4">
              <span>Campus Decision Intelligence</span>
              <span aria-hidden="true" className="text-[#B78A4A]">/</span>
              <span>Autumn Term 2026</span>
            </div>

            {/* High-Contrast Display Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-[#241410] leading-[1.08] tracking-tight">
              The right events.<br className="hidden sm:inline" />
              At the right time.<br className="hidden sm:inline" />
              <span className="italic font-normal text-[#5B2435]">For your goals.</span>
            </h1>

            {/* High-Contrast Pitch / Deck (WCAG AAA compliant: 7.5:1 on ivory) */}
            <p className="text-base sm:text-lg text-[#4A3830] mt-5 max-w-2xl leading-relaxed font-normal">
              WorthWhile helps students discover, compare, and choose the most relevant campus events based on your semester priorities, available time, and verified peer evidence.
            </p>

            {/* Quick Actions */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  const el = document.getElementById('discover-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-5 py-3 rounded-lg bg-[#5B2435] text-[#FFFDF8] text-xs font-bold uppercase tracking-wider hover:bg-[#3F1723] shadow-md flex items-center gap-2 transition-transform active:scale-98 cursor-pointer"
              >
                <span>Browse Curated Catalog</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => navigateTo('freetime')}
                className="px-5 py-3 rounded-lg bg-[#FFFDF8] border border-[#D5C7B5] text-[#241410] text-xs font-bold uppercase tracking-wider hover:bg-[#F8F4EC] transition-colors flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-[#5B2435]" />
                <span>"I Have 2 Hours Free"</span>
              </button>

              <button
                onClick={() => setIsGoalsModalOpen(true)}
                className="px-4 py-3 rounded-lg text-xs font-bold text-[#30231F] hover:text-[#5B2435] hover:bg-[#EFE5D5]/80 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-[#5B2435]" />
                <span>Adjust Semester Goals</span>
              </button>
            </div>

            {/* Operational Utility Strip (Solid high contrast numbers & labels) */}
            <div className="mt-12 pt-6 border-t border-[#E2D7C8] grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <span className="block font-serif text-3xl font-bold text-[#241410] tabular-nums">21</span>
                <span className="text-[11px] uppercase tracking-wider text-[#4A3830] font-bold">Curated Sessions</span>
              </div>
              <div>
                <span className="block font-serif text-3xl font-bold text-[#5B2435] tabular-nums">14</span>
                <span className="text-[11px] uppercase tracking-wider text-[#4A3830] font-bold">Delhi Venues</span>
              </div>
              <div>
                <span className="block font-serif text-3xl font-bold text-[#241410] tabular-nums">88%</span>
                <span className="text-[11px] uppercase tracking-wider text-[#4A3830] font-bold">Avg Goal Match</span>
              </div>
              <div>
                <span className="block font-serif text-3xl font-bold text-[#194D33] tabular-nums">100%</span>
                <span className="text-[11px] uppercase tracking-wider text-[#4A3830] font-bold">Verified Checks</span>
              </div>
            </div>
          </div>

          {/* Column 2: Curated Spotlight Story Carousel */}
          <div className="lg:col-span-5">
            <div 
              className="relative rounded-2xl border border-[#D5C7B5] bg-[#FFFDF8] p-6 shadow-md transition-all hover:border-[#5B2435] group"
              onMouseEnter={() => setIsPlaying(false)}
              onMouseLeave={() => setIsPlaying(true)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              
              {/* Header Ribbon with Carousel Navigation Controls */}
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2D7C8] text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[#5B2435] font-bold">
                    {currentSlide.badge}
                  </span>
                  <span className="text-[10px] font-mono text-[#8C7667] bg-[#F8F4EC] px-1.5 py-0.5 rounded border border-[#E2D7C8]">
                    {currentIndex + 1} / {SPOTLIGHT_SLIDES.length}
                  </span>
                </div>
                
                {/* Carousel Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    title={isPlaying ? "Pause autoplay" : "Resume autoplay"}
                    aria-label={isPlaying ? "Pause carousel autoplay" : "Resume carousel autoplay"}
                    className="p-1 rounded-md text-[#5B2435] hover:bg-[#F8F4EC] transition-colors cursor-pointer"
                  >
                    {isPlaying ? (
                      <Pause className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                  <button
                    onClick={handlePrev}
                    aria-label="Previous event spotlight"
                    className="p-1 rounded-md text-[#241410] hover:text-[#5B2435] hover:bg-[#F8F4EC] border border-[#E2D7C8] transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Next event spotlight"
                    className="p-1 rounded-md text-[#241410] hover:text-[#5B2435] hover:bg-[#F8F4EC] border border-[#E2D7C8] transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Cover Image Carousel Stage with Smooth Crossfade & Motion */}
              <div className="relative h-52 w-full rounded-xl overflow-hidden bg-[#241410] mb-4 select-none">
                {/* Carousel Slides */}
                {SPOTLIGHT_SLIDES.map((slide, idx) => {
                  const isActive = idx === currentIndex;
                  return (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 w-full h-full transition-all duration-500 ease-out ${
                        isActive
                          ? 'opacity-100 scale-100 z-10 pointer-events-auto'
                          : 'opacity-0 scale-105 z-0 pointer-events-none'
                      }`}
                      aria-hidden={!isActive}
                    >
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                      {/* Measured Dark Contrast Scrim for WCAG readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />
                      
                      {/* Category Pill Tag */}
                      <div className="absolute top-3 left-3 bg-[#241410]/80 backdrop-blur-xs border border-[#FFFDF8]/30 px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider text-[#FFFDF8]">
                        {slide.category}
                      </div>

                      {/* Venue & Time Overlay */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-[#FFFDF8] font-semibold drop-shadow-sm">
                        <div className="truncate mr-2">
                          <span>{slide.venue}</span>
                          <span className="mx-2 text-[#E2D7C8]/70">·</span>
                          <span>{slide.time}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Left/Right Click Nav Arrows over Image on Hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  aria-label="Previous slide"
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-[#5B2435] text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer shadow-md"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  aria-label="Next slide"
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/60 hover:bg-[#5B2435] text-white flex items-center justify-center backdrop-blur-xs border border-white/20 transition-all opacity-0 group-hover:opacity-100 active:scale-95 cursor-pointer shadow-md"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Autoplay Progress Bar Indicator */}
                {isPlaying && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
                    <div 
                      key={currentIndex}
                      className="h-full bg-[#B78A4A] transition-all duration-[5500ms] ease-linear"
                      style={{ width: '100%', animation: 'progressFill 5.5s linear' }}
                    />
                  </div>
                )}
              </div>

              {/* Carousel Pagination Dots */}
              <div className="flex items-center justify-center gap-2 mb-3">
                {SPOTLIGHT_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => goToSlide(idx, idx > currentIndex ? 'next' : 'prev')}
                    aria-label={`Go to spotlight slide ${idx + 1}: ${slide.title}`}
                    className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                      idx === currentIndex
                        ? 'w-6 bg-[#5B2435]'
                        : 'w-2 bg-[#D5C7B5] hover:bg-[#A89886]'
                    }`}
                  />
                ))}
              </div>

              {/* Title & Tagline with smooth transition */}
              <div className="min-h-[82px]">
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#241410] leading-snug transition-opacity duration-300">
                  {currentSlide.title}
                </h2>
                <p className="text-xs sm:text-sm text-[#4A3830] mt-1.5 leading-relaxed font-normal line-clamp-2">
                  {currentSlide.tagline}
                </p>
              </div>

              {/* Evidence Bar */}
              <div className="mt-4 pt-3 border-t border-[#E2D7C8] flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-[#194D33] font-bold">
                  <ShieldCheck className="w-4 h-4 text-[#194D33]" />
                  <span>{currentSlide.attendeeEvidence}</span>
                </div>
                <RelevanceScoreRing
                  score={currentSlide.score}
                  size="md"
                  onClick={() => navigateTo('event-details', currentSlide.id)}
                />
              </div>

              {/* Action */}
              <div className="mt-5">
                <button
                  onClick={() => navigateTo('event-details', currentSlide.id)}
                  className="w-full py-2.5 rounded-lg bg-[#F8F4EC] hover:bg-[#EFE5D5] border border-[#D5C7B5] text-xs font-bold uppercase tracking-wider text-[#241410] transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer group-hover:border-[#5B2435]"
                >
                  <span>Inspect Session & Claims</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#5B2435]" />
                </button>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
