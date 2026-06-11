import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  isNode: boolean;
  pulse: number;
  pulseSpeed: number;
  alpha: number;
}

const BG = "hsl(222, 47%, 7%)";
const TOTAL = 120;
const NODE_COUNT = 22;
const CONNECT_DIST = 180;

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let W = 0, H = 0;
    let particles: Particle[] = [];

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      particles = Array.from({ length: TOTAL }, (_, i) => {
        const isNode = i < NODE_COUNT;
        return {
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * (isNode ? 0.18 : 0.35),
          vy: (Math.random() - 0.5) * (isNode ? 0.18 : 0.35),
          r: isNode ? 4.5 + Math.random() * 2 : 1.5 + Math.random() * 1.5,
          isNode,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: 0.02 + Math.random() * 0.02,
          alpha: 0.4 + Math.random() * 0.6,
        };
      });
    };

    const drawGlow = (x: number, y: number, r: number, color: string, a: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color.replace(")", `,${a})`).replace("rgb", "rgba"));
      g.addColorStop(1, color.replace(")", ",0)").replace("rgb", "rgba"));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    };

    const frame = () => {
      // paint background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // update & step
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += p.pulseSpeed;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
      }

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            const opacity = (1 - d / CONNECT_DIST) * 0.65;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(82,153,255,${opacity.toFixed(3)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      // draw particles
      for (const p of particles) {
        const scale = p.isNode ? 1 + Math.sin(p.pulse) * 0.3 : 1;
        const r = p.r * scale;

        if (p.isNode) {
          // outermost atmospheric glow
          const g3 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 12);
          g3.addColorStop(0, `rgba(59,130,246,0.18)`);
          g3.addColorStop(1, `rgba(59,130,246,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 12, 0, Math.PI * 2);
          ctx.fillStyle = g3;
          ctx.fill();

          // mid glow
          const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 5);
          g2.addColorStop(0, `rgba(100,180,255,0.75)`);
          g2.addColorStop(1, `rgba(59,130,246,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 5, 0, Math.PI * 2);
          ctx.fillStyle = g2;
          ctx.fill();

          // bright inner dot with glow
          const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 2);
          g1.addColorStop(0, `rgba(255,255,255,1)`);
          g1.addColorStop(0.4, `rgba(150,210,255,0.9)`);
          g1.addColorStop(1, `rgba(59,130,246,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 2, 0, Math.PI * 2);
          ctx.fillStyle = g1;
          ctx.fill();

        } else {
          // regular particle — small bright dot
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(120,180,255,${(p.alpha * 0.7).toFixed(2)})`;
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(frame);
    };

    const onResize = () => { init(); };
    window.addEventListener("resize", onResize);
    init();
    frame();

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        display: "block",
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
      }}
    />
  );
}
