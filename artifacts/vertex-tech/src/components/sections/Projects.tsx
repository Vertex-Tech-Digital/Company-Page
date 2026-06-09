import { motion } from "framer-motion";

const projects = [
  {
    title: "Plataformas de Gestión Empresarial y RRHH (SaaS)",
    tags: ["React", "Node.js", "PostgreSQL", "Cloud"],
    description: "Desarrollo de ecosistemas internos en la nube para la administración masiva de activos y personal con arquitectura reactiva.",
    image: "/images/project-saas.png",
  },
  {
    title: "Dashboards y Analítica en Tiempo Real",
    tags: ["Next.js", "APIs", "WebSockets", "Charts"],
    description: "Paneles de control optimizados para el procesamiento de datos a gran escala y visualización de métricas críticas de negocio.",
    image: "/images/project-analytics.png",
  },
  {
    title: "Automatización e Integración de Sistemas",
    tags: ["Node.js", "REST APIs", "Cloud", "Mobile"],
    description: "Migración de software heredado a infraestructuras API modernas y adaptadas para entornos móviles.",
    image: "/images/project-integration.png",
  },
];

export function Projects() {
  return (
    <section id="proyectos" className="py-24 bg-card/20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white inline-block relative" data-testid="projects-title">
            Proyectos Destacados
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full"></span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group rounded-2xl overflow-hidden border border-border bg-card/40 hover:border-primary/40 hover:shadow-[0_0_25px_rgba(59,130,246,0.1)] transition-all duration-300"
              data-testid={`project-card-${index}`}
            >
              <div className="aspect-video relative overflow-hidden bg-background">
                <img 
                  src={project.image} 
                  alt={project.title} 
                  className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-700" 
                />
              </div>
              <div className="p-6">
                <div className="flex flex-wrap gap-2 mb-4">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-xs font-mono px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                      {tag}
                    </span>
                  ))}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{project.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {project.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
