const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";

/**
 * Enlace de WhatsApp con mensaje precargado.
 *
 * Centraliza el número y el formato para que el footer y la sección de
 * contacto compartan exactamente el mismo destino.
 */
export function getWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
