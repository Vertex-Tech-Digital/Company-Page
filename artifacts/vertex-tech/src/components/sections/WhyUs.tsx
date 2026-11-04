import { m } from "framer-motion";
import {
  CheckCircle2,
  FileCode2,
  MessageSquareCode,
  Layers,
  Rocket,
} from "lucide-react";

import { useLanguage } from "@/context/LanguageContext";

export function WhyUs() {
  const { t } = useLanguage();

  const items = [
    {
      icon: FileCode2,
      title: t("whyus.0"),
      desc: t("whyus.0.desc"),
    },
    {
      icon: MessageSquareCode,
      title: t("whyus.1"),
      desc: t("whyus.1.desc"),
    },
    {
      icon: Layers,
      title: t("whyus.2"),
      desc: t("whyus.2.desc"),
    },
    {
      icon: Rocket,
      title: t("whyus.3"),
      desc: t("whyus.3.desc"),
    },
  ];

  return (
    <section className="py-14 sm:py-20 lg:py-28 bg-slate-950/40 border-y border-white/5 relative z-10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <m.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10 sm:mb-16"
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4"
              data-testid="whyus-title"
            >
              {t("whyus.title")}
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-primary to-cyan-400 rounded-full mx-auto" />
          </m.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item, index) => (
              <m.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-black/20 flex flex-col group"
                data-testid={`whyus-item-${index}`}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5 text-primary group-hover:scale-105 group-hover:bg-primary/15 transition-all">
                  <item.icon className="w-6 h-6" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed mt-auto">
                  {item.desc}
                </p>
              </m.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
