import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isNode: boolean;
  pulse: number;
  pulseSpeed: number;
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let particles: Particle[] = [];
    const NUM = 90;
    const NODES = 18;
    const CONNECT = 170;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = window.innerWidth + "px";
      canvas.style.height = window.innerHeight + "px";
      ctx.scale(dpr, dpr);
      initParticles();
    };

    const W = () => canvas.width / (window.devicePixelRatio || 1);
    const H = () => canvas.height / (window.devicePixelRatio || 1);

    const initParticles = () => {
      const w = W(), h = H();
      particles = Array.from({ length: NUM }, (_, i) => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * (i < NODES ? 0.2 : 0.4),
        vy: (Math.random() - 0.5) * (i < NODES ? 0.2 : 0.4),
        radius: i < NODES ? 5 : Math.random() * 1.5 + 2,
        isNode: i < NODES,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.022 + Math.random() * 0.018,
      }));
    };

    const draw = () => {
      const w = W(), h = H();
      ctx.clearRect(0, 0, w, h);

      // connections first (below dots)
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECT) {
            const a = (1 - dist / CONNECT) * 0.6;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${a.toFixed(3)})`;
            ctx.lineWidth = 0.9;
            ctx.stroke();
          }
        }
      }

      // particles
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;

        const scale = p.isNode ? 1 + Math.sin(p.pulse) * 0.35 : 1;
        const r = p.radius * scale;

        if (p.isNode) {
          // large outer halo
          const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 7);
          g1.addColorStop(0, "rgba(59,130,246,0.35)");
          g1.addColorStop(1, "rgba(59,130,246,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 7, 0, Math.PI * 2);
          ctx.fillStyle = g1;
          ctx.fill();

          // mid glow ring
          const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.5);
          g2.addColorStop(0, "rgba(120,190,255,0.8)");
          g2.addColorStop(1, "rgba(59,130,246,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = g2;
          ctx.fill();
        }

        // core dot
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.isNode ? "rgba(180,220,255,1)" : "rgba(100,170,255,0.9)";
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, width: "100vw", height: "100vh" }}
    />
  );
}
