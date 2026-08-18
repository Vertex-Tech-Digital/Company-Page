import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

export function Methodology() {
  const { t } = useLanguage();

  const steps = [0, 1, 2, 3].map((i) => ({
    num: String(i + 1).padStart(2, "0"),
    title: t(`methodology.${i}.title`),
    description: t(`methodology.${i}.desc`),
  }));

  return (
    <section id="metodologia" className="py-24 relative z-10">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-3xl"
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-white inline-block relative mb-6"
            data-testid="methodology-title"
          >
            {t("methodology.title")}
            <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-primary rounded-full" />
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            {t("methodology.desc")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 relative">
          <div className="hidden lg:block absolute top-8 left-10 right-10 h-[1px] bg-border/50" />

          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative z-10"
              data-testid={`methodology-step-${index}`}
            >
              <div className="w-16 h-16 rounded-2xl bg-card border border-border/80 flex items-center justify-center mb-6 shadow-lg shadow-background relative">
                <span className="text-xl font-bold text-primary font-mono">
                  {step.num}
                </span>
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl -z-10" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
