import React, { useEffect, useRef } from 'react';

/**
 * WORTHWHILE — SIGNATURE WINE & CREAM ANIMATED BACKGROUND WITH FLOATING ORBS & ELEMENTS
 *
 * Implements a visibly moving wine-and-cream atmosphere with distinct, elegant floating elements:
 * - Fluid organic canvas wave & illumination currents
 * - Distinct, slowly floating translucent orbs & editorial motes in wine (#5B2435), rose (#C98F91), and warm brass (#B78A4A)
 * - Multi-directional drifting CSS ambient mesh
 * - Preserves all existing UI/UX, typography, buttons, cards, and strict readability
 */
export const CoffeeAtmosphere: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let isVisible = true;
    let lastTime = performance.now();
    let elapsed = 0;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isReducedMotion = mediaQuery.matches;

    const handleMotionChange = (e: MediaQueryListEvent) => {
      isReducedMotion = e.matches;
    };
    mediaQuery.addEventListener('change', handleMotionChange);

    let width = 0;
    let height = 0;

    // Moving elements definition (6 distinct floating celestial orbs with independent physical drift)
    interface FloatingElement {
      baseX: number; // 0 to 1 relative
      baseY: number; // 0 to 1 relative
      radiusRel: number;
      speedX: number;
      speedY: number;
      phase: number;
      colorStart: string;
      colorMid: string;
      colorEnd: string;
      opacity: number;
    }

    const elements: FloatingElement[] = [
      {
        baseX: 0.82,
        baseY: 0.18,
        radiusRel: 0.28,
        speedX: 0.45,
        speedY: 0.38,
        phase: 0.2,
        colorStart: 'rgba(91, 36, 53, 0.42)',   // Deep Wine
        colorMid: 'rgba(201, 143, 145, 0.25)',  // Muted Rose
        colorEnd: 'rgba(248, 244, 236, 0.0)',
        opacity: 0.95
      },
      {
        baseX: 0.15,
        baseY: 0.72,
        radiusRel: 0.26,
        speedX: 0.40,
        speedY: 0.48,
        phase: 1.8,
        colorStart: 'rgba(183, 138, 74, 0.38)',  // Warm Brass
        colorMid: 'rgba(201, 143, 145, 0.22)',   // Muted Rose
        colorEnd: 'rgba(248, 244, 236, 0.0)',
        opacity: 0.92
      },
      {
        baseX: 0.65,
        baseY: 0.78,
        radiusRel: 0.24,
        speedX: 0.52,
        speedY: 0.42,
        phase: 3.4,
        colorStart: 'rgba(91, 36, 53, 0.36)',   // Deep Wine
        colorMid: 'rgba(48, 35, 31, 0.20)',     // Dark Coffee
        colorEnd: 'rgba(248, 244, 236, 0.0)',
        opacity: 0.88
      },
      {
        baseX: 0.28,
        baseY: 0.28,
        radiusRel: 0.22,
        speedX: 0.38,
        speedY: 0.55,
        phase: 4.6,
        colorStart: 'rgba(201, 143, 145, 0.40)', // Muted Rose
        colorMid: 'rgba(183, 138, 74, 0.20)',   // Warm Brass
        colorEnd: 'rgba(248, 244, 236, 0.0)',
        opacity: 0.90
      },
      {
        baseX: 0.90,
        baseY: 0.55,
        radiusRel: 0.20,
        speedX: 0.48,
        speedY: 0.36,
        phase: 2.1,
        colorStart: 'rgba(183, 138, 74, 0.32)',  // Warm Brass
        colorMid: 'rgba(91, 36, 53, 0.22)',     // Deep Wine
        colorEnd: 'rgba(248, 244, 236, 0.0)',
        opacity: 0.85
      },
      {
        baseX: 0.48,
        baseY: 0.50,
        radiusRel: 0.22,
        speedX: 0.35,
        speedY: 0.45,
        phase: 5.2,
        colorStart: 'rgba(255, 253, 248, 0.80)', // Clean Cream luminous glow
        colorMid: 'rgba(248, 244, 236, 0.35)',
        colorEnd: 'rgba(248, 244, 236, 0.0)',
        opacity: 0.95
      }
    ];

    const resize = () => {
      if (!canvas) return;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.9;
      width = canvas.width = Math.max(720, Math.floor(w * scale));
      height = canvas.height = Math.max(480, Math.floor(h * scale));
    };

    resize();
    window.addEventListener('resize', resize);

    const handleVisibilityChange = () => {
      isVisible = !document.hidden;
      if (isVisible) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(render);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = (now: number) => {
      if (!isVisible) return;

      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Active, noticeable movement rate
      const speed = isReducedMotion ? 0.08 : 0.32;
      elapsed += delta * speed;
      const t = elapsed;

      // 1. Foundation: Clean Cream & Warm Ivory Gradient
      const baseGrad = ctx.createLinearGradient(
        width * (0.2 + 0.15 * Math.sin(t * 0.4)),
        0,
        width * (0.8 + 0.15 * Math.cos(t * 0.4)),
        height
      );
      baseGrad.addColorStop(0, '#FFFDF8');
      baseGrad.addColorStop(0.35 + 0.08 * Math.sin(t * 0.5), '#F8F4EC');
      baseGrad.addColorStop(0.70 + 0.08 * Math.cos(t * 0.45), '#F4ECE0');
      baseGrad.addColorStop(1, '#FFFDF8');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Continuous Organic Wave Streams
      // Upper Burgundy Ribbon
      ctx.beginPath();
      const wave1YStart = height * (0.14 + 0.15 * Math.sin(t * 0.8));
      ctx.moveTo(-50, wave1YStart);
      const cp1X = width * (0.28 + 0.08 * Math.sin(t * 0.7));
      const cp1Y = height * (0.05 + 0.16 * Math.cos(t * 0.75 + 0.8));
      const cp2X = width * (0.68 + 0.09 * Math.cos(t * 0.8 + 1.6));
      const cp2Y = height * (0.36 + 0.16 * Math.sin(t * 0.85 + 1.2));
      const wave1YEnd = height * (0.20 + 0.14 * Math.cos(t * 0.75 + 2.4));
      ctx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, width + 50, wave1YEnd);

      const cp3X = width * (0.72 + 0.08 * Math.cos(t * 0.8 + 2.0));
      const cp3Y = height * (0.62 + 0.16 * Math.cos(t * 0.85 + 2.0));
      const cp4X = width * (0.25 + 0.08 * Math.sin(t * 0.65 + 1.2));
      const cp4Y = height * (0.46 + 0.15 * Math.sin(t * 0.75 + 1.5));
      const wave1YBottom = height * (0.36 + 0.14 * Math.cos(t * 0.7));
      ctx.bezierCurveTo(cp3X, cp3Y, cp4X, cp4Y, -50, wave1YBottom);
      ctx.closePath();

      const wineStreamGrad = ctx.createLinearGradient(0, wave1YStart, width, height * 0.6);
      wineStreamGrad.addColorStop(0.0, 'rgba(91, 36, 53, 0.0)');
      wineStreamGrad.addColorStop(0.2, 'rgba(91, 36, 53, 0.38)');
      wineStreamGrad.addColorStop(0.55, 'rgba(201, 143, 145, 0.34)');
      wineStreamGrad.addColorStop(0.82, 'rgba(183, 138, 74, 0.22)');
      wineStreamGrad.addColorStop(1.0, 'rgba(91, 36, 53, 0.0)');
      ctx.fillStyle = wineStreamGrad;
      ctx.fill();

      // Lower Rose & Mocha Ribbon
      ctx.beginPath();
      const wave2YStart = height * (0.66 + 0.15 * Math.cos(t * 0.7 + 1.4));
      ctx.moveTo(-50, wave2YStart);
      const cp5X = width * (0.34 + 0.08 * Math.cos(t * 0.75 + 1.9));
      const cp5Y = height * (0.80 + 0.15 * Math.sin(t * 0.8 + 2.2));
      const cp6X = width * (0.74 + 0.08 * Math.sin(t * 0.7 + 3.0));
      const cp6Y = height * (0.52 + 0.15 * Math.cos(t * 0.75 + 3.1));
      const wave2YEnd = height * (0.72 + 0.14 * Math.sin(t * 0.8 + 0.8));
      ctx.bezierCurveTo(cp5X, cp5Y, cp6X, cp6Y, width + 50, wave2YEnd);

      const cp7X = width * (0.70 + 0.08 * Math.sin(t * 0.85 + 1.8));
      const cp7Y = height * (0.94 + 0.14 * Math.sin(t * 0.9 + 1.7));
      const cp8X = width * (0.26 + 0.08 * Math.cos(t * 0.65 + 0.9));
      const cp8Y = height * (0.86 + 0.14 * Math.cos(t * 0.7 + 0.9));
      const wave2YBottom = height * (0.82 + 0.14 * Math.sin(t * 0.75));
      ctx.bezierCurveTo(cp7X, cp7Y, cp8X, cp8Y, -50, wave2YBottom);
      ctx.closePath();

      const roseStreamGrad = ctx.createLinearGradient(width, height * 0.8, 0, height * 0.5);
      roseStreamGrad.addColorStop(0.0, 'rgba(201, 143, 145, 0.0)');
      roseStreamGrad.addColorStop(0.25, 'rgba(201, 143, 145, 0.32)');
      roseStreamGrad.addColorStop(0.58, 'rgba(91, 36, 53, 0.30)');
      roseStreamGrad.addColorStop(0.82, 'rgba(48, 35, 31, 0.16)');
      roseStreamGrad.addColorStop(1.0, 'rgba(248, 244, 236, 0.0)');
      ctx.fillStyle = roseStreamGrad;
      ctx.fill();

      // 3. MOVING ELEMENTS: Distinct Floating Orbs that drift across the canvas
      elements.forEach(elem => {
        const posX = width * (elem.baseX + 0.14 * Math.sin(t * elem.speedX + elem.phase));
        const posY = height * (elem.baseY + 0.14 * Math.cos(t * elem.speedY + elem.phase));
        const radius = Math.max(width, height) * elem.radiusRel;

        const orbGrad = ctx.createRadialGradient(posX, posY, 0, posX, posY, radius);
        orbGrad.addColorStop(0.0, elem.colorStart);
        orbGrad.addColorStop(0.45, elem.colorMid);
        orbGrad.addColorStop(1.0, elem.colorEnd);

        ctx.fillStyle = orbGrad;
        ctx.beginPath();
        ctx.arc(posX, posY, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      mediaQuery.removeEventListener('change', handleMotionChange);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none bg-[#F8F4EC]"
    >
      {/* 
        LAYER 1: Continuous Atmospheric Wine-to-Cream CSS Mesh Sweep
      */}
      <div className="absolute -inset-[30%] w-[160%] h-[160%] wine-ambient-mesh opacity-70 filter blur-[40px] transform-gpu pointer-events-none" />

      {/* 
        LAYER 2: Fluid Organic Wine Waves & Moving Floating Elements Canvas
      */}
      <canvas
        ref={canvasRef}
        className="absolute -inset-[10%] w-[120%] h-[120%] pointer-events-none filter blur-[32px] transform-gpu will-change-transform opacity-95 mix-blend-multiply"
      />

      {/* 
        LAYER 3: Visibly Moving Floating Celestial Orbs (CSS Hardware-Accelerated)
        Distinct floating orbs that gently glide and pulse across the viewport
      */}
      <div className="absolute top-[12%] right-[10%] w-72 h-72 rounded-full bg-gradient-to-br from-[#5B2435]/25 via-[#C98F91]/20 to-transparent filter blur-[28px] animate-float-slow pointer-events-none" />
      <div className="absolute bottom-[16%] left-[8%] w-80 h-80 rounded-full bg-gradient-to-tr from-[#B78A4A]/25 via-[#C98F91]/18 to-transparent filter blur-[32px] animate-float-reverse pointer-events-none" />
      <div className="absolute top-[48%] left-[22%] w-56 h-56 rounded-full bg-gradient-to-r from-[#C98F91]/22 to-[#5B2435]/15 filter blur-[24px] animate-float-drift pointer-events-none" />
      <div className="absolute bottom-[30%] right-[18%] w-64 h-64 rounded-full bg-gradient-to-tl from-[#5B2435]/20 via-[#B78A4A]/15 to-transparent filter blur-[30px] animate-float-slow pointer-events-none" />

      {/* 
        LAYER 4: Secondary Flowing Highlight Drift
      */}
      <div className="absolute -inset-[20%] w-[140%] h-[140%] wine-rose-drift opacity-45 filter blur-[50px] transform-gpu pointer-events-none mix-blend-overlay" />

      {/* 
        LAYER 5: Editorial Fine Paper Grain
      */}
      <div className="absolute inset-0 bg-editorial-grain opacity-40 pointer-events-none" />

      {/* 
        LAYER 6: Editorial Contrast Veil
      */}
      <div className="absolute inset-0 bg-[#F8F4EC]/10 pointer-events-none" />
    </div>
  );
};

export const SignatureWineCreamBackground = CoffeeAtmosphere;
