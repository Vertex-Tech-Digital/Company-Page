import React from "react";
import { Text, View, Font } from "@react-pdf/renderer";
// @ts-ignore
import { renderInvoicePdf, getCompany } from "../../server/invoice-pdf.js";

// Desactivar globalmente la rotura de palabras con guiones en React PDF
try {
  Font.registerHyphenationCallback((word) => [word]);
} catch (e) {
  // Evita errores de registro duplicado
}

/**
 * Genera el PDF de diagnóstico corporativo adaptando la API de invoice-pdf.js.
 * 
 * @param leadData Datos del lead (companyName, sector, size, markedProblems, detectedProblems, email, phone, contactPreference, createdAt).
 * @param fullProblemsList Listado completo de problemas tecnológicos disponibles en el sistema.
 * @returns Promesa que resuelve a un Buffer con el PDF generado en memoria.
 */
export async function generateDiagnosisPDF(
  leadData: any,
  fullProblemsList: any[]
): Promise<Buffer> {
  const h = React.createElement;

  // 1. Mapeo de problemas y servicios
  const markedIds: number[] = leadData.markedProblems || leadData.marked_problems || [];
  const detectedIds: number[] = leadData.detectedProblems || leadData.detected_problems || [];

  const markedProblems = markedIds
    .map((id) => fullProblemsList.find((p) => p.id === id))
    .filter(Boolean);

  const detectedProblems = detectedIds
    .map((id) => fullProblemsList.find((p) => p.id === id))
    .filter(Boolean);

  // Roadmap en Fases (Servicios Vertex únicos asociados)
  const allProblems = [...markedProblems, ...detectedProblems];
  const uniqueServices = Array.from(
    new Set(allProblems.map((p) => p.vertexService).filter(Boolean))
  );

  // 2. CTA adaptado según preferencia de contacto
  const preference = (leadData.contactPreference || leadData.contact_preference || "").toLowerCase();
  let ctaText = "Nos pondremos en contacto contigo pronto para profundizar en el roadmap y compartir los siguientes pasos.";
  
  if (preference === "cafe") {
    ctaText = "Nos coordinaremos pronto para tomar el café solicitado en Canarias y profundizar en los detalles de este roadmap.";
  } else if (preference === "llamada") {
    ctaText = "Un consultor de nuestro equipo te llamará en el horario más cómodo para evaluar juntos estas recomendaciones.";
  } else if (preference === "email") {
    ctaText = "Seguiremos la conversación a través de este canal para resolver cualquier duda técnica sobre el informe.";
  }

  // 3. Formatear la fecha
  const rawDate = leadData.createdAt || leadData.created_at || new Date();
  const dateObj = rawDate instanceof Date ? rawDate : new Date(rawDate);
  const formattedDate = dateObj.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  // 4. Obtener la compañía emisora
  const companyInfo = getCompany();

  // 5. Configurar los contenidos para la sección de Notas (Resultados del Diagnóstico con Maquetación Profesional)
  const notesContent = [
    // --- SECCIÓN C: PROBLEMAS CONFIRMADOS ---
    h(
      View,
      {
        key: "sec-c-header",
        style: {
          borderBottomWidth: 1,
          borderBottomColor: "#cbd5e1",
          paddingBottom: 4,
          marginTop: 10,
          marginBottom: 10,
        } as any,
      },
      h(
        Text,
        {
          style: {
            fontFamily: "Helvetica-Bold",
            fontSize: 11,
            color: "#1e3a8a", // Azul corporativo principal
          } as any,
        },
        "C. DIAGNÓSTICO DE PROBLEMAS CONFIRMADOS"
      )
    ),
    ...markedProblems.flatMap((p: any, idx) => [
      h(
        View,
        {
          key: `m-card-${idx}`,
          style: {
            backgroundColor: "#f8fafc", // Fondo gris muy claro
            borderLeftWidth: 3,
            borderLeftColor: "#1e3a8a", // Borde azul marino
            padding: 10,
            borderRadius: 4,
            marginBottom: 10,
          } as any,
        },
        [
          h(
            Text,
            {
              key: `m-title-${idx}`,
              style: {
                fontFamily: "Helvetica-Bold",
                fontSize: 11,
                color: "#1e3a8a",
              } as any,
            },
            p.name
          ),
          h(
            Text,
            {
              key: `m-rec-${idx}`,
              style: {
                fontSize: 9,
                color: "#334155", // Gris oscuro para el cuerpo
                marginTop: 6,
                marginLeft: 12, // Sangría a la izquierda
                lineHeight: 1.4,
              } as any,
            },
            `Recomendación: ${p.recommendation}`
          )
        ]
      )
    ]),

    // --- SECCIÓN D: DETECCIÓN INTELIGENTE ---
    ...(detectedProblems.length > 0
      ? [
          h(
            View,
            {
              key: "sec-d-header",
              style: {
                borderBottomWidth: 1,
                borderBottomColor: "#cbd5e1",
                paddingBottom: 4,
                marginTop: 14,
                marginBottom: 10,
              } as any,
            },
            h(
              Text,
              {
                style: {
                  fontFamily: "Helvetica-Bold",
                  fontSize: 11,
                  color: "#1e3a8a",
                } as any,
              },
              "D. DETECCIÓN INTELIGENTE (SUGERENCIAS DEL MOTOR)"
            )
          ),
          ...detectedProblems.flatMap((p: any, idx) => [
            h(
              View,
              {
                key: `d-card-${idx}`,
                style: {
                  backgroundColor: "#f8fafc",
                  borderLeftWidth: 3,
                  borderLeftColor: "#d97706", // Borde ámbar para sugerencias inteligente
                  padding: 10,
                  borderRadius: 4,
                  marginBottom: 10,
                } as any,
              },
              [
                h(
                  Text,
                  {
                    key: `d-title-${idx}`,
                    style: {
                      fontFamily: "Helvetica-Bold",
                      fontSize: 11,
                      color: "#d97706",
                    } as any,
                  },
                  `Detectamos también que podrías estar experimentando: ${p.name}`
                ),
                h(
                  Text,
                  {
                    key: `d-rec-${idx}`,
                    style: {
                      fontSize: 9,
                      color: "#334155",
                      marginTop: 6,
                      marginLeft: 12, // Sangría a la izquierda
                      lineHeight: 1.4,
                    } as any,
                  },
                  `Recomendación: ${p.recommendation}`
                )
              ]
            )
          ]),
        ]
      : []),

    // --- SECCIÓN E: ROADMAP CONCEPTUAL Y CTA ---
    h(
      View,
      {
        key: "sec-e-header",
        style: {
          borderBottomWidth: 1,
          borderBottomColor: "#cbd5e1",
          paddingBottom: 4,
          marginTop: 14,
          marginBottom: 10,
        } as any,
      },
      h(
        Text,
        {
          style: {
            fontFamily: "Helvetica-Bold",
            fontSize: 11,
            color: "#1e3a8a",
          } as any,
        },
        "E. ROADMAP CONCEPTUAL Y LLAMADA A LA ACCIÓN (CTA)"
      )
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
        } as any,
      },
      "Roadmap en Fases:\n"
    ),
    h(
      View,
      {
        key: "sec-e-phases-container",
        style: {
          marginBottom: 14,
          paddingLeft: 8,
        } as any,
      },
      uniqueServices.map((service: any, idx) =>
        h(
          View,
          {
            key: `service-row-${idx}`,
            style: {
              flexDirection: "row",
              alignItems: "flex-start",
              marginBottom: 6,
            } as any,
          },
          [
            h(
              Text,
              {
                style: {
                  fontSize: 9.5,
                  fontFamily: "Helvetica-Bold",
                  color: "#1e3a8a", // Acento azul marino para la viñeta
                  marginRight: 8,
                } as any,
              },
              "-"
            ),
            h(
              Text,
              {
                key: `service-text-${idx}`,
                style: {
                  fontSize: 9.5,
                  fontFamily: "Helvetica-Bold",
                  color: "#334155",
                } as any,
              },
              service
            )
          ]
        )
      )
    ),
    h(
      View,
      {
        key: "sec-e-cta-box",
        style: {
          backgroundColor: "#f8fafc", // Fondo gris claro
          borderColor: "#cbd5e1",
          borderWidth: 1,
          borderRadius: 6,
          padding: 12,
          marginTop: 14,
          borderLeftWidth: 4,
          borderLeftColor: "#1e3a8a", // Acento azul marino izquierdo
        } as any,
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
            } as any,
          },
          "Llamada a la Acción:"
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
            } as any,
          },
          ctaText
        )
      ]
    )
  ];

  // Interceptar React.createElement de forma dinámica y controlada
  const originalCreateElement = React.createElement;
  const OriginalNumberFormat = Intl.NumberFormat;

  try {
    // 6. Sobrescribir Intl.NumberFormat para evitar que se renderice cualquier símbolo de Euro (€) o precios
    // @ts-ignore
    Intl.NumberFormat = function (locale, options) {
      if (options && options.style === "currency" && options.currency === "EUR") {
        return {
          format: () => "",
        };
      }
      return new OriginalNumberFormat(locale, options);
    };

    // 7. Sobrescribir React.createElement para adaptar e interceptar las etiquetas de la caja negra
    // @ts-ignore
    React.createElement = function (type: any, props: any, ...children: any[]) {
      // Si el elemento es un Text, interceptar y modificar etiquetas de texto específicas de invoice-pdf.js
      if (
        type === "Text" ||
        type === Text ||
        (type && (type.displayName === "Text" || type.name === "Text"))
      ) {
        // Interceptar el contenedor de notas. En la caja negra, las notas se renderizan en un componente Text
        // con el estilo notesText (que se reconoce porque tiene color: COLORS.muted y lineHeight: 1.5).
        // Si no se cambia a View, todos los elementos View/Text internos se colapsan inline en un solo párrafo.
        if (props && props.style && props.style.color === "#6b7280" && props.style.lineHeight === 1.5) {
          return originalCreateElement(View, { style: { marginTop: 10 } }, ...children);
        }

        if (typeof children[0] === "string") {
          const content = children[0];

          // Reemplazar título principal
          if (content === "FACTURA" || content === "INVOICE") {
            return originalCreateElement(type, props, "A. IDENTIFICACIÓN Y DIAGNÓSTICO TÉCNICO");
          }
          // Reemplazar etiqueta Notas
          if (content === "Notas" || content === "Notes") {
            return originalCreateElement(type, props, "RESULTADOS DEL DIAGNÓSTICO");
          }
          // Cambiar etiquetas de metadatos de factura a diagnóstico
          if (content === "Nº de factura:" || content === "Invoice no.:") {
            return originalCreateElement(type, props, "ID de Lead:");
          }
          if (content === "Fecha de emisión:" || content === "Issue date:") {
            return originalCreateElement(type, props, "Fecha de Emisión:");
          }

          // Eliminar prefijos de NIF/CIF o IAE del emisor para que no salgan vacíos
          if (
            content.startsWith("NIF/CIF:") ||
            content.startsWith("Tax ID:") ||
            content.startsWith("Epígrafe IAE:") ||
            content.startsWith("Business activity code:")
          ) {
            return null;
          }

          // Reemplazar el email del emisor en el encabezado por el Origen del Reporte
          // Asegurando un ancho máximo suficiente para evitar saltos de línea innecesarios.
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
                  }
                },
                "Enlace público de origen: vertextechdigital.com/diagnostico"
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

      // 11. Modificar dinámicamente los estilos para el título
      if (props && props.style) {
        // Título del documento (DIAGNÓSTICO TÉCNICO)
        if (props.style.fontSize === 22 && props.style.color === "#2563eb") {
          props.style = {
            ...props.style,
            fontSize: 24,
            color: "#1e3a8a", // Azul corporativo marino
            fontFamily: "Helvetica-Bold",
          };
        }
      }

      // 12. Interceptar el billedBox original para sustituirlo por una tabla formal limpia
      // de datos de cliente estructurada en dos columnas con fondo gris claro.
      if (props && props.style && props.style.borderRadius === 4 && props.style.borderWidth === 1) {
        return originalCreateElement(
          View,
          {
            style: {
              backgroundColor: "#f8fafc", // Fondo gris claro corporativo
              borderColor: "#cbd5e1",
              borderWidth: 1,
              borderRadius: 6,
              padding: 12,
              marginBottom: 16,
            } as any,
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
                } as any,
              },
              "B. METADATOS DEL LEAD / CLIENTE"
            ),
            originalCreateElement(View, { key: "row-name", style: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingVertical: 4 } as any }, [
              originalCreateElement(Text, { style: { width: 140, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#475569" } as any }, "Nombre de la Empresa:"),
              originalCreateElement(Text, { style: { flex: 1, fontSize: 9, color: "#1e293b", fontFamily: "Helvetica" } as any }, leadData.companyName || leadData.company_name || "")
            ]),
            originalCreateElement(View, { key: "row-sector", style: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingVertical: 4 } as any }, [
              originalCreateElement(Text, { style: { width: 140, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#475569" } as any }, "Sector Industrial:"),
              originalCreateElement(Text, { style: { flex: 1, fontSize: 9, color: "#1e293b", fontFamily: "Helvetica" } as any }, leadData.sector || "")
            ]),
            originalCreateElement(View, { key: "row-size", style: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0", paddingVertical: 4 } as any }, [
              originalCreateElement(Text, { style: { width: 140, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#475569" } as any }, "Tamaño de la Empresa:"),
              originalCreateElement(Text, { style: { flex: 1, fontSize: 9, color: "#1e293b", fontFamily: "Helvetica" } as any }, leadData.size || "")
            ]),
            originalCreateElement(View, { key: "row-email", style: { flexDirection: "row", borderBottomWidth: leadData.phone ? 0.5 : 0, borderBottomColor: "#e2e8f0", paddingVertical: 4 } as any }, [
              originalCreateElement(Text, { style: { width: 140, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#475569" } as any }, "Correo Electrónico:"),
              originalCreateElement(Text, { style: { flex: 1, fontSize: 9, color: "#1e293b", fontFamily: "Helvetica" } as any }, leadData.email || "")
            ]),
            leadData.phone ? originalCreateElement(View, { key: "row-phone", style: { flexDirection: "row", paddingVertical: 4 } as any }, [
              originalCreateElement(Text, { style: { width: 140, fontFamily: "Helvetica-Bold", fontSize: 9, color: "#475569" } as any }, "Teléfono de Contacto:"),
              originalCreateElement(Text, { style: { flex: 1, fontSize: 9, color: "#1e293b", fontFamily: "Helvetica" } as any }, leadData.phone)
            ]) : null
          ].filter(Boolean)
        );
      }

      return originalCreateElement.apply(this, [type, props, ...children]);
    };

    // 13. Estructurar los datos para pasar a la caja negra de invoice-pdf.js
    const invoiceNumber = `VT-LEAD-${leadData.id || "000"}`;

    const dataForInvoice = {
      language: "es",
      invoiceNumber: invoiceNumber,
      issueDate: formattedDate,
      company: {
        companyName: "Vertex Tech Digital",
        nif: "",
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
      items: [], // Vacío porque ocultamos la tabla
      totals: {
        subtotal: 0,
        taxAmount: 0,
        total: 0,
      },
      taxRate: 0,
      notes: notesContent as any, // Inyectamos nuestro árbol de componentes Text/View estilizados
    };

    // Renderizar
    const resultBuffer = await renderInvoicePdf(dataForInvoice);
    return resultBuffer;
  } finally {
    // Restaurar los métodos globales modificados
    React.createElement = originalCreateElement;
    Intl.NumberFormat = OriginalNumberFormat;
  }
}
