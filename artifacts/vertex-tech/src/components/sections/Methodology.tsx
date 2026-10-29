import { m } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function Methodology() {
  const { t } = useLanguage();

  const steps = [0, 1, 2, 3].map((i) => ({
    num: String(i + 1).padStart(2, "0"),
    title: t(`methodology.${i}.title`),
    description: t(`methodology.${i}.desc`),
  }));

  return (
    <section id="metodologia" className="py-20 lg:py-28 relative z-10">
      <div className="container mx-auto px-6">
        <m.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 max-w-3xl"
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4"
            data-testid="methodology-title"
          >
            {t("methodology.title")}
          </h2>
          <div className="w-16 h-1 bg-gradient-to-r from-primary to-cyan-400 rounded-full mb-6" />
          <p className="text-lg text-slate-300 leading-relaxed">
            {t("methodology.desc")}
          </p>
        </m.div>

        <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mt-12 relative list-none p-0 m-0">
          {/* Connecting line on desktop */}
          <div
            className="hidden lg:block absolute top-12 left-12 right-12 h-[2px] bg-gradient-to-r from-primary/50 via-cyan-400/50 to-primary/50 -z-0 pointer-events-none"
            aria-hidden="true"
          />

          {steps.map((step, index) => (
            <m.li
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative z-10 flex flex-col h-full bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-2xl p-6 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300 shadow-lg shadow-black/20 group"
              data-testid={`methodology-step-${index}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-slate-950/90 border border-primary/30 flex items-center justify-center mb-6 shadow-md shadow-primary/10 relative group-hover:border-primary/60 transition-colors">
                <span className="text-xl font-bold text-primary font-mono tracking-tight">
                  {step.num}
                </span>
                <div className="absolute inset-0 bg-primary/20 blur-lg rounded-2xl -z-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 tracking-tight group-hover:text-blue-300 transition-colors">
                {step.title}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed mt-auto">
                {step.description}
              </p>
            </m.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
