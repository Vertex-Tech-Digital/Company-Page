import { useLanguage } from "@/context/LanguageContext";

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || "";

export function WhatsAppButton() {
  const { t } = useLanguage();

  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    t("whatsapp.message"),
  )}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("whatsapp.aria")}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 group pointer-events-none"
    >
      {/* Tooltip label */}
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-[#1a1a2e]/90 text-white text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap border border-white/10 shadow-lg">
        {t("whatsapp.cta")}
      </span>

      {/* Button circle */}
      <div className="pointer-events-auto relative w-14 h-14 flex items-center justify-center rounded-full bg-[#25D366] shadow-[0_4px_24px_0_rgba(37,211,102,0.45)] hover:shadow-[0_4px_32px_0_rgba(37,211,102,0.7)] transition-all duration-300 hover:scale-110">
        {/* Pulse ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
        {/* WhatsApp SVG icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          className="w-7 h-7 fill-white relative z-10"
          aria-hidden="true"
        >
          <path d="M16.003 2.667C8.637 2.667 2.667 8.637 2.667 16.003c0 2.37.637 4.687 1.847 6.72L2.667 29.333l6.81-1.787a13.29 13.29 0 0 0 6.526 1.717h.006c7.363 0 13.324-5.97 13.324-13.337C29.333 8.637 23.366 2.667 16.003 2.667zm0 24.44a11.07 11.07 0 0 1-5.643-1.547l-.403-.24-4.04 1.06 1.08-3.94-.264-.41A11.07 11.07 0 0 1 4.89 16c0-6.123 4.986-11.107 11.113-11.107S27.11 9.88 27.11 16.003c0 6.12-4.984 11.104-11.107 11.104zm6.093-8.317c-.334-.167-1.977-.977-2.284-1.087-.306-.11-.53-.167-.753.167-.224.334-.863 1.087-1.06 1.31-.196.224-.39.25-.724.083-.334-.167-1.41-.52-2.686-1.657-.993-.887-1.663-1.98-1.857-2.314-.194-.334-.02-.514.146-.68.15-.15.334-.39.5-.584.167-.194.223-.334.334-.557.11-.224.056-.418-.028-.585-.083-.167-.753-1.814-1.033-2.484-.27-.65-.547-.563-.753-.574l-.64-.01c-.224 0-.585.083-.89.418-.307.334-1.17 1.143-1.17 2.787 0 1.644 1.197 3.23 1.363 3.454.167.224 2.353 3.59 5.703 5.034.797.344 1.42.55 1.904.704.8.254 1.53.218 2.104.132.642-.096 1.977-.807 2.256-1.587.28-.78.28-1.45.196-1.587-.083-.14-.307-.224-.64-.39z" />
        </svg>
      </div>
    </a>
  );
}
