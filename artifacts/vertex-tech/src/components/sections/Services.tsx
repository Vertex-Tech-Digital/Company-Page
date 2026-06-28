import { motion } from "framer-motion";
import { Code2, Link, ShieldCheck, Bot } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const icons = [
  <Code2 className="w-10 h-10 text-primary" />,
  <Link className="w-10 h-10 text-primary" />,
  <ShieldCheck className="w-10 h-10 text-primary" />,
  <Bot className="w-10 h-10 text-primary" />,
];

export function Services() {
  const { t } = useLanguage();

  const services = [0, 1, 2, 3].map((i) => ({
    icon: icons[i],
    title: t(`services.${i}.title`),
    description: t(`services.${i}.desc`),
  }));

  return (
    <section id="servicios" className="py-24 relative z-10">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-white inline-block relative"
            data-testid="services-title"
          >
            {t("services.title")}
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full" />
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-7 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300"
              data-testid={`service-card-${index}`}
            >
              <div className="mb-5">{service.icon}</div>
              <h3 className="text-lg font-bold text-white mb-3 leading-snug">
                {service.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
