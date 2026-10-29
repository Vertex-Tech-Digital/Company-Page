import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/sections/Navbar";
import { Footer } from "@/components/sections/Footer";
import { ParticleNetwork } from "@/components/sections/ParticleNetwork";
import { WhatsAppButton } from "@/components/sections/WhatsAppButton";
import { SkipToContent } from "@/components/common/SkipToContent";
import {
  CheckCircle2,
  Mail,
  Phone,
  Coffee,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Building2,
  Factory,
  Users,
  Send,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const problems = [
  { id: 1, name: "Pierdo horas en tareas que podrían automatizarse" },
  { id: 2, name: "Mis sistemas no se comunican entre ellos" },
  { id: 3, name: "Mi web es lenta o se cae frecuentemente" },
  { id: 4, name: "Tardo mucho en responder a clientes" },
  { id: 5, name: "Facturo manualmente o con Excel" },
  { id: 6, name: "No tengo datos claros para tomar decisiones" },
  { id: 7, name: "Cometo errores al pasar datos entre sistemas" },
  { id: 13, name: "El software que uso falla o es inestable" },
];

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3.5 border-b border-white/10 pb-4 mb-6">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-[0_0_15px_rgba(59,130,246,0.12)]">
        <Icon className="w-4 h-4" aria-hidden="true" />
      </div>
      <div>
        <h3
          className="text-lg md:text-xl font-bold text-white tracking-tight"
          style={{ fontFamily: "var(--app-font-heading)" }}
        >
          {children}
        </h3>
      </div>
      <span
        className="ml-auto w-12 h-0.5 bg-gradient-to-r from-primary to-cyan-400 rounded-full"
        aria-hidden="true"
      />
    </div>
  );
}

