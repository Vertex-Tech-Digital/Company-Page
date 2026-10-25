import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop
 *
 * Restaura automáticamente el desplazamiento vertical a la coordenada (0, 0)
 * cada vez que cambia la ruta de la aplicación, excepto cuando la URL incluye
 * un hash/ancla específico (ej. #contacto, #servicios).
 */
export function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [location]);

  return null;
}
