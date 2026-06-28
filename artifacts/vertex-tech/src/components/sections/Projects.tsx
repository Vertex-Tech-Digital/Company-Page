import { motion } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";

const projectImages = [
  "/images/project-saas.png",
  "/images/project-analytics.png",
  "/images/project-integration.png",
];
const projectTags = [
  ["React", "Node.js", "PostgreSQL", "Cloud"],
  ["Next.js", "APIs", "WebSockets", "Charts"],
  ["Node.js", "REST APIs", "Cloud", "Mobile"],
];

export function Projects() {
  const { t } = useLanguage();

  const projects = [0, 1, 2].map((i) => ({
    title: t(`projects.${i}.title`),
    description: t(`projects.${i}.desc`),
    tags: projectTags[i],
    image: projectImages[i],
  }));

  return (
    <section id="proyectos" className="py-24 bg-card/20 relative z-10">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-4"
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-white inline-block relative"
            data-testid="projects-title"
          >
            {t("projects.title")}
            <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-primary rounded-full" />
          </h2>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-muted-foreground mt-6 mb-12"
        >
          {t("projects.subtitle")}
        </motion.p>

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
                
                <h3 className="text-xl font-bold text-white mb-3">
                  {project.title}
                </h3>
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
