import { motion } from "framer-motion";
import { Code2, Link, Database } from "lucide-react";

const services = [
  {
    icon: <Code2 className="w-10 h-10 text-primary" />,
    title: "Desarrollo Web Fullstack",
    description: "Aplicaciones modernas, rápidas y escalables con React, Next.js y arquitecturas frontend de alto rendimiento.",
  },
  {
    icon: <Link className="w-10 h-10 text-primary" />,
    title: "APIs e Integraciones",
    description: "Diseño e implementación de APIs robustas, integraciones con servicios externos, automatizaciones y conexión entre sistemas.",
  },
  {
    icon: <Database className="w-10 h-10 text-primary" />,
    title: "Arquitectura Node.js",
    description: "Backends sólidos, seguros y preparados para crecer usando Node.js, bases de datos modernas y buenas prácticas de arquitectura.",
  },
];

export function Services() {
  return (
    <section id="servicios" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white inline-block relative" data-testid="services-title">
            Nuestros Servicios
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full"></span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all duration-300"
              data-testid={`service-card-${index}`}
            >
              <div className="mb-6">{service.icon}</div>
              <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
