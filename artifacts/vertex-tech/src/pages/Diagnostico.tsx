import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ClipboardList,
  Building2,
  Factory,
  Users,
  Send,
  Sparkles,
  AlertTriangle,
  FileText,
} from "lucide-react";

const problems = [
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
  { id: 13, name: "Software de terceros inestable" },
];

function SectionTitle({
  icon: Icon,
  children,
}: {
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border pb-3 mb-6">
      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <h3
          className="text-xl font-bold text-foreground tracking-wide"
          style={{ fontFamily: "var(--app-font-heading)" }}
        >
          {children}
        </h3>
      </div>
      <span className="ml-auto w-12 h-0.5 bg-primary/40 rounded-full" />
    </div>
  );
}

function FormInput({
  label,
  id,
  type = "text",
  required,
  placeholder,
  icon: Icon,
}: {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex flex-col">
      <label
        className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"
        htmlFor={id}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-primary/70" />}
        {label}
      </label>
      <input
        className="bg-background/50 border border-border/80 rounded-lg py-2.5 px-4 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all duration-200 text-sm"
        type={type}
        id={id}
        name={id}
        required={required}
        placeholder={placeholder}
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
        className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"
        htmlFor={id}
      >
        {Icon && <Icon className="w-3.5 h-3.5 text-primary/70" />}
        {label}
      </label>
      <select
        className="bg-background/50 border border-border/80 rounded-lg py-2.5 px-4 text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all duration-200 text-sm cursor-pointer"
        id={id}
        name={id}
        required={required}
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
  const [markedCount, setMarkedCount] = useState(0);
  const [showTextarea, setShowTextarea] = useState(false);

  const handleCheckboxChange = () => {
    const checkboxes = document.querySelectorAll(
      ".problem-cb",
    ) as NodeListOf<HTMLInputElement>;
    let count = 0;
    checkboxes.forEach((cb) => {
      if (cb.checked) count++;
    });
    setMarkedCount(count);
    if (count >= 3) {
      setShowTextarea(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setSuccessData(null);
    setDebugOutput(null);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const markedProblems: number[] = [];
    const checkboxes = form.querySelectorAll(
      ".problem-cb",
    ) as NodeListOf<HTMLInputElement>;
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
        // En caso de que el servidor devuelva HTML o texto plano (p. ej., error 500 o timeout de Vercel)
        const rawText = await response.text();
        console.error("[Diagnostico Non-JSON Response]:", rawText);
        setDebugOutput(rawText);
        setErrorMsg(
          "El servidor devolvió un error inesperado (no-JSON). Consulta los logs del sistema.",
        );
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
    <main className="min-h-screen text-foreground font-sans bg-background relative overflow-x-hidden">
      <ParticleNetwork />

      <div className="relative" style={{ zIndex: 10 }}>
        <Navbar />

        <section className="pt-32 pb-16 px-4 md:px-8 max-w-5xl mx-auto">
          {/* Hero */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide uppercase">
                Análisis Automatizado
              </span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-600 bg-clip-text text-transparent mb-4"
              style={{ fontFamily: "var(--app-font-heading)" }}
            >
              Diagnóstico Tecnológico
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Evalúa la infraestructura digital y procesos de tu empresa de
              forma automatizada y recibe una hoja de ruta técnica a medida.
            </p>
          </motion.div>

          {/* Main Card */}
          <motion.div
            className="bg-card/50 backdrop-blur-md border border-border/50 rounded-2xl p-6 md:p-10 shadow-[0_0_30px_rgba(59,130,246,0.08)]"
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
                  className="flex flex-col items-center justify-center py-20"
                >
                  <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                    <div className="relative bg-primary/10 p-5 rounded-full border border-primary/20">
                      <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                    </div>
                  </div>
                  <h3
                    className="text-xl font-semibold text-foreground tracking-wide"
                    style={{ fontFamily: "var(--app-font-heading)" }}
                  >
                    Generando tu Diagnóstico...
                  </h3>
                  <p className="text-muted-foreground mt-2 text-center text-sm max-w-sm">
                    Estamos analizando los síntomas de tu negocio, guardando el
                    lead en base de datos y preparando tu reporte en PDF.
                  </p>
                  <div className="flex gap-1.5 mt-6">
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
                  className="bg-destructive/10 border border-destructive/30 rounded-xl p-6"
                >
                  <div className="flex items-start gap-3">
                    <div className="bg-destructive/10 p-2 rounded-lg border border-destructive/20 shrink-0">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h4
                        className="text-lg font-semibold text-destructive"
                        style={{ fontFamily: "var(--app-font-heading)" }}
                      >
                        Error en el proceso
                      </h4>
                      <p className="text-muted-foreground mt-1 text-sm">
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
                        <CheckCircle2 className="h-14 w-14 text-primary" />
                      </div>
                    </div>
                  </motion.div>
                  <h2
                    className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-wide"
                    style={{ fontFamily: "var(--app-font-heading)" }}
                  >
                    ¡Diagnóstico Completado!
                  </h2>
                  <p className="text-muted-foreground text-sm max-w-lg mx-auto mb-8">
                    {successData.emailSent
                      ? "Hemos enviado el reporte de diagnóstico detallado en formato PDF a la dirección de correo electrónico indicada."
                      : "Hemos registrado tu diagnóstico en el sistema. El correo de confirmación está pendiente de configuración o entrega."}
                  </p>

                  {/* Next Steps Card */}
                  <div className="max-w-md mx-auto bg-background/50 border border-border/50 rounded-xl p-6 mb-8 text-left">
                    <h4
                      className="text-foreground font-semibold mb-4 flex items-center gap-2 text-sm"
                      style={{ fontFamily: "var(--app-font-heading)" }}
                    >
                      <ClipboardList className="h-4 w-4 text-primary" />
                      Siguientes Pasos
                    </h4>

                    {preferenceSelected === "cafe" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Has seleccionado{" "}
                          <strong className="text-foreground">
                            Café Presencial
                          </strong>
                          . Nos coordinaremos pronto para reunirnos en Canarias
                          para detallar tu hoja de ruta.
                        </p>
                        <a
                          href="https://wa.me/34600000000?text=Hola!%20Acabo%20de%20hacer%20el%20diagnóstico%20de%20mi%20empresa%20y%20elegí%20la%20opción%20de%20café%20presencial."
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] transition-all duration-300 text-white font-bold rounded-lg text-sm cursor-pointer shadow-[0_4px_24px_0_rgba(37,211,102,0.3)] hover:shadow-[0_4px_32px_0_rgba(37,211,102,0.5)]"
                        >
                          <Coffee className="h-4 w-4" />
                          Coordinar Café por WhatsApp
                        </a>
                      </div>
                    )}

                    {preferenceSelected === "llamada" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Has seleccionado{" "}
                          <strong className="text-foreground">
                            Llamada telefónica
                          </strong>
                          . Un consultor experto te llamará para comentar la
                          auditoría técnica.
                        </p>
                        <a
                          href="tel:+34600000000"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 transition-all duration-300 text-white font-bold rounded-lg text-sm cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                        >
                          <Phone className="h-4 w-4" />
                          Llamar a Vertex Tech Digital
                        </a>
                      </div>
                    )}

                    {preferenceSelected === "email" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          Has seleccionado{" "}
                          <strong className="text-foreground">
                            Correo Electrónico
                          </strong>
                          . Te responderemos directamente a tu email.
                        </p>
                        <a
                          href="mailto:vertextechcontact@gmail.com?subject=Diagnóstico Tecnológico Completado"
                          className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 transition-all duration-300 text-white font-bold rounded-lg text-sm cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
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
                      className="px-6 py-3 bg-secondary border border-border text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-all duration-200 font-semibold rounded-lg text-sm cursor-pointer"
                    >
                      Hacer otro diagnóstico
                    </button>
                    <a
                      href="/"
                      className="px-6 py-3 bg-primary text-white hover:bg-primary/90 transition-all duration-300 font-semibold rounded-lg text-sm flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    >
                      Volver a Inicio <ArrowRight className="h-4 w-4" />
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
                        onChange={(e) => setPreferenceSelected(e.target.value)}
                      >
                        <option value="email">Email</option>
                        <option value="llamada">Llamada telefónica</option>
                        <option value="cafe">Café presencial (Canarias)</option>
                      </FormSelect>
                      <FormInput
                        label="Correo Electrónico"
                        id="email"
                        type="email"
                        required
                        placeholder="ejemplo@correo.com"
                        icon={Mail}
                      />
                      <FormInput
                        label="Teléfono (Opcional)"
                        id="phone"
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

                    <p className="text-sm md:text-base text-muted-foreground mb-5 leading-relaxed">
                      Selecciona todos los problemas que reconozcas actualmente
                      en tu infraestructura digital o procesos:
                    </p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        {markedCount > 0 && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-white text-xs font-bold"
                          >
                            {markedCount}
                          </motion.span>
                        )}
                        {markedCount >= 3 && (
                          <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-xs text-primary font-medium"
                          >
                            ¡Perfecto! Puedes omitir la descripción
                          </motion.span>
                        )}
                      </div>
                      {markedCount > 0 && markedCount < 3 && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="text-xs text-muted-foreground"
                        >
                          Selecciona al menos 3 para omitir la descripción
                        </motion.span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 bg-background/30 border border-border/50 rounded-xl p-4 md:p-6 mb-6">
                      {problems.map((prob, index) => (
                        <motion.label
                          key={prob.id}
                          htmlFor={`problem-${prob.id}`}
                          className="group flex items-center gap-3 p-3 rounded-xl bg-card/30 border border-border/30 hover:border-primary/40 hover:bg-card/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.08)] transition-all duration-300 cursor-pointer select-none"
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.3, delay: index * 0.03 }}
                        >
                          <input
                            type="checkbox"
                            id={`problem-${prob.id}`}
                            className="problem-cb h-4 w-4 rounded border-border bg-background/50 text-primary focus:ring-primary/30 focus:ring-offset-0 focus:outline-none transition-colors cursor-pointer shrink-0"
                            value={prob.id}
                            onChange={handleCheckboxChange}
                          />
                          <span className="text-muted-foreground text-xs md:text-sm font-medium group-hover:text-foreground transition-colors">
                            {prob.name}
                          </span>
                        </motion.label>
                      ))}
                    </div>

                    {/* Textarea condicional */}
                    <AnimatePresence mode="wait">
                      {(markedCount < 3 || showTextarea) && (
                        <motion.div
                          key="textarea"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="flex flex-col">
                            <label
                              className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2"
                              htmlFor="free_text"
                            >
                              <FileText className="w-3.5 h-3.5 text-primary/70" />
                              Descripción Libre / Necesidades
                              {markedCount < 3 && (
                                <span className="text-xs text-destructive font-normal">
                                  (requerido)
                                </span>
                              )}
                            </label>
                            <textarea
                              className="bg-background/50 border border-border/80 rounded-lg py-2.5 px-4 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-primary/30 focus:outline-none transition-all duration-200 text-sm"
                              id="free_text"
                              name="free_text"
                              rows={4}
                              required={markedCount < 3}
                              placeholder="Escribe de forma libre lo que le ocurre a tu plataforma, software o procesos (nuestro motor inteligente detectará problemas adicionales)..."
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Botón "Agregar más detalles" cuando >= 3 y textarea oculto */}
                    {markedCount >= 3 && !showTextarea && (
                      <motion.button
                        type="button"
                        onClick={() => setShowTextarea(true)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer mt-2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <FileText className="w-4 h-4" />
                        ¿Deseas agregar más detalles?
                      </motion.button>
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
                      className="w-full md:w-auto px-8 py-3.5 bg-primary text-white hover:bg-primary/90 transition-all duration-300 font-bold rounded-lg text-sm md:text-base flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      type="submit"
                      disabled={loading}
                    >
                      <Send className="w-4 h-4" />
                      Generar Diagnóstico Técnico
                    </button>
                  </motion.div>
                </motion.form>
              )}
            </AnimatePresence>

            {/* Debug Output */}
            {debugOutput && !loading && (
              <div className="mt-8 border-t border-border pt-6">
                <details className="cursor-pointer group">
                  <summary className="text-xs text-muted-foreground hover:text-muted-foreground/80 select-none outline-none">
                    Ver salida de depuración API (Logs JSON)
                  </summary>
                  <pre className="mt-4 bg-background/80 p-4 border border-border rounded-lg text-[10px] text-primary/70 overflow-x-auto font-mono max-h-60">
                    {debugOutput}
                  </pre>
                </details>
              </div>
            )}
          </motion.div>
        </section>

        <Footer />
      </div>
      <WhatsAppButton />
    </main>
  );
}
