import { LegalLayout } from "@/components/layout/LegalLayout";
import {
  useLanguage,
  companyHolder,
  companyTaxId,
  contactEmail,
} from "@/context/LanguageContext";

export default function PrivacyPolicy() {
  const { lang } = useLanguage();

  if (lang === "en") {
    return (
      <LegalLayout
        title="Privacy Policy"
        subtitle="Processing of personal data in accordance with the GDPR (Regulation EU 2016/679) and Spanish privacy laws."
        lastUpdated="October 2026"
      >
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            1. Data Controller Information
          </h2>
          <p>
            In compliance with Regulation (EU) 2016/679 of the European
            Parliament and of the Council (General Data Protection Regulation -
            GDPR) and Spanish Organic Law 3/2018 (LOPDGDD), the details of the
            Data Controller are:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground font-mono text-xs sm:text-sm">
            <li>
              <strong className="text-slate-200">Entity:</strong>{" "}
              {companyHolder}
            </li>
            <li>
              <strong className="text-slate-200">Tax ID:</strong> {companyTaxId}
            </li>
            <li>
              <strong className="text-slate-200">Privacy Contact:</strong>{" "}
              <a
                href={`mailto:${contactEmail}`}
                className="text-primary hover:underline"
              >
                {contactEmail}
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            2. Purpose of Data Processing
          </h2>
          <p>
            Vertex Tech Digital collects and processes personal data strictly
            for the following legitimate purposes:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-border/80 rounded-lg">
              <thead className="bg-card border-b border-border text-white font-semibold">
                <tr>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Legal Basis (GDPR)</th>
                  <th className="p-3">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-muted-foreground">
                <tr>
                  <td className="p-3 text-slate-200">
                    Contact and custom quote requests
                  </td>
                  <td className="p-3">
                    Consent (Art. 6.1.a) / Pre-contractual steps (Art. 6.1.b)
                  </td>
                  <td className="p-3">2 years from last contact</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-200">
                    Online technological diagnosis
                  </td>
                  <td className="p-3">Explicit consent upon form submission</td>
                  <td className="p-3">1 year or until deletion is requested</td>
                </tr>
                <tr>
                  <td className="p-3 text-slate-200">
                    Commercial invoicing and contract management
                  </td>
                  <td className="p-3">
                    Execution of a contract (Art. 6.1.b) and Legal obligation
                    (Art. 6.1.c)
                  </td>
                  <td className="p-3">
                    5 to 6 years pursuant to commercial and tax laws
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            3. Data Processors and International Transfers
          </h2>
          <p>
            Your data is never sold or traded to third parties. For the sole
            provision of technical infrastructure, data may be processed by
            certified service providers acting as Data Processors:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
            <li>
              <strong className="text-slate-200">
                Hosting and Edge Computing:
              </strong>{" "}
              Vercel Inc. (European datacenter regions with Standard Contractual
              Clauses).
            </li>
            <li>
              <strong className="text-slate-200">Database Storage:</strong> Neon
              Inc. (Serverless PostgreSQL with SSL encryption and EU data
              residency guarantees).
            </li>
            <li>
              <strong className="text-slate-200">Payment Gateway:</strong>{" "}
              Stripe Payments Europe Ltd. (PCI-DSS compliant).
            </li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            4. User Rights (GDPR / ARSULIPO)
          </h2>
          <p>
            Under European privacy legislation, you have the following rights
            regarding your personal information:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
            <li>Right of access to your personal data.</li>
            <li>Right to rectification of inaccurate or incomplete data.</li>
            <li>Right to erasure (right to be forgotten).</li>
            <li>Right to restriction of data processing.</li>
            <li>Right to data portability.</li>
            <li>Right to object to processing.</li>
          </ul>
          <p className="mt-3">
            To exercise your rights, email us at{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="text-primary hover:underline font-mono"
            >
              {contactEmail}
            </a>{" "}
            indicating your request along with proof of identity. You also have
            the right to lodge a complaint with the Spanish Data Protection
            Agency (AEPD) at{" "}
            <a
              href="https://www.aepd.es"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              www.aepd.es
            </a>
            .
          </p>
        </section>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      title="Política de Privacidad"
      subtitle="Tratamiento y protección de datos personales de conformidad con el RGPD (UE 2016/679) y la LOPDGDD 3/2018."
      lastUpdated="Octubre 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          1. Responsable del Tratamiento
        </h2>
        <p>
          De acuerdo con lo dispuesto en el Reglamento (UE) 2016/679 del
          Parlamento Europeo y del Consejo (Reglamento General de Protección de
          Datos - RGPD) y en la Ley Orgánica 3/2018, de 5 de diciembre, de
          Protección de Datos Personales y garantía de los derechos digitales
          (LOPDGDD), el Responsable del Tratamiento de los datos recabados en
          este sitio web es:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground font-mono text-xs sm:text-sm">
          <li>
            <strong className="text-slate-200">Denominación:</strong>{" "}
            {companyHolder}
          </li>
          <li>
            <strong className="text-slate-200">Identificación Fiscal:</strong>{" "}
            {companyTaxId}
          </li>
          <li>
            <strong className="text-slate-200">
              Canal de Privacidad y DPO:
            </strong>{" "}
            <a
              href={`mailto:${contactEmail}`}
              className="text-primary hover:underline"
            >
              {contactEmail}
            </a>
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          2. Finalidades y Base Jurídica del Tratamiento
        </h2>
        <p>
          Vertex Tech Digital trata los datos personales que usted facilita con
          las finalidades y bases de legitimación detalladas a continuación:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border border-border/80 rounded-lg">
            <thead className="bg-card border-b border-border text-white font-semibold">
              <tr>
                <th className="p-3">Finalidad</th>
                <th className="p-3">Base Jurídica (RGPD)</th>
                <th className="p-3">Plazo de Conservación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-muted-foreground">
              <tr>
                <td className="p-3 text-slate-200">
                  Atención de solicitudes de contacto y presupuestos de
                  desarrollo
                </td>
                <td className="p-3">
                  Consentimiento expreso (art. 6.1.a) y aplicación de medidas
                  precontractuales (art. 6.1.b)
                </td>
                <td className="p-3">
                  2 años desde la última comunicación activa
                </td>
              </tr>
              <tr>
                <td className="p-3 text-slate-200">
                  Procesamiento del Diagnóstico Tecnológico Gratuito
                </td>
                <td className="p-3">
                  Consentimiento expreso al remitir el cuestionario interactivo
                </td>
                <td className="p-3">
                  1 año o hasta que solicite la supresión técnica
                </td>
              </tr>
              <tr>
                <td className="p-3 text-slate-200">
                  Gestión contable, fiscal y facturación de servicios prestados
                </td>
                <td className="p-3">
                  Ejecución de contrato (art. 6.1.b) y cumplimiento de
                  obligación legal (art. 6.1.c)
                </td>
                <td className="p-3">
                  5 a 6 años conforme a la Ley General Tributaria y Código de
                  Comercio
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          3. Destinatarios y Encargados del Tratamiento
        </h2>
        <p>
          Vertex Tech Digital no cede ni comercializa datos personales a
          terceros. Únicamente tienen acceso a determinados datos los
          proveedores tecnológicos necesarios para el despliegue de nuestra
          infraestructura, con quienes se han suscrito los preceptivos contratos
          de Encargado de Tratamiento (art. 28 RGPD):
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-muted-foreground text-xs sm:text-sm">
          <li>
            <strong className="text-slate-200">
              Infraestructura de Servidores:
            </strong>{" "}
            Vercel Inc. (red perimetral en la Unión Europea, con Cláusulas
            Contractuales Tipo validadas por la Comisión Europea).
          </li>
          <li>
            <strong className="text-slate-200">
              Base de Datos PostgreSQL:
            </strong>{" "}
            Neon Inc. (cifrado en reposo y en tránsito con protocolo TLS 1.3).
          </li>
          <li>
            <strong className="text-slate-200">Pasarela de Pagos:</strong>{" "}
            Stripe Payments Europe Ltd. (cumplimiento normativo PCI-DSS de Nivel
            1).
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          4. Derechos del Interesado (ARSULIPO)
        </h2>
        <p>
          El RGPD y la LOPDGDD reconocen al usuario el ejercicio de los
          siguientes derechos sobre sus datos personales:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
          <li>
            <strong className="text-slate-200">Acceso:</strong> Conocer qué
            datos personales suyos están siendo tratados.
          </li>
          <li>
            <strong className="text-slate-200">Rectificación:</strong> Solicitar
            la corrección de datos inexactos o incompletos.
          </li>
          <li>
            <strong className="text-slate-200">Supresión:</strong> Solicitar el
            borrado de sus datos cuando ya no sean necesarios.
          </li>
          <li>
            <strong className="text-slate-200">Limitación:</strong> Solicitar la
            suspensión temporal del tratamiento en los supuestos legalmente
            previstos.
          </li>
          <li>
            <strong className="text-slate-200">Portabilidad:</strong> Recibir
            sus datos en un formato estructurado y de lectura mecánica.
          </li>
          <li>
            <strong className="text-slate-200">Oposición:</strong> Oponerse al
            tratamiento de sus datos en cualquier momento.
          </li>
        </ul>
        <p className="mt-3">
          Para ejercer cualquiera de estos derechos, remita una solicitud por
          escrito acompañada de copia de su documento de identidad a:{" "}
          <a
            href={`mailto:${contactEmail}`}
            className="text-primary hover:underline font-mono"
          >
            {contactEmail}
          </a>
          . Asimismo, le informamos de su derecho a presentar una reclamación
          ante la Agencia Española de Protección de Datos (
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            www.aepd.es
          </a>
          ) si considera que sus derechos no han sido debidamente atendidos.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          5. Medidas de Seguridad Técnicas
        </h2>
        <p>
          Vertex Tech Digital aplica medidas técnicas y organizativas de
          vanguardia destinadas a preservar la confidencialidad, integridad y
          disponibilidad de los datos: cabeceras de seguridad HTTP estrictas,
          cifrado TLS en todas las comunicaciones, hashing de credenciales y
          políticas de control de acceso basadas en el principio de mínimo
          privilegio.
        </p>
      </section>
    </LegalLayout>
  );
}
