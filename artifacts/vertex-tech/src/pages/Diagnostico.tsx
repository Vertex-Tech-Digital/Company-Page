import React, { useState } from "react";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ParticleNetwork } from "@/components/sections/ParticleNetwork";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { 
  CheckCircle2, 
  Mail, 
  Phone, 
  Coffee, 
  RefreshCw, 
  AlertCircle, 
  ArrowRight,
  ClipboardList
} from "lucide-react";

export default function Diagnostico() {
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{
    success: boolean;
    leadId: string;
    pdfGenerated: boolean;
    emailSent: boolean;
    message: string;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [debugOutput, setDebugOutput] = useState<string | null>(null);
  const [preferenceSelected, setPreferenceSelected] = useState<string>("email");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessData(null);
    setDebugOutput(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    // Collect checked problems
    const markedProblems: number[] = [];
    const checkboxes = form.querySelectorAll(".problem-cb") as NodeListOf<HTMLInputElement>;
    checkboxes.forEach((cb) => {
      if (cb.checked) {
        markedProblems.push(parseInt(cb.value, 10));
      }
    });

    const payload = {
      company_name: formData.get("company_name"),
      sector: formData.get("sector"),
      size: formData.get("size"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      contact_preference: formData.get("contact_preference"),
      marked_problems: markedProblems,
      free_text: formData.get("free_text") || "",
    };

    try {
      const response = await fetch("/api/diagnostico", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      setDebugOutput(JSON.stringify(data, null, 2));

      if (response.ok) {
        setSuccessData(data);
      } else {
        setErrorMsg(data.error || "Ocurrió un error al procesar el diagnóstico.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error de red al conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setErrorMsg(null);
    setDebugOutput(null);
  };

  return (
    <main className="min-h-screen text-foreground font-sans bg-slate-950 relative overflow-x-hidden">
      <ParticleNetwork />
      
      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />

        {/* Hero Section of the Diagnostics Page */}
        <section className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-600 bg-clip-text text-transparent mb-4">
              Diagnóstico Tecnológico
            </h1>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Evalúa la infraestructura digital y procesos de tu empresa de forma automatizada y recibe una hoja de ruta técnica a medida.
            </p>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-10 shadow-[0_0_30px_rgba(37,99,235,0.08)]">
            
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <RefreshCw className="h-12 w-12 text-blue-500 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-slate-200">Generando tu Diagnóstico...</h3>
                <p className="text-slate-400 mt-2 text-center text-sm max-w-sm">
                  Estamos analizando los síntomas de tu negocio, guardando el lead en base de datos y preparando tu reporte en PDF.
                </p>
              </div>
            )}

            {!loading && errorMsg && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-lg font-semibold text-red-400">Error en el proceso</h4>
                    <p className="text-slate-300 mt-1 text-sm">{errorMsg}</p>
                    <button 
                      onClick={() => setErrorMsg(null)}
                      className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors text-xs font-semibold"
                    >
                      Entendido
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!loading && successData && (
              <div className="text-center py-8">
                <div className="flex justify-center mb-6">
                  <div className="bg-blue-500/10 p-4 rounded-full border border-blue-500/20">
                    <CheckCircle2 className="h-16 w-16 text-blue-500" />
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-100 mb-3">
                  ¡Diagnóstico Completado con Éxito!
                </h2>
                <p className="text-slate-300 text-sm max-w-lg mx-auto mb-8">
                  {successData.emailSent 
                    ? "Hemos enviado el reporte de diagnóstico detallado en formato PDF a la dirección de correo electrónico indicada."
                    : "Hemos registrado tu diagnóstico en el sistema. El correo de confirmación está pendiente de configuración SMTP."}
                </p>

                {/* Bounded contact options depending on user's preference */}
                <div className="max-w-md mx-auto bg-slate-950/50 border border-slate-800 rounded-xl p-6 mb-8 text-left">
                  <h4 className="text-slate-200 font-semibold mb-4 flex items-center gap-2 text-sm">
                    <ClipboardList className="h-4 w-4 text-blue-500" />
                    Siguientes Pasos (Preferencia de Contacto)
                  </h4>
                  
                  {preferenceSelected === "cafe" && (
                    <div className="flex flex-col gap-3">
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Has seleccionado <strong>Café Presencial</strong>. Nos coordinaremos pronto para reunirnos y tomar un café presencial en Canarias para detallar tu hoja de ruta. Puedes agilizar la cita contactándonos por WhatsApp:
                      </p>
                      <a 
                        href="https://wa.me/34600000000?text=Hola!%20Acabo%20de%20hacer%20el%20diagnóstico%20de%20mi%20empresa%20y%20elegí%20la%20opción%20de%20café%20presencial."
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-500 transition-colors text-white font-bold rounded-lg text-sm"
                      >
                        <Coffee className="h-4 w-4" />
                        Coordinar Café por WhatsApp
                      </a>
                    </div>
                  )}

                  {preferenceSelected === "llamada" && (
                    <div className="flex flex-col gap-3">
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Has seleccionado <strong>Llamada telefónica</strong>. Un consultor experto te llamará al número de teléfono indicado para comentar la auditoría técnica. También puedes llamarnos directamente:
                      </p>
                      <a 
                        href="tel:***REMOVED***"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold rounded-lg text-sm"
                      >
                        <Phone className="h-4 w-4" />
                        Llamar a Vertex Tech Digital
                      </a>
                    </div>
                  )}

                  {preferenceSelected === "email" && (
                    <div className="flex flex-col gap-3">
                      <p className="text-slate-400 text-xs leading-relaxed">
                        Has seleccionado <strong>Correo Electrónico</strong>. Te responderemos respondiendo tus dudas directamente a tu email. Si quieres hacernos alguna pregunta de inmediato, puedes escribirnos aquí:
                      </p>
                      <a 
                        href="mailto:***REMOVED***?subject=Diagnóstico Tecnológico Completado"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-indigo-600 hover:bg-indigo-500 transition-colors text-white font-bold rounded-lg text-sm"
                      >
                        <Mail className="h-4 w-4" />
                        Enviar Email de Consulta
                      </a>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button 
                    onClick={handleReset}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 transition-colors text-slate-300 font-semibold rounded-lg text-sm"
                  >
                    Hacer otro diagnóstico
                  </button>
                  <a 
                    href="/"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-semibold rounded-lg text-sm flex items-center gap-2"
                  >
                    Volver a Inicio <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {!loading && !successData && (
              <form id="diagnostico-form" onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-2 mb-6">
                    Ficha Técnica de la Empresa
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-300 mb-2" htmlFor="company_name">
                        Razón Social / Nombre:
                      </label>
                      <input 
                        className="bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        type="text" 
                        id="company_name" 
                        name="company_name" 
                        required 
                        placeholder="Ej: Mi Empresa S.L." 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-300 mb-2" htmlFor="sector">
                        Sector Industrial:
                      </label>
                      <input 
                        className="bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        type="text" 
                        id="sector" 
                        name="sector" 
                        required 
                        placeholder="Ej: Hostelería, Tecnología, Comercio" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-300 mb-2" htmlFor="size">
                        Tamaño de la Empresa:
                      </label>
                      <input 
                        className="bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        type="text" 
                        id="size" 
                        name="size" 
                        required 
                        placeholder="Ej: 1-10 empleados" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-300 mb-2" htmlFor="contact_preference">
                        Preferencia de Contacto:
                      </label>
                      <select 
                        className="bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        id="contact_preference" 
                        name="contact_preference" 
                        required
                        value={preferenceSelected}
                        onChange={(e) => setPreferenceSelected(e.target.value)}
                      >
                        <option value="email">Email</option>
                        <option value="llamada">Llamada telefónica</option>
                        <option value="cafe">Café presencial (Canarias)</option>
                      </select>
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-300 mb-2" htmlFor="email">
                        Correo Electrónico:
                      </label>
                      <input 
                        className="bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        type="email" 
                        id="email" 
                        name="email" 
                        required 
                        placeholder="ejemplo@correo.com" 
                      />
                    </div>

                    <div className="flex flex-col">
                      <label className="text-sm font-semibold text-slate-300 mb-2" htmlFor="phone">
                        Teléfono (Opcional):
                      </label>
                      <input 
                        className="bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                        type="text" 
                        id="phone" 
                        name="phone" 
                        placeholder="Ej: 600123456" 
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-slate-200 border-b border-slate-800 pb-2 mb-6">
                    Síntomas y Problemas Detectados
                  </h3>

                  <p className="text-xs text-slate-400 mb-4">
                    Selecciona todos los problemas que reconozcas actualmente en tu infraestructura digital o procesos:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 md:p-6 mb-6">
                    {[
                      { id: 1, name: "Tareas manuales repetitivas" },
                      { id: 2, name: "Sistemas desconectados entre sí" },
                      { id: 3, name: "Lentitud o caídas de la web" },
                      { id: 4, name: "Respuesta tardía a clientes" },
                      { id: 5, name: "Facturación manual o uso de Excel" },
                      { id: 6, name: "Falta de visión global del negocio" },
                      { id: 7, name: "Errores humanos al copiar datos" },
                      { id: 8, name: "Software o sistemas obsoletos" },
                      { id: 9, name: "Métodos de cobro complicados" },
                      { id: 10, name: "Descontrol de stock/inventario" },
                      { id: 11, name: "Gestión de citas o reservas manual" },
                      { id: 12, name: "Falta de control en compras/ventas" },
                      { id: 13, name: "Software de terceros inestable" }
                    ].map((prob) => (
                      <div key={prob.id} className="flex items-center gap-3 py-1">
                        <input 
                          type="checkbox" 
                          id={`problem-${prob.id}`} 
                          className="problem-cb h-4 w-4 rounded border-slate-800 bg-slate-950/60 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 focus:outline-none transition-colors cursor-pointer"
                          value={prob.id} 
                        />
                        <label 
                          className="text-slate-300 text-xs md:text-sm font-medium cursor-pointer hover:text-white transition-colors select-none" 
                          htmlFor={`problem-${prob.id}`}
                        >
                          {prob.name}
                        </label>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-slate-300 mb-2" htmlFor="free_text">
                      Descripción Libre de Problemas / Necesidades:
                    </label>
                    <textarea 
                      className="bg-slate-950/60 border border-slate-800 rounded-lg py-2.5 px-4 text-slate-200 focus:border-blue-500 focus:outline-none transition-colors text-sm"
                      id="free_text" 
                      name="free_text" 
                      rows={4} 
                      placeholder="Escribe de forma libre lo que le ocurre a tu plataforma, software o procesos comerciales (nuestro motor inteligente detectará problemas adicionales)..." 
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    className="w-full md:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white font-bold rounded-lg text-sm md:text-base flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
                    type="submit" 
                    disabled={loading}
                  >
                    Generar Diagnóstico Técnico
                  </button>
                </div>
              </form>
            )}

            {/* Subtle debug box for testing */}
            {debugOutput && (
              <div className="mt-8 border-t border-slate-800 pt-6">
                <details className="cursor-pointer group">
                  <summary className="text-xs text-slate-500 hover:text-slate-400 select-none outline-none">
                    Ver salida de depuración API (Logs JSON)
                  </summary>
                  <pre className="mt-4 bg-slate-950/80 p-4 border border-slate-850 rounded-lg text-[10px] text-indigo-400 overflow-x-auto font-mono max-h-60">
                    {debugOutput}
                  </pre>
                </details>
              </div>
            )}

          </div>
        </section>

        <Footer />
      </div>
      <WhatsAppButton />
    </main>
  );
}
