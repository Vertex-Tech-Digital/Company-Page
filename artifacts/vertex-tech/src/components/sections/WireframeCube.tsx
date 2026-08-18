import { useRef, useEffect } from "react";

const VERTICES: [number, number, number][] = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1,  1], [1, -1,  1], [1,  1,  1], [-1,  1,  1],
];

const EDGES: [number, number][] = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7],
];

const LABEL_DATA = [
  { text: "API_SYNC: 2.1ms",   anchor: [1.6, 1.4, 0] as [number,number,number] },
  { text: "QA_AUDIT: OK",      anchor: [-1.6, 0.4, 1.2] as [number,number,number] },
  { text: "DEV_DEPLOY: 110s",  anchor: [1.6, -1.0, -1.2] as [number,number,number] },
  { text: "UPTIME: 99.9%",     anchor: [-1.8, -1.4, 0] as [number,number,number] },
  { text: "BUILD: PASSED",     anchor: [0, 1.9, 0.4] as [number,number,number] },
];

function rotateX(v: [number,number,number], a: number): [number,number,number] {
  return [v[0], v[1]*Math.cos(a)-v[2]*Math.sin(a), v[1]*Math.sin(a)+v[2]*Math.cos(a)];
}
function rotateY(v: [number,number,number], a: number): [number,number,number] {
  return [v[0]*Math.cos(a)+v[2]*Math.sin(a), v[1], -v[0]*Math.sin(a)+v[2]*Math.cos(a)];
}
function project(v: [number,number,number], w: number, h: number): [number,number] {
  const scale = Math.min(w, h) * 0.22;
  const d = 5;
  const fov = d / (d + v[2]);
  return [w/2 + v[0]*scale*fov, h/2 - v[1]*scale*fov];
}

interface ParticleDatum {
  edgeIndex: number;
  progress: number;
  speed: number;
  isBlue: boolean;
}

export function WireframeCube() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameRef = useRef<number>(0);
  const angleYRef = useRef(0.4);
  const particlesRef = useRef<ParticleDatum[]>(
    EDGES.flatMap((_, ei) =>
      Array.from({ length: 3 }, () => ({
        edgeIndex: ei,
        progress: Math.random(),
        speed: 0.004 + Math.random() * 0.004,
        isBlue: Math.random() > 0.45,
      }))
    )
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Capado a 2x: en pantallas 3x el coste de rasterizar cada frame crece
    // con el cuadrado del DPR, sin ganancia visual perceptible en un patrón
    // de líneas finas.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      if (!canvas || !container) return;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx!.scale(dpr, dpr);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    // Evita quemar CPU dibujando 60fps mientras el cubo está fuera de
    // viewport (p. ej. tras hacer scroll más allá del hero).
    let isVisible = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        const wasVisible = isVisible;
        isVisible = entry.isIntersecting;
        if (isVisible && !wasVisible) {
          frameRef.current = requestAnimationFrame(draw);
        }
      },
      { threshold: 0 },
    );
    io.observe(container);

    const FIXED_TILT_X = 0.38;

    function draw() {
      if (!canvas || !ctx) return;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;

      ctx.clearRect(0, 0, W, H);
      angleYRef.current += 0.004;
      const ay = angleYRef.current;

      const rotated = VERTICES.map(v => rotateY(rotateX(v, FIXED_TILT_X), ay));
      const projected = rotated.map(v => project(v, W, H));

      // Sort edges by avg Z depth (painter's algorithm) for proper overlap
      const sortedEdges = [...EDGES]
        .map((e, i) => ({ e, i, z: (rotated[e[0]][2] + rotated[e[1]][2]) / 2 }))
        .sort((a, b) => a.z - b.z);

      // Draw edges
      ctx.lineCap = "round";
      for (const { e, z } of sortedEdges) {
        const [ax, ay2] = projected[e[0]];
        const [bx, by] = projected[e[1]];
        const depthFactor = (z + 1.8) / 3.6; // 0..1
        const alpha = 0.3 + depthFactor * 0.55;

        ctx.beginPath();
        ctx.moveTo(ax, ay2);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = `rgba(59,130,246,${alpha.toFixed(2)})`;
        ctx.lineWidth = 0.8 + depthFactor * 0.7;
        ctx.stroke();
      }

      // Draw particles
      for (const p of particlesRef.current) {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const edge = EDGES[p.edgeIndex];
        const vA = rotated[edge[0]];
        const vB = rotated[edge[1]];
        const t = p.progress;
        const v3: [number,number,number] = [
          vA[0]+(vB[0]-vA[0])*t,
          vA[1]+(vB[1]-vA[1])*t,
          vA[2]+(vB[2]-vA[2])*t,
        ];
        const [px, py] = project(v3, W, H);

        const depthFactor = (v3[2] + 1.8) / 3.6;
        const alpha = 0.5 + depthFactor * 0.5;
        const color = p.isBlue ? `59,130,246` : `139,92,246`;

        // glow
        ctx.beginPath();
        ctx.arc(px, py, 5, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${color},${(alpha*0.25).toFixed(2)})`;
        ctx.fill();
        // core
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI*2);
        ctx.fillStyle = `rgba(${color},${alpha.toFixed(2)})`;
        ctx.fill();
      }

      // Update floating label positions
      LABEL_DATA.forEach(({ anchor }, i) => {
        const el = labelRefs.current[i];
        if (!el) return;
        const rotA = rotateY(rotateX(anchor, FIXED_TILT_X), ay);
        const [lx, ly] = project(rotA, W, H);
        el.style.left = lx + "px";
        el.style.top = ly + "px";
        const depthFactor = (rotA[2] + 1.8) / 3.6;
        el.style.opacity = (0.6 + depthFactor * 0.4).toFixed(2);
      });

      if (isVisible) {
        frameRef.current = requestAnimationFrame(draw);
      }
    }

    frameRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(frameRef.current);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <div ref={containerRef} className="relative w-full h-[460px] mx-auto max-w-[520px]">
      <div className="absolute inset-0 bg-primary/8 blur-[90px] rounded-full pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0" />
      {LABEL_DATA.map((label, i) => (
        <div
          key={i}
          ref={el => { labelRefs.current[i] = el; }}
          className="absolute font-mono text-[10px] leading-none text-blue-400 whitespace-nowrap bg-background/90 border border-blue-500/30 px-2 py-1 rounded pointer-events-none"
          style={{ transform: "translate(-50%,-50%)", opacity: 0 }}
        >
          {label.text}
        </div>
      ))}
    </div>
  );
}
