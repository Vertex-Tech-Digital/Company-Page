import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ElementType,
  type HTMLAttributes,
} from "react";

// Un único IntersectionObserver para todos los bloques: la portada tiene unos 20.
const pending = new WeakMap<Element, () => void>();
let observer: IntersectionObserver | undefined;

function observeOnce(el: Element, onEnter: () => void) {
  observer ??= new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer?.unobserve(entry.target);
      pending.get(entry.target)?.();
      pending.delete(entry.target);
    }
  });
  pending.set(el, onEnter);
  observer.observe(el);
  return () => {
    observer?.unobserve(el);
    pending.delete(el);
  };
}

interface RevealProps extends HTMLAttributes<HTMLElement> {
  as?: "div" | "li";
  /** Desplazamiento inicial en px: de dónde viene el bloque al aparecer. */
  x?: number;
  y?: number;
  /** Retraso en segundos antes de aparecer. */
  delay?: number;
}

/**
 * Muestra su contenido (fundido + desplazamiento) la primera vez que entra en
 * pantalla. Equivale a `whileInView` con `viewport={{ once: true }}` de
 * framer-motion, pero el movimiento lo hace CSS (ver `.vt-reveal` en
 * index.css), así que la portada no necesita cargar framer-motion (VTD-50).
 */
export function Reveal({
  as: Tag = "div",
  x = 0,
  y = 0,
  delay = 0,
  className,
  style,
  ...props
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return observeOnce(el, () => setInView(true));
  }, []);

  // Con aserción: asignarlo con tipo declarado haría que TypeScript lo estreche
  // a "div" | "li" y exigiera un ref compatible con ambos a la vez.
  const Component = Tag as ElementType;

  return (
    <Component
      {...props}
      ref={ref}
      data-in={inView ? "" : undefined}
      className={className ? `vt-reveal ${className}` : "vt-reveal"}
      style={
        {
          "--vt-x": `${x}px`,
          "--vt-y": `${y}px`,
          "--vt-delay": `${delay}s`,
          ...style,
        } as CSSProperties
      }
    />
  );
}
