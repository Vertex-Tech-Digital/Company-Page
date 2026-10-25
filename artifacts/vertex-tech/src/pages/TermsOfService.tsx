import { LegalLayout } from "@/components/layout/LegalLayout";
import {
  useLanguage,
  companyHolder,
  contactEmail,
} from "@/context/LanguageContext";

export default function TermsOfService() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <LegalLayout
        title="Terms of Service"
        subtitle="General terms and conditions governing the provision of software engineering and technology consulting services."
        lastUpdated="October 2026"
      >
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            1. Scope and Nature of Services
          </h2>
          <p>
            These Terms of Service govern the commercial relationship between{" "}
            {companyHolder} (operating as Vertex Tech Digital) and any client or
            user contracting our technological services, which include:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
            <li>
              Custom Fullstack Web and Cloud Application Development (SaaS).
            </li>
            <li>
              High-Performance API Design and Third-Party Systems Integration.
            </li>
            <li>
              Software Quality Engineering, Automated QA, and Code Audits.
            </li>
            <li>Business Automation and AI Integration Workflows.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            2. Free Technological Diagnostic Tool
          </h2>
          <p>
            The free diagnostic tool accessible on this website evaluates
            preliminary operational and architectural symptoms based on
            algorithmic heuristics. The report generated is strictly indicative
            and guidance-oriented. It does not constitute a legally binding
            technical guarantee until a formalized audit contract and functional
            specification are signed.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            3. Project Milestones and Intellectual Property
          </h2>
          <p>
            Development projects follow an agile milestone methodology. Unless
            expressly agreed otherwise in the individual service agreement:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
            <li>
              <strong className="text-slate-200">
                Ownership of Deliverables:
              </strong>{" "}
              Exclusive exploitation and economic rights to custom-developed
              code and digital assets are transferred to the client upon full
              payment of all agreed project milestones and invoices.
            </li>
            <li>
              <strong className="text-slate-200">Base Tooling:</strong> Vertex
              Tech Digital retains ownership of internal reusable utilities,
              open-source dependencies, and scaffolding libraries integrated
              into the final solution.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            4. Service Guarantees and Liability
          </h2>
          <p>
            Vertex Tech Digital guarantees that software delivered under formal
            contracts meets the functional specifications approved in the
            acceptance criteria. A post-deployment stabilization and warranty
            period applies as defined in each specific statement of work. Vertex
            Tech Digital shall not be liable for third-party API deprecations,
            external network outages, or unauthorized modifications made to the
            codebase by external developers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            5. Jurisdiction
          </h2>
          <p>
            These terms are governed by the laws of Spain. Any dispute arising
            in connection with the interpretation or performance of these terms
            shall be submitted to the competent courts of Spain.
          </p>
        </section>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      title="Términos y Condiciones de Uso"
      subtitle="Condiciones generales aplicables a la consulta y contratación de servicios de ingeniería de software y consultoría tecnológica."
      lastUpdated="Octubre 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          1. Ámbito de los Servicios
        </h2>
        <p>
          Las presentes Condiciones Generales regulan el acceso, navegación y
          contratación de los servicios profesionales prestados por{" "}
          {companyHolder} bajo la marca comercial Vertex Tech Digital,
          especializados en:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
          <li>
            Desarrollo de aplicaciones web a medida y soluciones SaaS en la
            nube.
          </li>
          <li>
            Diseño e interconexión de APIs y sincronización de sistemas
            heredados.
          </li>
          <li>
            Ingeniería de calidad técnica, testing automatizado (QA) y auditoría
            de código.
          </li>
          <li>
            Automatización de procesos empresariales e integración de modelos de
            Inteligencia Artificial.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          2. Diagnóstico Tecnológico Preliminar
        </h2>
        <p>
          La herramienta de Diagnóstico Tecnológico accesible a través de la web
          ofrece una evaluación estimativa basada en heurísticas de software y
          análisis de incidencias comunes. Los resultados emitidos tienen
          carácter exclusivamente orientativo y divulgativo, no constituyendo un
          dictamen vinculante ni compromiso de resultado hasta la suscripción
          formal de la correspondiente propuesta técnica y pliego de
          condiciones.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          3. Metodología Ágil, Propiedad del Código y Entregables
        </h2>
        <p>
          En Vertex Tech Digital operamos mediante desarrollo iterativo por
          hitos con repositorios auditables en GitHub y revisiones funcionales
          continuas.
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
          <li>
            <strong className="text-slate-200">
              Transferencia de Derechos:
            </strong>{" "}
            Salvo pacto en contrario especificado en el contrato particular, los
            derechos de explotación comercial sobre el código fuente
            desarrollado a medida se transmitirán al cliente de forma plena una
            vez satisfecho el pago íntegro de los honorarios pactados.
          </li>
          <li>
            <strong className="text-slate-200">
              Componentes Base y Librerías:
            </strong>{" "}
            Vertex Tech Digital conserva la titularidad de los frameworks base,
            módulos de infraestructura interna y librerías de código abierto
            empleadas para la aceleración del desarrollo.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          4. Garantía Técnica y Responsabilidad
        </h2>
        <p>
          Los proyectos entregados bajo contrato cuentan con un periodo de
          garantía técnica frente a defectos o discrepancias con respecto a los
          criterios de aceptación estipulados. La garantía no cubre fallos
          ocasionados por modificaciones unilaterales del código por parte del
          cliente, caídas generalizadas de proveedores cloud (AWS, Vercel,
          Neon), o cambios destructivos en APIs de terceros (Stripe, WhatsApp
          Cloud API, etc.).
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          5. Contacto y Consultas
        </h2>
        <p>
          Para cualquier consulta relativa a estas condiciones o para solicitar
          un acuerdo de confidencialidad (NDA) previo a la auditoría de su
          software, puede contactar con nuestro equipo técnico en:{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-primary hover:underline font-mono"
          >
            {contactEmail}
          </a>
          .
        </p>
      </section>
    </LegalLayout>
  );
}
