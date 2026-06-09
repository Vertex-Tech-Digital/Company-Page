import { motion } from "framer-motion";

const steps = [
  {
    num: "01",
    title: "Análisis y Estrategia",
    description: "Definición de requisitos y diseño de la arquitectura técnica.",
  },
  {
    num: "02",
    title: "Desarrollo Ágil por Hitos",
    description: "Entregas funcionales constantes y código revisado en GitHub.",
  },
  {
    num: "03",
    title: "Control de Calidad Riguroso",
    description: "Pruebas integrales (QA Testing) para garantizar robustez.",
  },
  {
    num: "04",
    title: "Despliegue Continuo y Soporte",
    description: "Subida a la nube en servidores optimizados y mantenimiento técnico.",
  },
];

export function Methodology() {
  return (
    <section id="metodologia" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 max-w-3xl"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white inline-block relative mb-6" data-testid="methodology-title">
            Nuestra Metodología
            <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-primary rounded-full"></span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            En Vertex Tech trabajamos con una metodología ágil orientada a resultados. Dividimos cada proyecto en etapas claras, priorizamos comunicación constante, control de calidad riguroso y entregas puntuales. Nuestro objetivo no es solo construir software, sino crear soluciones estables, mantenibles y preparadas para escalar.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mt-16 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-8 left-10 right-10 h-[1px] bg-border/50"></div>
          
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
                <span className="text-xl font-bold text-primary font-mono">{step.num}</span>
                {/* Glow effect */}
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-2xl -z-10"></div>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
