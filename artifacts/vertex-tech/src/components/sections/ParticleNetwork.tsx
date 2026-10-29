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
const MOBILE_BREAKPOINT = 768;
const TOTAL_DESKTOP = 120;
const TOTAL_MOBILE = 36;
const NODE_COUNT_DESKTOP = 22;
const NODE_COUNT_MOBILE = 7; // misma proporción nodo/partícula que en desktop
const CONNECT_DIST = 180;

// El chequeo de distancia entre partículas es O(n²) y cada nodo dibuja 3
// gradientes radiales, así que en móvil (pantallas <768px) se reduce el
// total para no saturar la GPU/batería en gama baja.
// Recibe el ancho ya leído en init(): volver a leer window.innerWidth justo
// después de escribir el tamaño del canvas puede forzar un reflow.
function getParticleCounts(width: number) {
  const isMobile = width < MOBILE_BREAKPOINT;
  return {
    total: isMobile ? TOTAL_MOBILE : TOTAL_DESKTOP,
    nodeCount: isMobile ? NODE_COUNT_MOBILE : NODE_COUNT_DESKTOP,
  };
}

export function ParticleNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf: number;
    let W = 0,
      H = 0;
    let particles: Particle[] = [];

    const init = () => {
      // Capado a 2x: mismo criterio que WireframeCube — el coste de
      // rasterizar el canvas crece con el cuadrado del DPR.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const { total, nodeCount } = getParticleCounts(W);
      particles = Array.from({ length: total }, (_, i) => {
        const isNode = i < nodeCount;
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

    const drawGlow = (
      x: number,
      y: number,
      r: number,
      color: string,
      a: number,
    ) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color.replace(")", `,${a})`).replace("rgb", "rgba"));
      g.addColorStop(1, color.replace(")", ",0)").replace("rgb", "rgba"));
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = g;
      ctx.fill();
    };

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const frame = () => {
      // paint background
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      // update & step (solo si no hay preferencia de movimiento reducido)
      if (!prefersReducedMotion) {
        for (const p of particles) {
          p.x += p.vx;
          p.y += p.vy;
          p.pulse += p.pulseSpeed;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
      }

      // draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < CONNECT_DIST) {
            // Opacidad atenuada a ~18% para textura sutil sin competir con el texto
            const opacity = (1 - d / CONNECT_DIST) * 0.18;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(82,153,255,${opacity.toFixed(3)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // draw particles
      for (const p of particles) {
        const scale = p.isNode ? 1 + Math.sin(p.pulse) * 0.3 : 1;
        const r = p.r * scale;

        if (p.isNode) {
          // outermost atmospheric glow atenuado
          const g3 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 8);
          g3.addColorStop(0, `rgba(59,130,246,0.06)`);
          g3.addColorStop(1, `rgba(59,130,246,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 8, 0, Math.PI * 2);
          ctx.fillStyle = g3;
          ctx.fill();

          // mid glow atenuado
          const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3.5);
          g2.addColorStop(0, `rgba(100,180,255,0.22)`);
          g2.addColorStop(1, `rgba(59,130,246,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3.5, 0, Math.PI * 2);
          ctx.fillStyle = g2;
          ctx.fill();

          // inner dot sutil
          const g1 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.5);
          g1.addColorStop(0, `rgba(255,255,255,0.55)`);
          g1.addColorStop(0.4, `rgba(150,210,255,0.3)`);
          g1.addColorStop(1, `rgba(59,130,246,0)`);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = g1;
          ctx.fill();
        } else {
          // regular particle — punto suave no intrusivo
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 0.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(120,180,255,${(p.alpha * 0.22).toFixed(2)})`;
          ctx.fill();
        }
      }

      if (!prefersReducedMotion) {
        raf = requestAnimationFrame(frame);
      }
    };

    const onResize = () => {
      init();
      frame();
    };
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
      aria-hidden="true"
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
