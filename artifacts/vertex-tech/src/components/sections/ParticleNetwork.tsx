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

    let animationFrameId: number;
    let particles: Particle[] = [];
    const numParticles = 110;
    const connectionDistance = 160;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight * 2.5;
      initParticles();
    };

    const initParticles = () => {
      particles = Array.from({ length: numParticles }, (_, i) => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * (i < 12 ? 0.25 : 0.5),
        vy: (Math.random() - 0.5) * (i < 12 ? 0.25 : 0.5),
        radius: i < 12 ? 3.5 : Math.random() * 1 + 1.5,
        isNode: i < 12,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.02 + Math.random() * 0.02,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const pulseScale = p.isNode ? 1 + Math.sin(p.pulse) * 0.35 : 1;
        const r = p.radius * pulseScale;

        if (p.isNode) {
          const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
          glow.addColorStop(0, "rgba(59,130,246,0.55)");
          glow.addColorStop(1, "rgba(59,130,246,0)");
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
          ctx.fillStyle = glow;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fillStyle = p.isNode
          ? "rgba(99,168,255,0.95)"
          : "rgba(99,168,255,0.65)";
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDistance) {
            const opacity = (1 - dist / connectionDistance) * 0.45;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(59,130,246,${opacity.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("resize", resize);
    resize();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full z-0 pointer-events-none"
      style={{ opacity: 0.85 }}
    />
  );
}
