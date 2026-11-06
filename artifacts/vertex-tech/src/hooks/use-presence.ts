import { useEffect, useState } from "react";

/**
 * Mantiene montado un elemento mientras dura su animación de salida, que es lo
 * que hacía AnimatePresence de framer-motion (VTD-50). Con `exiting` el
 * componente cambia su clase a `.vt-exit` (ver index.css); pasado `exitMs`
 * (igual o mayor que la duración de esa animación) el elemento se desmonta.
 */
export function usePresence(open: boolean, exitMs: number) {
  const [exited, setExited] = useState(!open);

  // Al abrir, o al reabrir durante la salida, el elemento deja de estar "salido".
  if (open && exited) setExited(false);

  useEffect(() => {
    if (open) return;
    const timer = setTimeout(() => setExited(true), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  const mounted = open || !exited;
  return { mounted, exiting: mounted && !open };
}
