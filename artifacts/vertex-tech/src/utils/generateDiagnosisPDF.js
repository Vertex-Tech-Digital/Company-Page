"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDiagnosisPDF = generateDiagnosisPDF;
const react_1 = __importDefault(require("react"));
// @ts-expect-error -- módulo JS sin tipos
const invoice_pdf_js_1 = require("../../server/invoice-pdf.js");

// El adaptador necesita parchear APIs globales mientras se renderiza el PDF.
// Serializarlo evita que dos invocaciones se pisen entre sí.
let pdfGenerationQueue = Promise.resolve();

/**
 * Genera el PDF de diagnóstico corporativo adaptando la API de invoice-pdf.js.
 *
 * @param leadData Datos del lead (companyName, sector, size, markedProblems, detectedProblems, email, phone, contactPreference, createdAt).
 * @param fullProblemsList Listado completo de problemas tecnológicos disponibles en el sistema.
 * @returns Promesa que resuelve a un Buffer con el PDF generado en memoria.
 */
async function generateDiagnosisPDF(leadData, fullProblemsList) {
  const previousGeneration = pdfGenerationQueue;
  let releaseGeneration;
  pdfGenerationQueue = new Promise((resolve) => {
    releaseGeneration = resolve;
  });
  await previousGeneration;

  try {
    // Carga dinámica de @react-pdf/renderer para compatibilidad ESM en Vercel
    const pdfRenderer = await import("@react-pdf/renderer");
    const { View, Text, Font } = pdfRenderer.default || pdfRenderer;

    try {
      Font.registerHyphenationCallback((word) => [word]);
    } catch {
      // Evita errores de registro duplicado
    }

    const h = react_1.default.createElement;
    const servicePriority = {
      Automatización: 1,
      "Integración de APIs": 2,
      "Software a Medida": 3,
      "Automatización con IA": 4,
      "QA & Testing": 5,
    };
    const serviceDescriptions = {
      Automatización:
        "Establecimiento de flujos de trabajo iniciales. Sincronización automática de datos entre plataformas básicas para mitigar los errores humanos del copiado repetitivo.",
      "Integración de APIs":
        "Interconexión avanzada de ecosistemas. Construcción de puentes técnicos seguros para unificar herramientas independientes (TPV, pasarelas de pago, CRMs) sin sustituirlas.",
      "Software a Medida":
        "Digitalización del núcleo del negocio. Desarrollo de módulos core (motores de reserva propios, ERPs ligeros, control de stock automatizado) ajustados 100% a tus reglas operativas.",
      "Automatización con IA":
        "Inteligencia operativa avanzada. Implementación de asistentes virtuales autónomos y agentes LLM para clasificar información, resolver dudas de clientes y operar 24/7.",
      "QA & Testing":
        "Aseguramiento de infraestructura. Auditorías exhaustivas de rendimiento y optimización de bases de datos/servidores para mitigar caídas de la web ante picos reales de tráfico.",
    };

    // 1. Mapeo de problemas y servicios
    const markedIds = leadData.markedProblems || leadData.marked_problems || [];
    const detectedIds =
      leadData.detectedProblems || leadData.detected_problems || [];
    const markedProblems = markedIds
      .map((id) =>
        fullProblemsList.find((p) => p && Number(p.id) === Number(id)),
      )
      .filter(Boolean);
    const detectedProblems = detectedIds
      .map((id) =>
        fullProblemsList.find((p) => p && Number(p.id) === Number(id)),
      )
      .filter(Boolean);
    const aiResult =
      leadData.diagnosisSource === "ai" && leadData.aiRoadmap
        ? leadData.aiRoadmap
        : null;
    const aiProblems = Array.isArray(aiResult?.problems)
      ? aiResult.problems
      : [];
    const aiProblemById = new Map(
      aiProblems.map((problem) => [Number(problem.problem_id), problem]),
    );
    const aiServiceById = new Map(
      (Array.isArray(aiResult?.services) ? aiResult.services : []).map(
        (item) => [Number(item.problem_id), item.service],
      ),
    );

    // Roadmap en Fases (Servicios Vertex únicos asociados)
    const allProblems = [...markedProblems, ...detectedProblems];
    const uniqueServices = Array.from(
      new Set(allProblems.map((p) => p.vertexService).filter(Boolean)),
    ).sort((a, b) => (servicePriority[a] || 99) - (servicePriority[b] || 99));

    // 2. CTA adaptado según preferencia de contacto
    const preference = (
      leadData.contactPreference ||
      leadData.contact_preference ||
      ""
    )
      .toLowerCase()
      .trim();
    let ctaText =
      "Nos pondremos en contacto contigo pronto para profundizar en el roadmap y compartir los siguientes pasos.";
    if (
      preference === "email" ||
      preference.includes("email") ||
      preference.includes("correo")
    ) {
      ctaText =
        "Seguiremos la conversación a través de este canal para resolver cualquier duda técnica sobre el informe.";
    } else if (
      preference === "cafe" ||
      preference === "café" ||
      preference.includes("cafe") ||
      preference.includes("café")
    ) {
      ctaText =
        "Nos coordinaremos pronto para tomar el café solicitado en Canarias y profundizar en los detalles de este roadmap.";
    } else if (
      preference === "llamada" ||
      preference.includes("llamada") ||
      preference.includes("telefono") ||
      preference.includes("teléfono")
    ) {
      ctaText =
        "Un consultor de nuestro equipo te llamará en el horario más cómodo para evaluar juntos estas recomendaciones.";
    }

    // 3. Formatear la fecha
    const rawDate = leadData.createdAt || leadData.created_at || new Date();
    const dateObj = rawDate instanceof Date ? rawDate : new Date(rawDate);
    const formattedDate = dateObj.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // 4. Configurar los contenidos para la sección de Notas
    const sectionHeader = (key, label, marginTop) =>
      h(
        View,
        {
          key,
          style: {
            borderBottomWidth: 1,
            borderBottomColor: "#cbd5e1",
            paddingBottom: 4,
            marginTop,
            marginBottom: 10,
          },
        },
        h(
          Text,
          {
            style: {
              fontFamily: "Helvetica-Bold",
              fontSize: 11,
              color: "#1e3a8a",
            },
          },
          label,
        ),
      );

    const ctaBox = h(
      View,
      {
        key: "sec-e-cta-box",
        style: {
          backgroundColor: "#f8fafc",
          borderColor: "#cbd5e1",
          borderWidth: 1,
          borderRadius: 6,
          padding: 12,
          marginTop: 4,
          borderLeftWidth: 4,
          borderLeftColor: "#1e3a8a",
        },
      },
      [
        h(
          Text,
          {
            key: "sec-e-cta-title",
            style: {
              fontFamily: "Helvetica-Bold",
              fontSize: 10,
              color: "#1e3a8a",
              marginBottom: 4,
            },
          },
          "Llamada a la Acción:",
        ),
        h(
          Text,
          {
            key: "sec-e-cta-text",
            style: {
              fontSize: 9,
              color: "#334155",
              fontFamily: "Helvetica-Oblique",
              lineHeight: 1.35,
              width: "100%",
            },
          },
          ctaText,
        ),
      ],
    );

    const problemCard = ({ keyPrefix, accentColor, children }) =>
      h(
        View,
        {
          key: `${keyPrefix}-card`,
          style: {
            backgroundColor: "#f8fafc",
            borderLeftWidth: 3,
            borderLeftColor: accentColor,
            padding: 10,
            borderRadius: 4,
            marginBottom: 10,
          },
        },
        children,
      );

    const cardText = (key, content) =>
      h(
        Text,
        {
          key,
          style: {
            fontSize: 9,
            color: "#334155",
            marginTop: 6,
            marginLeft: 12,
            lineHeight: 1.4,
          },
        },
        content,
      );

    // Divide el roadmap continuo del LLM ("Fase 1: ... Fase 2: ...") en
    // líneas independientes. Devuelve null si el texto no sigue el patrón.
    const parseRoadmapPhases = (roadmapText) => {
      const phases = String(roadmapText || "")
        .split(/(?=Fase\s+\d+\s*:)/i)
        .map((phase) => phase.trim())
        .filter(Boolean);
      const hasPhasePattern = phases.some((phase) =>
        /^Fase\s+\d+\s*:/i.test(phase),
      );
      return hasPhasePattern ? phases : null;
    };

    const roadmapBlock = (key, roadmapText) => {
      const phases = parseRoadmapPhases(roadmapText);

      if (!phases) {
        return cardText(
          key,
          `Plan de Acción: ${String(roadmapText || "").trim()}`,
        );
      }

      return h(
        View,
        {
          key,
          style: {
            marginTop: 6,
            marginLeft: 12,
            marginBottom: 4,
          },
        },
        [
          h(
            Text,
            {
              key: `${key}-title`,
              style: {
                fontFamily: "Helvetica-Bold",
                fontSize: 9,
                color: "#334155",
                marginBottom: 2,
                lineHeight: 1.4,
              },
            },
            "Plan de Acción:",
          ),
          ...phases.map((phase, phaseIdx) =>
            h(
              Text,
              {
                key: `${key}-fase-${phaseIdx}`,
                style: {
                  fontSize: 9,
                  color: "#334155",
                  marginBottom: phaseIdx === phases.length - 1 ? 0 : 3,
                  lineHeight: 1.4,
                },
              },
              `• ${phase}`,
            ),
          ),
        ],
      );
    };

    // --- RAMA IA: Resumen ejecutivo + lista única de problemas (sin duplicados) ---
    const aiNotesContent = () => [
      sectionHeader("sec-c-header", "C. RESUMEN EJECUTIVO", 10),
      h(
        View,
        {
          key: "executive-summary-box",
          style: {
            backgroundColor: "#eff6ff",
            borderLeftWidth: 3,
            borderLeftColor: "#2563eb",
            padding: 10,
            borderRadius: 4,
            marginBottom: 10,
          },
        },
        h(
          Text,
          {
            key: "executive-summary-text",
            style: {
              fontSize: 9.5,
              color: "#1e293b",
              lineHeight: 1.45,
            },
          },
          String(aiResult.diagnosis || ""),
        ),
      ),
      sectionHeader(
        "sec-d-header",
        "D. DIAGNÓSTICO DE PROBLEMAS Y PLAN DE ACCIÓN",
        14,
      ),
      ...allProblems.map((problem, idx) => {
        const aiProblem = aiProblemById.get(Number(problem.id));
        const isConfirmed = markedProblems.some(
          (marked) => Number(marked.id) === Number(problem.id),
        );
        const badgeLabel = isConfirmed ? "Confirmado" : "Sugerido";
        const accentColor = isConfirmed ? "#1e3a8a" : "#d97706";

        if (!aiProblem) {
          return problemCard({
            keyPrefix: `p-${idx}`,
            accentColor,
            children: [
              h(
                Text,
                {
                  key: `p-title-${idx}`,
                  style: {
                    fontFamily: "Helvetica-Bold",
                    fontSize: 11,
                    color: accentColor,
                  },
                },
                `${problem.name} (${badgeLabel})`,
              ),
              roadmapBlock(`p-rec-${idx}`, problem.recommendation),
              cardText(
                `p-svc-${idx}`,
                `Servicio Vertex: ${problem.vertexService}`,
              ),
            ],
          });
        }

        return problemCard({
          keyPrefix: `p-${idx}`,
          accentColor,
          children: [
            h(
              View,
              {
                key: `p-title-row-${idx}`,
                style: {
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              },
              [
                h(
                  Text,
                  {
                    key: `p-title-${idx}`,
                    style: {
                      fontFamily: "Helvetica-Bold",
                      fontSize: 11,
                      color: "#1e3a8a",
                      flex: 1,
                    },
                  },
                  problem.name,
                ),
                h(
                  View,
                  {
                    key: `p-badge-${idx}`,
                    style: {
                      backgroundColor: isConfirmed ? "#dbeafe" : "#fef3c7",
                      paddingHorizontal: 6,
                      paddingVertical: 2,
                      borderRadius: 3,
                      marginLeft: 8,
                    },
                  },
                  h(
                    Text,
                    {
                      style: {
                        fontSize: 7.5,
                        fontFamily: "Helvetica-Bold",
                        color: accentColor,
                      },
                    },
                    badgeLabel,
                  ),
                ),
              ],
            ),
            cardText(
              `p-diagnosis-${idx}`,
              `Impacto Operativo: ${String(aiProblem.diagnosis || "")}`,
            ),
            roadmapBlock(`p-roadmap-${idx}`, aiProblem.roadmap),
            cardText(
              `p-service-${idx}`,
              `Servicio Vertex: ${
                aiServiceById.get(Number(problem.id)) || problem.vertexService
              }`,
            ),
          ],
        });
      }),
      sectionHeader("sec-e-header", "E. PRÓXIMOS PASOS", 14),
      ctaBox,
    ];

    // --- RAMA FALLBACK: secciones clásicas con recomendaciones estáticas ---
    const fallbackNotesContent = () => [
      sectionHeader(
        "sec-c-header",
        "C. DIAGNÓSTICO DE PROBLEMAS CONFIRMADOS",
        10,
      ),
      ...markedProblems.map((problem, idx) =>
        problemCard({
          keyPrefix: `m-${idx}`,
          accentColor: "#1e3a8a",
          children: [
            h(
              Text,
              {
                key: `m-title-${idx}`,
                style: {
                  fontFamily: "Helvetica-Bold",
                  fontSize: 11,
                  color: "#1e3a8a",
                },
              },
              `${problem.name} (Confirmado)`,
            ),
            cardText(
              `m-rec-${idx}`,
              `Recomendación: ${problem.recommendation}`,
            ),
          ],
        }),
      ),
      ...(detectedProblems.length > 0 || leadData.freeText || leadData.free_text
        ? [
            sectionHeader(
              "sec-d-header",
              "D. DETECCIÓN INTELIGENTE (SUGERENCIAS DEL MOTOR)",
              14,
            ),
            ...(detectedProblems.length > 0
              ? detectedProblems.map((problem, idx) =>
                  problemCard({
                    keyPrefix: `d-${idx}`,
                    accentColor: "#d97706",
                    children: [
                      h(
                        Text,
                        {
                          key: `d-title-${idx}`,
                          style: {
                            fontFamily: "Helvetica-Bold",
                            fontSize: 11,
                            color: "#d97706",
                          },
                        },
                        `Detectamos también que podrías estar experimentando: ${problem.name} (Sugerido)`,
                      ),
                      cardText(
                        `d-rec-${idx}`,
                        `Recomendación: ${problem.recommendation}`,
                      ),
                    ],
                  }),
                )
              : [
                  problemCard({
                    keyPrefix: "d-freetext",
                    accentColor: "#d97706",
                    children: [
                      h(
                        Text,
                        {
                          key: "d-title-freetext",
                          style: {
                            fontFamily: "Helvetica-Bold",
                            fontSize: 11,
                            color: "#d97706",
                          },
                        },
                        "Análisis de texto libre:",
                      ),
                      cardText(
                        "d-rec-freetext",
                        "Evaluando requerimientos adicionales basados en la solicitud del cliente.",
                      ),
                    ],
                  }),
                ]),
          ]
        : []),
      sectionHeader(
        "sec-e-header",
        "E. ROADMAP CONCEPTUAL Y LLAMADA A LA ACCIÓN (CTA)",
        14,
      ),
      h(
        Text,
        {
          key: "sec-e-intro",
          style: {
            fontFamily: "Helvetica-Bold",
            fontSize: 9.5,
            color: "#334155",
            marginBottom: 8,
          },
        },
        "Roadmap en Fases:\n",
      ),
      h(
        View,
        {
          key: "sec-e-phases-container",
          style: {
            marginBottom: 14,
            paddingLeft: 8,
          },
        },
        uniqueServices.map((service, idx) =>
          h(
            View,
            {
              key: `service-row-${idx}`,
              style: {
                flexDirection: "column",
                alignItems: "flex-start",
                marginBottom: 8,
              },
            },
            [
              h(
                Text,
                {
                  key: `service-title-${idx}`,
                  style: {
                    fontSize: 9.5,
                    fontFamily: "Helvetica-Bold",
                    color: "#1e3a8a",
                    marginBottom: 2,
                  },
                },
                `Fase ${idx + 1}: ${service}`,
              ),
              h(
                Text,
                {
                  key: `service-desc-${idx}`,
                  style: {
                    fontSize: 8.5,
                    fontFamily: "Helvetica",
                    color: "#475569",
                    marginLeft: 12,
                    lineHeight: 1.3,
                  },
                },
                serviceDescriptions[service] ||
                  "Planificación, desarrollo e implantación del servicio adaptado.",
              ),
            ],
          ),
        ),
      ),
      ctaBox,
    ];

    const notesContent = aiResult ? aiNotesContent() : fallbackNotesContent();

    const originalCreateElement = react_1.default.createElement;
    const OriginalNumberFormat = Intl.NumberFormat;

    try {
      // 6. Sobrescribir Intl.NumberFormat para evitar que se renderice precios
      // @ts-expect-error -- parche intencional de API global durante el render
      Intl.NumberFormat = function (locale, options) {
        if (
          options &&
          options.style === "currency" &&
          options.currency === "EUR"
        ) {
          return {
            format: () => "",
          };
        }
        return new OriginalNumberFormat(locale, options);
      };

      // 7. Sobrescribir React.createElement para adaptar invoice-pdf.js
      // @ts-expect-error -- parche intencional de createElement durante el render
      react_1.default.createElement = function (type, props, ...children) {
        if (
          type === "Text" ||
          type === Text ||
          (type && (type.displayName === "Text" || type.name === "Text"))
        ) {
          if (
            props &&
            props.style &&
            props.style.color === "#6b7280" &&
            props.style.lineHeight === 1.5
          ) {
            return originalCreateElement(
              View,
              { style: { marginTop: 10 } },
              ...children,
            );
          }
          if (typeof children[0] === "string") {
            const content = children[0];
            if (content.includes("NIF/CIF") || content.includes("NIF/CIF:")) {
              const cleanContent = content.replace(/NIF\/CIF:?/gi, "NIF:");
              return originalCreateElement(type, props, cleanContent);
            }
            if (content === "FACTURA" || content === "INVOICE") {
              return originalCreateElement(
                type,
                props,
                "A. DIAGNÓSTICO TÉCNICO",
              );
            }
            if (content === "Notas" || content === "Notes") {
              return originalCreateElement(
                type,
                props,
                "RESULTADOS DEL DIAGNÓSTICO",
              );
            }
            if (content === "Nº de factura:" || content === "Invoice no.:") {
              return originalCreateElement(type, props, "ID de Lead:");
            }
            if (content === "Fecha de emisión:" || content === "Issue date:") {
              return originalCreateElement(type, props, "Fecha de Emisión:");
            }
            if (
              content.startsWith("NIF:") ||
              content.startsWith("Tax ID:") ||
              content.startsWith("Epígrafe IAE:") ||
              content.startsWith("Business activity code:")
            ) {
              return null;
            }
            if (content === "vertextechdigital.com/diagnostico") {
              if (props && props.style && props.style.marginTop === 3) {
                return originalCreateElement(
                  type,
                  {
                    ...props,
                    style: {
                      ...props.style,
                      color: "#475569",
                      fontSize: 8.5,
                      fontFamily: "Helvetica",
                      marginTop: 4,
                      maxWidth: 400,
                    },
                  },
                  "Enlace público de origen: vertextechdigital.com/diagnostico",
                );
              }
            }
          }
        }

        // 8. Ocultar la cabecera de la tabla de facturación
        if (
          props &&
          props.style &&
          props.style.flexDirection === "row" &&
          props.style.borderBottomWidth === 1 &&
          props.style.paddingBottom === 6
        ) {
          return null;
        }

        // 9. Ocultar filas de la tabla de facturación
        if (
          props &&
          props.style &&
          props.style.flexDirection === "row" &&
          props.style.paddingVertical === 6 &&
          props.style.borderBottomWidth === 1
        ) {
          return null;
        }

        // 10. Ocultar el bloque de totales
        if (
          props &&
          props.style &&
          props.style.marginTop === 16 &&
          props.style.alignSelf === "flex-end" &&
          props.style.width === 240
        ) {
          return null;
        }

        // 11. Modificar estilos para el título
        if (props && props.style) {
          if (props.style.fontSize === 22 && props.style.color === "#2563eb") {
            props.style = {
              ...props.style,
              fontSize: 12,
              color: "#1e3a8a",
              fontFamily: "Helvetica-Bold",
            };
          }
        }

        // 12. Interceptar el billedBox original
        if (
          props &&
          props.style &&
          props.style.borderRadius === 4 &&
          props.style.borderWidth === 1
        ) {
          return originalCreateElement(
            View,
            {
              style: {
                backgroundColor: "#f8fafc",
                borderColor: "#cbd5e1",
                borderWidth: 1,
                borderRadius: 6,
                padding: 12,
                marginBottom: 16,
              },
            },
            [
              originalCreateElement(
                Text,
                {
                  key: "client-box-header",
                  style: {
                    fontSize: 8.5,
                    fontFamily: "Helvetica-Bold",
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: 1,
                    marginBottom: 8,
                  },
                },
                "B. METADATOS DEL LEAD / CLIENTE",
              ),
              originalCreateElement(
                View,
                {
                  key: "row-name",
                  style: {
                    flexDirection: "row",
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#e2e8f0",
                    paddingVertical: 4,
                  },
                },
                [
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        width: 140,
                        fontFamily: "Helvetica-Bold",
                        fontSize: 9,
                        color: "#475569",
                      },
                    },
                    "Nombre de la Empresa:",
                  ),
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        flex: 1,
                        fontSize: 9,
                        color: "#1e293b",
                        fontFamily: "Helvetica",
                      },
                    },
                    leadData.companyName || leadData.company_name || "",
                  ),
                ],
              ),
              originalCreateElement(
                View,
                {
                  key: "row-sector",
                  style: {
                    flexDirection: "row",
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#e2e8f0",
                    paddingVertical: 4,
                  },
                },
                [
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        width: 140,
                        fontFamily: "Helvetica-Bold",
                        fontSize: 9,
                        color: "#475569",
                      },
                    },
                    "Sector Industrial:",
                  ),
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        flex: 1,
                        fontSize: 9,
                        color: "#1e293b",
                        fontFamily: "Helvetica",
                      },
                    },
                    leadData.sector || "",
                  ),
                ],
              ),
              originalCreateElement(
                View,
                {
                  key: "row-size",
                  style: {
                    flexDirection: "row",
                    borderBottomWidth: 0.5,
                    borderBottomColor: "#e2e8f0",
                    paddingVertical: 4,
                  },
                },
                [
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        width: 140,
                        fontFamily: "Helvetica-Bold",
                        fontSize: 9,
                        color: "#475569",
                      },
                    },
                    "Tamaño de la Empresa:",
                  ),
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        flex: 1,
                        fontSize: 9,
                        color: "#1e293b",
                        fontFamily: "Helvetica",
                      },
                    },
                    leadData.size || "",
                  ),
                ],
              ),
              originalCreateElement(
                View,
                {
                  key: "row-email",
                  style: {
                    flexDirection: "row",
                    borderBottomWidth: leadData.phone ? 0.5 : 0,
                    borderBottomColor: "#e2e8f0",
                    paddingVertical: 4,
                  },
                },
                [
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        width: 140,
                        fontFamily: "Helvetica-Bold",
                        fontSize: 9,
                        color: "#475569",
                      },
                    },
                    "Correo Electrónico:",
                  ),
                  originalCreateElement(
                    Text,
                    {
                      style: {
                        flex: 1,
                        fontSize: 9,
                        color: "#1e293b",
                        fontFamily: "Helvetica",
                      },
                    },
                    leadData.email || "",
                  ),
                ],
              ),
              leadData.phone
                ? originalCreateElement(
                    View,
                    {
                      key: "row-phone",
                      style: { flexDirection: "row", paddingVertical: 4 },
                    },
                    [
                      originalCreateElement(
                        Text,
                        {
                          style: {
                            width: 140,
                            fontFamily: "Helvetica-Bold",
                            fontSize: 9,
                            color: "#475569",
                          },
                        },
                        "Teléfono de Contacto:",
                      ),
                      originalCreateElement(
                        Text,
                        {
                          style: {
                            flex: 1,
                            fontSize: 9,
                            color: "#1e293b",
                            fontFamily: "Helvetica",
                          },
                        },
                        leadData.phone,
                      ),
                    ],
                  )
                : null,
            ].filter(Boolean),
          );
        }
        return originalCreateElement.apply(this, [type, props, ...children]);
      };

      // 13. Estructurar datos
      const invoiceNumber = `VT-LEAD-${leadData.id || "000"}`;
      const dataForInvoice = {
        language: "es",
        invoiceNumber: invoiceNumber,
        issueDate: formattedDate,
        company: {
          companyName: "Vertex Tech Digital",
          nif:
            process.env.VITE_COMPANY_TAX_ID ||
            process.env.COMPANY_TAX_ID ||
            "[Tax ID]",
          address: "",
          email: "vertextechdigital.com/diagnostico",
          iae: "",
        },
        client: {
          legalName: leadData.companyName || leadData.company_name || "",
          nif: leadData.sector || "",
          address: leadData.size || "",
          email: leadData.email || "",
        },
        items: [],
        totals: {
          subtotal: 0,
          taxAmount: 0,
          total: 0,
        },
        taxRate: 0,
        notes: notesContent,
      };

      // Renderizar
      const resultBuffer = await (0, invoice_pdf_js_1.renderInvoicePdf)(
        dataForInvoice,
      );
      return resultBuffer;
    } finally {
      // Restaurar los métodos globales
      react_1.default.createElement = originalCreateElement;
      Intl.NumberFormat = OriginalNumberFormat;
    }
  } finally {
    releaseGeneration();
  }
}
