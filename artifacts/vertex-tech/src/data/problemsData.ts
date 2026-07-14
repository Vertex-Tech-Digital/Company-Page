export interface TechProblem {
  id: number;
  name: string;
  keywords: string[];
  recommendation: string;
  vertexService: string;
}

export const problemsData: TechProblem[] = [
  {
    id: 1,
    name: "Tareas manuales repetitivas",
    keywords: [
      "manual",
      "repitiendo",
      "teclear",
      "copiar",
      "pegar",
      "duplicar",
      "a mano",
      "mecanico",
      "mecánico",
      "rutina",
      "tecleando"
    ],
    recommendation: "Eliminar el trabajo mecánico del personal. El equipo se centra en atender, no en copiar datos.",
    vertexService: "Automatización con IA"
  },
  {
    id: 2,
    name: "Sistemas desconectados",
    keywords: [
      "no se habla",
      "separado",
      "doble",
      "distinto",
      "islas",
      "no se comunican",
      "glovo",
      "uber",
      "tpv",
      "desconectado",
      "aislado",
      "integrar"
    ],
    recommendation: "Unificar las herramientas actuales sin sustituirlas. Construir puentes entre sistemas.",
    vertexService: "Integración de APIs"
  },
  {
    id: 3,
    name: "Lentitud o caídas de la web",
    keywords: [
      "lenta",
      "cae",
      "cuelga",
      "tarda",
      "no carga",
      "tiempo de espera",
      "caida",
      "caída",
      "caidas",
      "caídas",
      "servidor",
      "lento"
    ],
    recommendation: "Auditoría de rendimiento y optimización de servidores/bases de datos para soportar picos reales.",
    vertexService: "QA & Testing"
  },
  {
    id: 4,
    name: "Respuesta tardía a clientes",
    keywords: [
      "tardo",
      "no llego",
      "pierdo mensajes",
      "contestar",
      "horario",
      "fuera de hora",
      "demora",
      "responder",
      "whatsapp",
      "espera"
    ],
    recommendation: "Asistentes que responden en segundos. El equipo humano interviene solo cuando importa.",
    vertexService: "Automatización con IA"
  },
  {
    id: 5,
    name: "Facturación manual / Excel",
    keywords: [
      "excel",
      "facturo a mano",
      "papeles",
      "cuadrar",
      "factura",
      "albarán",
      "albaran",
      "albaranes",
      "facturacion",
      "facturación",
      "iva",
      "igic"
    ],
    recommendation: "Sistemas de facturación propios con IGIC/IVA, cobro automático y conciliación bancaria.",
    vertexService: "Software a Medida"
  },
  {
    id: 6,
    name: "Falta de visión del negocio",
    keywords: [
      "no sé",
      "no se",
      "ciego",
      "sin datos",
      "no tengo información",
      "no tengo informacion",
      "no controlo",
      "metricas",
      "métricas",
      "graficos",
      "gráficos",
      "reporte",
      "ventas",
      "compras"
    ],
    recommendation: "Cuadros de mando en tiempo real conectados a TPV, CRM y web. Saber qué se vende y qué se compra al instante.",
    vertexService: "Software a Medida"
  },
  {
    id: 7,
    name: "Errores humanos al copiar datos",
    keywords: [
      "error",
      "equivoco",
      "confundo",
      "olvido",
      "se me fue",
      "equivocación",
      "equivocacion",
      "fallo",
      "despiste",
      "mal",
      "incorrecto"
    ],
    recommendation: "Sincronización automática entre sistemas. Se elimina el factor humano del copiado repetitivo.",
    vertexService: "Automatización"
  },
  {
    id: 8,
    name: "Software antiguo u obsoleto",
    keywords: [
      "antiguo",
      "viejo",
      "obsoleto",
      "lento",
      "windows",
      "legacy",
      "heredado",
      "actualizar",
      "antigua",
      "sistema"
    ],
    recommendation: "Migración controlada a sistemas modernos en la nube, manteniendo la lógica de negocio existente.",
    vertexService: "Software a Medida"
  },
  {
    id: 9,
    name: "Cobros complicados",
    keywords: [
      "tarjeta",
      "bizum",
      "cobro",
      "datáfono",
      "datafono",
      "pasarela",
      "solo efectivo",
      "efectivo",
      "stripe",
      "redsys",
      "pagar"
    ],
    recommendation: "Conexión directa con pasarelas de pago (Stripe/Redsys/Bizum). Cada venta se registra automáticamente.",
    vertexService: "Integración de APIs"
  },
  {
    id: 10,
    name: "Descontrol de stock/inventario",
    keywords: [
      "stock",
      "inventario",
      "almacén",
      "almacen",
      "mermas",
      "faltan",
      "sobrantes",
      "existencias",
      "cuadrar stock",
      "productos",
      "unidades"
    ],
    recommendation: "Digitalización del almacén. Alertas automáticas de stock mínimo y cuadratura de existencias.",
    vertexService: "Software a Medida"
  },
  {
    id: 11,
    name: "Gestión de citas/reservas manual",
    keywords: [
      "cita",
      "reserva",
      "agenda",
      "llamadas",
      "huecos",
      "libro",
      "cuaderno",
      "reservar",
      "citas",
      "reservas"
    ],
    recommendation: "Motor de reservas propio o integrado. El cliente agenda, el sistema confirma y avisa.",
    vertexService: "Software a Medida"
  },
  {
    id: 12,
    name: "Control de ventas y compras",
    keywords: [
      "ventas",
      "compras",
      "proveedores",
      "márgenes",
      "margenes",
      "facturas proveedor",
      "albaranes",
      "proveedor",
      "costes",
      "beneficio",
      "gasto"
    ],
    recommendation: "ERP ligero a medida. Trazabilidad total desde la compra al proveedor hasta la venta final.",
    vertexService: "Software a Medida"
  },
  {
    id: 13,
    name: "Auditoría de software de terceros",
    keywords: [
      "falla",
      "freelancer",
      "otro programa",
      "mal hecho",
      "no funciona",
      "bug",
      "inestable",
      "errores",
      "desarrollador",
      "auditoria",
      "auditoría"
    ],
    recommendation: "Revisión técnica completa: seguridad, legalidad (Veri*Factu, RGPD) y mantenimiento.",
    vertexService: "QA & Testing"
  }
];
