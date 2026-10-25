import { LegalLayout } from "@/components/layout/LegalLayout";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/button";
import { Settings2, ShieldCheck } from "lucide-react";

export default function CookiePolicy() {
  const { lang } = useLanguage();

  const openCookiePreferences = () => {
    window.dispatchEvent(new CustomEvent("open-cookie-preferences"));
  };

  if (lang === "en") {
    return (
      <LegalLayout
        title="Cookie Policy"
        subtitle="Detailed information about the storage technologies and cookies used on this website (LSSI-CE Art. 22.2)."
        lastUpdated="October 2026"
      >
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            1. What are Cookies and Web Storage?
          </h2>
          <p>
            Cookies and local storage technologies (such as the Web Storage API
            -{" "}
            <code className="text-primary font-mono text-xs">localStorage</code>
            ) are small data structures stored on your device when visiting a
            website. They serve essential functions such as maintaining user
            sessions, remembering language preferences, and ensuring overall
            platform security.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            2. Detailed Inventory of Cookies and Local Storage
          </h2>
          <p>
            In compliance with the Spanish Data Protection Agency (AEPD)
            guidelines and Article 22.2 of Law 34/2002 (LSSI-CE), the table
            below details all keys and technologies currently deployed:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border border-border/80 rounded-lg">
              <thead className="bg-card border-b border-border text-white font-semibold">
                <tr>
                  <th className="p-3">Identifier</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Provider</th>
                  <th className="p-3">Purpose</th>
                  <th className="p-3">Duration</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-muted-foreground">
                <tr>
                  <td className="p-3 font-mono text-slate-200">
                    vertex-tech-lang
                  </td>
                  <td className="p-3">Technical / Essential</td>
                  <td className="p-3">Vertex Tech (First-party)</td>
                  <td className="p-3">
                    Stores language preference (English / Spanish)
                  </td>
                  <td className="p-3">Persistent (localStorage)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-200">
                    vertex-tech-cookie-consent
                  </td>
                  <td className="p-3">Technical / Essential</td>
                  <td className="p-3">Vertex Tech (First-party)</td>
                  <td className="p-3">
                    Records your explicit cookie consent preferences
                  </td>
                  <td className="p-3">12 months (localStorage)</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-200">token</td>
                  <td className="p-3">Technical / Security</td>
                  <td className="p-3">Vertex Tech (First-party)</td>
                  <td className="p-3">
                    Cryptographic JWT token for authorized admin dashboard
                    access
                  </td>
                  <td className="p-3">Session / expires on logout</td>
                </tr>
                <tr>
                  <td className="p-3 font-mono text-slate-200">_ga / _ga_*</td>
                  <td className="p-3">Analytics / Performance</td>
                  <td className="p-3">Google LLC (if enabled)</td>
                  <td className="p-3">
                    Measures user engagement anonymously (strictly blocked by
                    default)
                  </td>
                  <td className="p-3">Up to 2 years (requires consent)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            3. Interactive Cookie Preferences
          </h2>
          <p>
            You have full control over your privacy. You can modify your
            choices, grant, or withdraw consent at any time by clicking the
            button below:
          </p>
          <div className="pt-2">
            <Button
              onClick={openCookiePreferences}
              className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2 h-11 px-5 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Settings2 className="w-4 h-4" />
              Open Cookie Preferences Center
            </Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-wide">
            4. Managing Cookies in Your Browser
          </h2>
          <p>
            You can also allow, block, or delete cookies installed on your
            computer by configuring your browser options:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
            <li>
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google Chrome
              </a>
            </li>
            <li>
              <a
                href="https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              <a
                href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Apple Safari
              </a>
            </li>
            <li>
              <a
                href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Microsoft Edge
              </a>
            </li>
          </ul>
        </section>
      </LegalLayout>
    );
  }

  return (
    <LegalLayout
      title="Política de Cookies"
      subtitle="Información detallada sobre las tecnologías de almacenamiento y cookies utilizadas en esta plataforma (Art. 22.2 LSSI-CE)."
      lastUpdated="Octubre 2026"
    >
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          1. ¿Qué son las Cookies y el Almacenamiento Local?
        </h2>
        <p>
          Las cookies y los mecanismos de almacenamiento web (tales como la Web
          Storage API -{" "}
          <code className="text-primary font-mono text-xs">localStorage</code>)
          son dispositivos de almacenamiento y recuperación de datos que se
          instalan en el dispositivo del usuario al navegar por internet.
          Cumplen funciones indispensables para garantizar la navegación
          técnica, recordar preferencias de idioma y asegurar la integridad de
          las comunicaciones.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          2. Inventario Técnico Detallado
        </h2>
        <p>
          En cumplimiento del artículo 22.2 de la LSSI-CE y de la Guía sobre el
          uso de cookies de la Agencia Española de Protección de Datos (AEPD), a
          continuación se desglosan los elementos empleados en este sitio web:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border border-border/80 rounded-lg">
            <thead className="bg-card border-b border-border text-white font-semibold">
              <tr>
                <th className="p-3">Identificador</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Entidad</th>
                <th className="p-3">Finalidad</th>
                <th className="p-3">Duración</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 text-muted-foreground">
              <tr>
                <td className="p-3 font-mono text-slate-200">
                  vertex-tech-lang
                </td>
                <td className="p-3">Técnica / Esencial</td>
                <td className="p-3">Vertex Tech (Propia)</td>
                <td className="p-3">
                  Memoriza la selección de idioma (Español o Inglés) del usuario
                </td>
                <td className="p-3">Persistente (localStorage)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-slate-200">
                  vertex-tech-cookie-consent
                </td>
                <td className="p-3">Técnica / Esencial</td>
                <td className="p-3">Vertex Tech (Propia)</td>
                <td className="p-3">
                  Registra el estado del consentimiento de cookies para no
                  reiterar el aviso
                </td>
                <td className="p-3">12 meses (localStorage)</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-slate-200">token</td>
                <td className="p-3">Técnica / Seguridad</td>
                <td className="p-3">Vertex Tech (Propia)</td>
                <td className="p-3">
                  Token JWT criptográfico para la autenticación en el panel de
                  administración
                </td>
                <td className="p-3">Sesión / expira al cerrar sesión</td>
              </tr>
              <tr>
                <td className="p-3 font-mono text-slate-200">_ga / _ga_*</td>
                <td className="p-3">Analítica (Opcional)</td>
                <td className="p-3">Google LLC (si se activa)</td>
                <td className="p-3">
                  Análisis estadístico de uso y navegación. Bloqueada por
                  defecto.
                </td>
                <td className="p-3">Hasta 2 años (requiere consentimiento)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          3. Panel de Configuración y Revocación del Consentimiento
        </h2>
        <p>
          Usted tiene el control sobre sus datos. Puede modificar en cualquier
          momento sus preferencias de privacidad o revocar el consentimiento
          otorgado haciendo click en el siguiente botón:
        </p>
        <div className="pt-2">
          <Button
            onClick={openCookiePreferences}
            className="bg-primary text-white hover:bg-primary/90 flex items-center gap-2 h-11 px-5 shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Settings2 className="w-4 h-4" />
            Abrir Centro de Preferencias de Cookies
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-wide">
          4. Desactivación o Eliminación a través del Navegador
        </h2>
        <p>
          Asimismo, puede permitir, bloquear o eliminar las cookies instaladas
          en su equipo mediante la configuración de las opciones de su
          navegador:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs sm:text-sm">
          <li>
            <a
              href="https://support.google.com/chrome/answer/95647"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Google Chrome
            </a>
          </li>
          <li>
            <a
              href="https://support.mozilla.org/kb/enhanced-tracking-protection-firefox-desktop"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Mozilla Firefox
            </a>
          </li>
          <li>
            <a
              href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Apple Safari
            </a>
          </li>
          <li>
            <a
              href="https://support.microsoft.com/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Microsoft Edge
            </a>
          </li>
        </ul>
      </section>
    </LegalLayout>
  );
}
