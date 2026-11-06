import { Code2, Network, ShieldCheck, Bot } from "lucide-react";
import { Reveal } from "@/components/common/Reveal";
import { useLanguage } from "@/context/LanguageContext";

const icons = [
  <Code2 className="w-7 h-7 text-primary" key="code" aria-hidden="true" />,
  <Network className="w-7 h-7 text-primary" key="network" aria-hidden="true" />,
  <ShieldCheck
    className="w-7 h-7 text-primary"
    key="shield"
    aria-hidden="true"
  />,
  <Bot className="w-7 h-7 text-primary" key="bot" aria-hidden="true" />,
];

export function Services() {
  const { t } = useLanguage();

  const services = [0, 1, 2, 3].map((i) => ({
    icon: icons[i],
    title: t(`services.${i}.title`),
    description: t(`services.${i}.desc`),
  }));

  return (
    <section id="servicios" className="py-14 sm:py-20 lg:py-28 relative z-10">
      <div className="container mx-auto px-4 sm:px-6">
        <Reveal y={20} className="mb-10 sm:mb-16 max-w-3xl">
          <h2
            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight"
            data-testid="services-title"
          >
            {t("services.title")}
          </h2>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {services.map((service, index) => (
            <Reveal
              key={index}
              y={30}
              delay={index * 0.1}
              className="group relative bg-slate-900/40 border border-white/10 backdrop-blur-md rounded-2xl p-5 sm:p-7 hover:border-primary/50 hover:-translate-y-1.5 transition-all duration-300 hover:shadow-[0_10px_35px_rgba(0,107,230,0.18)] flex flex-col justify-between"
              data-testid={`service-card-${index}`}
            >
              <div>
                <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 group-hover:scale-105 group-hover:bg-primary/20 transition-all duration-300 shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  {service.icon}
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-3 leading-snug group-hover:text-blue-400 transition-colors">
                  {service.title}
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
