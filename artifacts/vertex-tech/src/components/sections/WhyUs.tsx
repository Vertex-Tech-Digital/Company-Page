import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function WhyUs() {
  const { t } = useLanguage();
  const benefits = [0, 1, 2, 3, 4].map((i) => t(`whyus.${i}`));

  return (
    <section className="py-24 bg-card/30 border-y border-border/50 relative z-10">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2
              className="text-3xl md:text-4xl font-bold text-white mb-4"
              data-testid="whyus-title"
            >
              {t("whyus.title")}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-4 p-4 rounded-xl bg-background/50 border border-border/50 hover:border-primary/30 transition-colors"
                data-testid={`whyus-item-${index}`}
              >
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                <span className="text-white font-medium">{benefit}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