function FormInput({
  label,
  id,
  type = "text",
  required,
  placeholder,
  autoComplete,
  icon: Icon,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col">
      <label
        className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2"
        htmlFor={id}
      >
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        )}
        <span>{label}</span>
        {required && (
          <span className="text-primary text-xs" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        className="bg-slate-950/60 border border-white/15 rounded-xl py-3 px-4 text-white placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-slate-950/80 focus:outline-none transition-all duration-200 text-sm"
        type={type}
        id={id}
        name={id}
        required={required}
        aria-required={required ? "true" : undefined}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function FormSelect({
  label,
  id,
  required,
  icon: Icon,
  value,
  defaultValue,
  onChange,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  icon?: React.ElementType;
  value?: string;
  defaultValue?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label
        className="text-sm font-medium text-slate-200 mb-2 flex items-center gap-2"
        htmlFor={id}
      >
        {Icon && (
          <Icon className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
        )}
        <span>{label}</span>
        {required && (
          <span className="text-primary text-xs" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <select
        className="bg-slate-950/60 border border-white/15 rounded-xl py-3 px-4 text-white focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-slate-950/80 focus:outline-none transition-all duration-200 text-sm cursor-pointer"
        id={id}
        name={id}
        required={required}
        aria-required={required ? "true" : undefined}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
      >
        {children}
      </select>
    </div>
  );
}

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
  const [selectedProblems, setSelectedProblems] = useState<number[]>([]);
  const [isPredefinedOpen, setIsPredefinedOpen] = useState(false);
  const [freeTextValue, setFreeTextValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const toggleProblem = (id: number) => {
    setValidationError(null);
    setSelectedProblems((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);
    setSuccessData(null);
    setDebugOutput(null);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const freeText = (formData.get("free_text") as string) || "";

    // Validación: El diagnóstico no puede irse vacío
    if (selectedProblems.length === 0 && !freeText.trim()) {
      setValidationError(
        "Por favor, cuéntanos qué te está pasando o despliega y marca al menos una opción predefinida para generar tu diagnóstico.",
      );
      return;
    }

    setValidationError(null);
    setLoading(true);

    const payload = {
      company_name: formData.get("company_name"),
      sector: formData.get("sector"),
      size: formData.get("size"),
      email: formData.get("email"),
      phone: formData.get("phone") || undefined,
      contact_preference: formData.get("contact_preference"),
      marked_problems: selectedProblems,
      free_text: freeText,
    };

    try {
      const response = await fetch("/api/diagnostico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      // Validar el tipo de contenido antes de intentar llamar a .json()
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const data = await response.json();
        setDebugOutput(JSON.stringify(data, null, 2));

        if (response.ok) {
          setSuccessData(data);
        } else {
          setErrorMsg(
            data.error || "Ocurrió un error al procesar el diagnóstico.",
          );
        }
      } else {
        // En caso de que el servidor devuelva HTML o texto plano
        const rawText = await response.text();
        if (import.meta.env.DEV) {
          console.error("[Diagnostico Non-JSON Response]:", rawText);
          setDebugOutput(rawText);
        }
        setErrorMsg(
          "El servidor devolvió un error inesperado. Consulta los logs del sistema.",
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Error de red al conectar con el servidor.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSuccessData(null);
    setErrorMsg(null);
    setDebugOutput(null);
    setSelectedProblems([]);
    setFreeTextValue("");
    setIsPredefinedOpen(false);
    setValidationError(null);
  };

  return (
    <div className="min-h-screen text-foreground font-sans bg-background relative overflow-x-hidden selection:bg-primary/30 selection:text-white">
      <SkipToContent />
      <ParticleNetwork />

      {/* Capa oscura superpuesta con viñeta para contraste WCAG AAA idéntico a la portada */}
      <div
        className="fixed inset-0 pointer-events-none bg-gradient-to-b from-slate-950/40 via-background/70 to-background z-0"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        <header role="banner">
          <Navbar />
        </header>

        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
          <section className="pt-32 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
            {/* Header sin kickers */}
            <motion.div
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1
                className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4"
                style={{ fontFamily: "var(--app-font-heading)" }}
              >
                Diagnóstico{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                  Tecnológico
                </span>
              </h1>
              <div
                className="w-16 h-1 bg-gradient-to-r from-primary to-cyan-400 rounded-full mx-auto mb-6"
                aria-hidden="true"
              />
              <p className="text-slate-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
                Evalúa la infraestructura digital y procesos de tu empresa de
                forma automatizada y recibe una hoja de ruta técnica a medida.
              </p>
            </motion.div>

            {/* Main Glassmorphic Card */}
            <motion.div
              className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 md:p-10 shadow-2xl shadow-black/40"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <AnimatePresence mode="wait">
                {/* Loading State */}
                {loading && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    role="status"
                    aria-live="polite"
                    className="flex flex-col items-center justify-center py-20"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                      <div className="relative bg-primary/10 p-5 rounded-full border border-primary/20">
                        <RefreshCw
                          className="h-10 w-10 text-primary animate-spin"
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                    <h3
                      className="text-xl font-semibold text-white tracking-wide"
                      style={{ fontFamily: "var(--app-font-heading)" }}
                    >
                      Generando tu Diagnóstico...
                    </h3>
                    <p className="text-slate-300 mt-2 text-center text-sm max-w-sm leading-relaxed">
                      Estamos analizando los síntomas de tu negocio, guardando
                      el lead en base de datos y preparando tu reporte en PDF.
                    </p>
                    <div className="flex gap-1.5 mt-6" aria-hidden="true">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-primary"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{
                            duration: 1.2,
                            repeat: Infinity,
                            delay: i * 0.2,
                          }}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Error State */}
                {!loading && errorMsg && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    role="alert"
                    aria-live="assertive"
                    className="bg-destructive/10 border border-destructive/30 rounded-xl p-6"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-destructive/10 p-2 rounded-lg border border-destructive/20 shrink-0">
                        <AlertCircle
                          className="h-5 w-5 text-destructive"
                          aria-hidden="true"
                        />
                      </div>
                      <div>
                        <h4
                          className="text-lg font-semibold text-destructive"
                          style={{ fontFamily: "var(--app-font-heading)" }}
                        >
                          Error en el proceso
                        </h4>
                        <p className="text-slate-300 mt-1 text-sm leading-relaxed">
                          {errorMsg}
                        </p>
                        <button
                          onClick={() => setErrorMsg(null)}
                          className="mt-4 px-4 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg hover:bg-destructive/20 transition-colors text-xs font-semibold cursor-pointer"
                        >
                          Entendido
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Success State */}
                {!loading && successData && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    role="status"
                    aria-live="polite"
                    className="text-center py-8"
                  >
                    <motion.div
                      className="flex justify-center mb-6"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                        delay: 0.2,
                      }}
                    >
                      <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
                        <div className="relative bg-primary/10 p-5 rounded-full border border-primary/20">
                          <CheckCircle2
                            className="h-14 w-14 text-primary"
                            aria-hidden="true"
                          />
                        </div>
                      </div>
                    </motion.div>
                    <h2
                      className="text-2xl md:text-3xl font-bold text-white mb-3 tracking-wide"
                      style={{ fontFamily: "var(--app-font-heading)" }}
                    >
                      ¡Diagnóstico Completado!
                    </h2>
                    <p className="text-slate-300 text-sm max-w-lg mx-auto mb-8 leading-relaxed">
                      {successData.emailSent && successData.pdfGenerated
                        ? "Hemos enviado el reporte de diagnóstico detallado en PDF a tu dirección de correo electrónico."
                        : successData.emailSent
                          ? "Hemos registrado tu diagnóstico y te enviamos un correo de confirmación. Tu reporte en PDF se generará en breve."
                          : "Hemos registrado tu diagnóstico en el sistema. Un consultor se pondrá en contacto contigo muy pronto."}
                    </p>

                    {/* Next Steps Card */}
                    <div className="max-w-md mx-auto bg-slate-950/60 border border-white/10 rounded-xl p-6 mb-8 text-left shadow-lg">
                      <h4
                        className="text-white font-semibold mb-4 flex items-center gap-2 text-sm"
                        style={{ fontFamily: "var(--app-font-heading)" }}
                      >
                        <ClipboardList
                          className="h-4 w-4 text-primary"
                          aria-hidden="true"
                        />
                        Siguientes Pasos
                      </h4>

                      {preferenceSelected === "cafe" && (
                        <div className="flex flex-col gap-3">
                          <p className="text-slate-300 text-xs leading-relaxed">
                            Has seleccionado{" "}
                            <strong className="text-white">
                              Café Presencial
                            </strong>
                            . Nos coordinaremos pronto para reunirnos en
                            Canarias para detallar tu hoja de ruta.
                          </p>
                          <a
                            href="https://wa.me/34600000000?text=Hola!%20Acabo%20de%20hacer%20el%20diagnóstico%20de%20mi%20empresa%20y%20elegí%20la%20opción%20de%20café%20presencial."
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] transition-all duration-300 text-white font-bold rounded-lg text-sm cursor-pointer shadow-[0_4px_24px_0_rgba(37,211,102,0.3)] hover:shadow-[0_4px_32px_0_rgba(37,211,102,0.5)]"
                          >
                            <Coffee className="h-4 w-4" aria-hidden="true" />
                            Coordinar Café por WhatsApp
                          </a>
                        </div>
                      )}

                      {preferenceSelected === "llamada" && (
                        <div className="flex flex-col gap-3">
                          <p className="text-slate-300 text-xs leading-relaxed">
                            Has seleccionado{" "}
                            <strong className="text-white">
                              Llamada telefónica
                            </strong>
                            . Un consultor experto te llamará para comentar la
                            auditoría técnica.
                          </p>
                          <a
                            href={`tel:${import.meta.env.VITE_CONTACT_PHONE || ""}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-solid hover:bg-primary-solid-hover transition-all duration-300 text-white font-bold rounded-lg text-sm cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                          >
                            <Phone className="h-4 w-4" aria-hidden="true" />
                            Llamar a Vertex Tech Digital
                          </a>
                        </div>
                      )}

                      {preferenceSelected === "email" && (
                        <div className="flex flex-col gap-3">
                          <p className="text-slate-300 text-xs leading-relaxed">
                            Has seleccionado{" "}
                            <strong className="text-white">
                              Correo Electrónico
                            </strong>
                            . Te responderemos directamente a tu email.
                          </p>
                          <a
                            href={`mailto:${import.meta.env.VITE_CONTACT_EMAIL || ""}?subject=Diagnóstico Tecnológico Completado`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-primary-solid hover:bg-primary-solid-hover transition-all duration-300 text-white font-bold rounded-lg text-sm cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                          >
                            <Mail className="h-4 w-4" aria-hidden="true" />
                            Enviar Email de Consulta
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                      <button
                        onClick={handleReset}
                        className="px-6 py-3 bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 hover:text-white transition-all duration-200 font-semibold rounded-lg text-sm cursor-pointer"
                      >
                        Hacer otro diagnóstico
                      </button>
                      <a
                        href="/"
                        className="px-6 py-3 bg-primary-solid text-white hover:bg-primary-solid-hover transition-all duration-300 font-semibold rounded-lg text-sm flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                      >
                        Volver a Inicio{" "}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                  </motion.div>
                )}

                {/* Form State */}
                {!loading && !successData && (
                  <motion.form
                    key="form"
                    id="diagnostico-form"
                    onSubmit={handleSubmit}
                    className="space-y-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {/* Section 1: Ficha Técnica */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5 }}
                    >
                      <SectionTitle icon={Building2}>
                        Ficha Técnica de la Empresa
                      </SectionTitle>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <FormInput
                          label="Razón Social / Nombre"
                          id="company_name"
                          required
                          autoComplete="organization"
                          placeholder="Ej: Mi Empresa S.L."
                          icon={Building2}
                        />
                        <FormInput
                          label="Sector Industrial"
                          id="sector"
                          required
                          placeholder="Ej: Hostelería, Tecnología, Comercio"
                          icon={Factory}
                        />
                        <FormSelect
                          label="Tamaño de la Empresa"
                          id="size"
                          required
                          icon={Users}
                          defaultValue="1-9 empleados"
                        >
                          <option value="1-9 empleados">
                            1-9 empleados (Microempresa)
                          </option>
                          <option value="10-49 empleados">
                            10-49 empleados (Pequeña empresa)
                          </option>
                          <option value="50-249 empleados">
                            50-249 empleados (Mediana empresa)
                          </option>
                          <option value="250+ empleados">
                            250+ empleados (Gran empresa)
                          </option>
                        </FormSelect>
                        <FormSelect
                          label="Preferencia de Contacto"
                          id="contact_preference"
                          required
                          icon={Phone}
                          value={preferenceSelected}
                          onChange={(e) =>
                            setPreferenceSelected(e.target.value)
                          }
                        >
                          <option value="email">Email</option>
                          <option value="llamada">Llamada telefónica</option>
                          <option value="cafe">
                            Café presencial (Canarias)
                          </option>
                        </FormSelect>
                        <FormInput
                          label="Correo Electrónico"
                          id="email"
                          type="email"
                          required
                          autoComplete="email"
                          placeholder="ejemplo@correo.com"
                          icon={Mail}
                        />
                        <FormInput
                          label="Teléfono (Opcional)"
                          id="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="Ej: 600123456"
                          icon={Phone}
                        />
                      </div>
                    </motion.div>

                    {/* Section 2: Síntomas */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    >
                      <SectionTitle icon={AlertTriangle}>
                        Síntomas y Problemas Detectados
                      </SectionTitle>

                      {/* 1. Casilla de texto libre destacada */}
                      <div className="flex flex-col mb-6">
                        <label
                          className="text-base font-semibold text-white mb-1.5 flex items-center gap-2"
                          htmlFor="free_text"
                        >
                          <FileText
                            className="w-4 h-4 text-primary"
                            aria-hidden="true"
                          />
                          <span>Cuéntanos qué te está pasando:</span>
                        </label>
                        <p className="text-xs md:text-sm text-slate-300 mb-3 leading-relaxed">
                          Describe tu situación con tus propias palabras.
                          Nuestro motor de IA analizará tu caso y detectará los
                          problemas reales.
                        </p>
                        <textarea
                          className="w-full bg-slate-950/60 border border-white/15 rounded-xl p-4 text-white placeholder:text-slate-500 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:bg-slate-950/80 focus:outline-none transition-all duration-200 text-sm md:text-base leading-relaxed"
                          id="free_text"
                          name="free_text"
                          rows={4}
                          value={freeTextValue}
                          onChange={(e) => {
                            setFreeTextValue(e.target.value);
                            if (validationError) setValidationError(null);
                          }}
                          placeholder='Ej: "Los pedidos entran por la tablet de la app de delivery, pero no se sincronizan con nuestro TPV. Tenemos que teclear cada comanda a mano, lo que genera retrasos y descuadres."'
                        />
                      </div>

                      {/* 2. Acordeón para problemas comunes */}
                      <div className="border border-white/10 rounded-xl bg-slate-950/40 backdrop-blur-sm overflow-hidden mb-6">
                        <button
                          type="button"
                          onClick={() => setIsPredefinedOpen(!isPredefinedOpen)}
                          aria-expanded={isPredefinedOpen}
                          aria-controls="predefined-problems-panel"
                          className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-white/[0.03] transition-colors cursor-pointer group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3">
                            <span className="text-sm md:text-base font-semibold text-white group-hover:text-primary transition-colors">
                              ¿Prefieres marcar problemas comunes?{" "}
                              <span className="text-slate-400 font-normal text-xs md:text-sm">
                                (opcional)
                              </span>
                            </span>
                            {selectedProblems.length > 0 && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/20 text-primary border border-primary/30 w-fit">
                                {selectedProblems.length}{" "}
                                {selectedProblems.length === 1
                                  ? "seleccionado"
                                  : "seleccionados"}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-400 group-hover:text-primary transition-colors shrink-0">
                            <span>
                              {isPredefinedOpen
                                ? "Ocultar opciones predefinidas"
                                : "Mostrar opciones predefinidas"}
                            </span>
                            {isPredefinedOpen ? (
                              <ChevronUp
                                className="w-4 h-4 transition-transform duration-200"
                                aria-hidden="true"
                              />
                            ) : (
                              <ChevronDown
                                className="w-4 h-4 transition-transform duration-200"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                        </button>

                        {/* Panel desplegable con las opciones predefinidas */}
                        <AnimatePresence initial={false}>
                          {isPredefinedOpen && (
                            <motion.div
                              id="predefined-problems-panel"
                              role="region"
                              aria-label="Opciones predefinidas de problemas"
                              key="predefined-options"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3, ease: "easeInOut" }}
                              className="overflow-hidden border-t border-white/10"
                            >
                              <div className="p-4 md:p-6 bg-slate-950/20">
                                <p className="text-xs text-slate-300 mb-4">
                                  Marca las situaciones que reconozcas en tu
                                  negocio (puedes seleccionar tantas como
                                  desees):
                                </p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {problems.map((prob) => {
                                    const isChecked = selectedProblems.includes(
                                      prob.id,
                                    );
                                    return (
                                      <label
                                        key={prob.id}
                                        htmlFor={`problem-${prob.id}`}
                                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                                          isChecked
                                            ? "bg-primary/15 border-primary/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                                            : "bg-slate-900/40 border-white/10 hover:border-white/20 hover:bg-slate-900/60 text-slate-300"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          id={`problem-${prob.id}`}
                                          className="h-4 w-4 mt-0.5 rounded border-white/20 bg-slate-950/80 text-primary focus:ring-primary/40 focus:ring-offset-0 focus:outline-none transition-colors cursor-pointer shrink-0"
                                          checked={isChecked}
                                          onChange={() =>
                                            toggleProblem(prob.id)
                                          }
                                        />
                                        <span
                                          className={`text-xs md:text-sm font-medium leading-snug ${
                                            isChecked
                                              ? "text-white font-semibold"
                                              : "text-slate-300"
                                          }`}
                                        >
                                          {prob.name}
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Mensaje de validación amigable si se intenta enviar vacío */}
                      {validationError && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          role="alert"
                          aria-live="assertive"
                          className="p-4 mb-6 rounded-xl bg-destructive/10 border border-destructive/30 flex items-center gap-3 text-destructive text-sm font-medium"
                        >
                          <AlertCircle
                            className="w-5 h-5 shrink-0"
                            aria-hidden="true"
                          />
                          <span>{validationError}</span>
                        </motion.div>
                      )}
                    </motion.div>

                    {/* Submit */}
                    <motion.div
                      className="pt-2"
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                    >
                      <button
                        className="w-full md:w-auto px-8 py-3.5 bg-primary-solid text-white hover:bg-primary-solid-hover transition-all duration-300 font-semibold rounded-xl text-sm md:text-base flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                        type="submit"
                        disabled={loading}
                      >
                        <Send className="w-4 h-4" aria-hidden="true" />
                        Generar Diagnóstico Técnico
                      </button>
                    </motion.div>
                  </motion.form>
                )}
              </AnimatePresence>

              {/* Debug Output (Solo visible durante desarrollo local) */}
              {import.meta.env.DEV && debugOutput && !loading && (
                <div className="mt-8 border-t border-white/10 pt-6">
                  <details className="cursor-pointer group">
                    <summary className="text-xs text-slate-400 hover:text-white select-none outline-none">
                      Ver salida de depuración API (Solo Dev)
                    </summary>
                    <pre className="mt-4 bg-slate-950/80 p-4 border border-white/10 rounded-xl text-[10px] text-primary/80 overflow-x-auto font-mono max-h-60">
                      {debugOutput}
                    </pre>
                  </details>
                </div>
              )}
            </motion.div>
          </section>
        </main>

        <footer role="contentinfo">
          <Footer />
        </footer>
      </div>
      <WhatsAppButton />
    </div>
  );
}
