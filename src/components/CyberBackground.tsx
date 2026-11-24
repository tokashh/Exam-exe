import React, { useEffect, useRef } from 'react';

interface CyberBackgroundProps {
  enabled: boolean;
  reducedMotion: boolean;
  bossAlert?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  char: string;
  alpha: number;
  isBinary: boolean;
  size: number;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({
  enabled,
  reducedMotion,
  bossAlert = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled || reducedMotion) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;
    const isMobile = width < 768;
    const count = isMobile ? 22 : 42;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener('resize', resize);

    const particles: Particle[] = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: -0.15 - Math.random() * 0.28,
      char: Math.random() > 0.5 ? '1' : '0',
      alpha: 0.08 + Math.random() * 0.2,
      isBinary: i % 2 === 0,
      size: 11 + Math.floor(Math.random() * 3),
    }));

    let lastTime = 0;
    const frameInterval = 1000 / 30; // 30fps cap for mobile battery optimization

    const render = (now: number) => {
      if (document.visibilityState === 'hidden') {
        animId = requestAnimationFrame(render);
        return;
      }

      if (now - lastTime < frameInterval) {
        animId = requestAnimationFrame(render);
        return;
      }
      lastTime = now;

      ctx.clearRect(0, 0, width, height);

      // Subtle animated grid
      const gridSize = 56;
      const offset = (now * 0.008) % gridSize;
      ctx.strokeStyle = bossAlert
        ? 'rgba(255, 98, 108, 0.05)'
        : 'rgba(90, 217, 245, 0.04)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      for (let x = 0; x < width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = offset; y < height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Update particles & draw node connections
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
        if (p.x < -20) p.x = width + 20;
        if (p.x > width + 20) p.x = -20;

        // Occasional node lines
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const distSq = dx * dx + dy * dy;
          if (distSq < 13000) {
            const lineAlpha = (1 - distSq / 13000) * 0.08;
            ctx.strokeStyle = bossAlert
              ? `rgba(255, 98, 108, ${lineAlpha})`
              : `rgba(117, 255, 174, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        if (p.isBinary) {
          ctx.font = `500 ${p.size}px "JetBrains Mono", monospace`;
          ctx.fillStyle = bossAlert
            ? `rgba(255, 98, 108, ${p.alpha})`
            : i % 4 === 0
              ? `rgba(90, 217, 245, ${p.alpha})`
              : `rgba(117, 255, 174, ${p.alpha})`;
          ctx.fillText(p.char, p.x, p.y);
        } else {
          ctx.fillStyle = bossAlert
            ? `rgba(255, 98, 108, ${p.alpha * 1.4})`
            : `rgba(90, 217, 245, ${p.alpha * 1.4})`;
          ctx.fillRect(p.x, p.y, 2, 2);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, [enabled, reducedMotion, bossAlert]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Soft ambient radial light */}
      <div
        className="absolute -top-40 left-1/2 h-[520px] w-[760px] -translate-x-1/2 rounded-full blur-3xl transition-colors duration-700"
        style={{
          background: bossAlert
            ? 'radial-gradient(circle, rgba(255,98,108,0.09) 0%, rgba(8,11,13,0) 70%)'
            : 'radial-gradient(circle, rgba(90,217,245,0.07) 0%, rgba(117,255,174,0.03) 45%, rgba(8,11,13,0) 72%)',
        }}
      />
      {enabled && !reducedMotion && (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
      {/* Subtle CRT scanlines */}
      <div className="crt-scanlines absolute inset-0 opacity-25" />
    </div>
  );
};
