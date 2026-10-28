import { LegalLayout } from "@/components/layout/LegalLayout";
import {
  useLanguage,
  companyHolder,
  companyTaxId,
  contactEmail,
} from "@/context/LanguageContext";

export default function LegalNotice() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <LegalLayout
        title="Legal Notice"
        subtitle="General information and legal identification in accordance with Law 34/2002 (LSSI-CE)."
        lastUpdated="October 2026"
      >
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            1. Identification Details
          </h2>
          <p>
            In compliance with the duty of information established in Article 10
            of Law 34/2002, of July 11, on Information Society Services and
            Electronic Commerce (LSSI-CE), the identifying details of the entity
            operating this commercial presentation platform are set forth below:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground font-mono text-xs sm:text-sm">
            <li>
              <strong className="text-slate-200">Legal Name / Holder:</strong>{" "}
              {companyHolder}
            </li>
            <li>
              <strong className="text-slate-200">Tax ID (NIF/CIF):</strong>{" "}
              {companyTaxId}
            </li>
            <li>
              <strong className="text-slate-200">Commercial Brand:</strong>{" "}
              Vertex Tech Digital
            </li>
            <li>
              <strong className="text-slate-200">
                Official Contact Email:
              </strong>{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary hover:underline"
              >
                {contactEmail}
              </a>
            </li>
            <li>
              <strong className="text-slate-200">Primary Activity:</strong>{" "}
              Software development, technology consulting, QA testing
              engineering, and process automation.
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            2. Purpose and Scope of Application
          </h2>
          <p>
            This website has been designed to provide commercial, informational,
            and technological diagnostic information regarding custom software
            development and technological advisory services offered by Vertex
            Tech Digital. Access to and use of this website confers the status
            of user, implying full and unreserved acceptance of all provisions
            included in this Legal Notice.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            3. Intellectual and Industrial Property
          </h2>
          <p>
            The source code, graphic designs, algorithms, interface structures,
            wireframes, trademarks, logos, texts, illustrations, and all other
            elements on this website are the intellectual and industrial
            property of {companyHolder} or third parties who have authorized
            their use. Any total or partial reproduction, public distribution,
            or transformation without express written authorization is strictly
            prohibited.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            4. Disclaimer of Liability
          </h2>
          <p>
            Vertex Tech Digital shall not be held liable for potential damages
            resulting from technical interruptions, server outages, computer
            viruses, cyber attacks, or telecommunications failures beyond our
            reasonable control. Free technological diagnostic tools provide an
            initial technical guideline that does not substitute for a formal
            technical audit.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            5. Applicable Law and Jurisdiction
          </h2>
          <p>
            For the resolution of all disputes or questions related to this
            website or the activities developed herein, Spanish legislation
            shall apply, to which the parties expressly submit.
          </p>
        </section>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      title="Aviso Legal"
      subtitle="Información general e identificación del prestador del servicio conforme a la Ley 34/2002 (LSSI-CE)."
      lastUpdated="Octubre 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          1. Datos Identificativos del Responsable
        </h2>
        <p>
          En cumplimiento del deber de información establecido en el artículo 10
          de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la
          Información y del Comercio Electrónico (LSSI-CE), a continuación se
          detallan los datos identificativos del titular de este sitio web:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground font-mono text-xs sm:text-sm">
          <li>
            <strong className="text-slate-200">Denominación / Titular:</strong>{" "}
            {companyHolder}
          </li>
          <li>
            <strong className="text-slate-200">
              Identificación Fiscal (NIF/CIF):
            </strong>{" "}
            {companyTaxId}
          </li>
          <li>
            <strong className="text-slate-200">Nombre Comercial:</strong> Vertex
            Tech Digital
          </li>
          <li>
            <strong className="text-slate-200">
              Correo Electrónico de Contacto:
            </strong>{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="text-primary hover:underline"
            >
              {contactEmail}
            </a>
          </li>
          <li>
            <strong className="text-slate-200">Actividad Principal:</strong>{" "}
            Consultoría técnica, desarrollo de software fullstack, ingeniería de
            calidad (QA) y automatización de procesos empresariales.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          2. Objeto y Condiciones de Acceso
        </h2>
        <p>
          El presente sitio web tiene por objeto poner a disposición del público
          información comercial, divulgación técnica y herramientas de
          diagnóstico orientativo sobre soluciones de software e ingeniería
          ofrecidas por Vertex Tech Digital.
        </p>
        <p>
          La navegación por este sitio web atribuye la condición de usuario e
          implica la aceptación plena y sin reservas de todas y cada una de las
          disposiciones incluidas en este Aviso Legal. El usuario se compromete
          a hacer un uso adecuado y lícito del sitio web, evitando conductas
          lesivas para los derechos o intereses de Vertex Tech Digital o de
          terceros.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          3. Propiedad Intelectual e Industrial
        </h2>
        <p>
          Todos los contenidos de este sitio web, incluyendo de forma
          enunciativa pero no limitativa: arquitecturas de código fuente,
          diseños gráficos, logotipos, marcas comerciales, diagramas técnicos,
          textos y material multimedia, son propiedad exclusiva de{" "}
          {companyHolder} o de terceros que han autorizado su inclusión.
        </p>
        <p>
          Queda expresamente prohibida la reproducción, distribución,
          comunicación pública o transformación de cualquier elemento del sitio
          sin la previa autorización expresa y por escrito de su legítimo
          titular, de conformidad con el Real Decreto Legislativo 1/1996, de 12
          de abril, por el que se aprueba el texto refundido de la Ley de
          Propiedad Intelectual.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          4. Exclusión de Garantías y Responsabilidad
        </h2>
        <p>
          Vertex Tech Digital aplica rigurosos estándares de seguridad y calidad
          en su infraestructura. No obstante, no se hace responsable de los
          daños y perjuicios que pudieran derivarse de interferencias, caídas de
          servidores en la nube, ataques informáticos o fallos en las redes de
          telecomunicaciones ajenos a su control razonable.
        </p>
        <p>
          Las herramientas interactivas de diagnóstico preliminar disponibles en
          el sitio proporcionan conclusiones estimativas basadas en heurísticas
          técnicas y en ningún caso sustituyen un dictamen pericial o una
          auditoría forense exhaustiva bajo contrato.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          5. Legislación Aplicable y Jurisdicción
        </h2>
        <p>
          Para cuantas controversias pudieran suscitarse relativas a la
          interpretación o aplicación de las presentes condiciones, ambas partes
          se someten expresamente a la legislación española vigente y a la
          competencia de los Juzgados y Tribunales competentes conforme a
          derecho.
        </p>
      </section>
    </LegalLayout>
  );
}
