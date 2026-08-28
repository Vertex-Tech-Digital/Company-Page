const { problemsData } = require("../data/problemsData");

const MAX_AI_TEXT_LENGTH = 4000;

// Términos que la IA nunca debe fabricar (precios, ofertas o promesas).
const FORBIDDEN_OUTPUT =
  /€|\$|\b(precio|precios|gratis|gratuit[oa]s?|regalo|regala|regalad[oa]s?|descuento)\b/i;

const STOP_WORDS = new Set(
  "el la los las un una unos unas de del al y o e en con para por que se su sus es son a lo como desde entre sobre tras ante bajo pero mas ya muy también tambien sin".split(
    " ",
  ),
);

// Sinónimos y términos operativos del dominio por problema para evitar falsos positivos en grounding
const DOMAIN_SYNONYMS = {
  1: [
    "proces",
    "tarea",
    "manual",
    "mecani",
    "equipo",
    "tiemp",
    "carga",
    "retras",
    "transc",
    "copia",
    "rutin",
    "jornad",
    "fatiga",
    "horas",
  ],
  2: [
    "integr",
    "sistem",
    "descon",
    "comuni",
    "puente",
    "unific",
    "herram",
    "plataf",
    "conext",
    "aislad",
    "ecosist",
  ],
  3: [
    "servid",
    "rendim",
    "optimi",
    "caida",
    "lentit",
    "trafic",
    "infraest",
    "caidas",
    "latenc",
    "servid",
  ],
  4: [
    "client",
    "atenci",
    "mensaj",
    "respon",
    "demora",
    "asiste",
    "comuni",
    "tiemp",
    "espera",
    "soporte",
  ],
  5: [
    "factur",
    "recibo",
    "planil",
    "contab",
    "asient",
    "impues",
    "tribut",
    "cuadr",
    "descuad",
    "excel",
    "hoja",
    "calcul",
    "fiscal",
    "tribut",
    "emisi",
  ],
  6: [
    "metric",
    "vision",
    "report",
    "inform",
    "contro",
    "datosp",
    "decisi",
    "tabler",
    "cuadro",
    "kpi",
  ],
  7: [
    "error",
    "fallo",
    "despis",
    "equiv",
    "human",
    "datos",
    "sincro",
    "duplic",
    "transc",
    "incons",
  ],
  8: [
    "obsole",
    "migrac",
    "modern",
    "actual",
    "legad",
    "sistem",
    "nube",
    "antigu",
    "infraest",
  ],
  9: [
    "cobr",
    "pago",
    "tarjet",
    "pasare",
    "transa",
    "vent",
    "liquid",
    "concil",
    "fondo",
    "datafo",
    "tpv",
    "acredit",
  ],
  10: [
    "stock",
    "invent",
    "almac",
    "existen",
    "merma",
    "pedid",
    "rotur",
    "sumini",
    "cuadre",
  ],
  11: [
    "reser",
    "citas",
    "agenda",
    "calend",
    "turnos",
    "agend",
    "horari",
    "confirm",
  ],
  12: [
    "compr",
    "vent",
    "provee",
    "gasto",
    "coste",
    "margen",
    "erp",
    "trazab",
    "benef",
  ],
  13: [
    "audit",
    "tercer",
    "seguri",
    "codigo",
    "calida",
    "inesta",
    "fallo",
    "manten",
    "vulner",
  ],
};

function normalizeComparable(text) {
  return String(text ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function stemWord(word) {
  return word.length > 6 ? word.slice(0, 6) : word;
}

// Tallos de palabras significativas (sin acentos ni stop words)
function meaningfulStems(text) {
  const words =
    String(text)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .match(/[a-z0-9ñ]{4,}/g) || [];
  return new Set(words.filter((word) => !STOP_WORDS.has(word)).map(stemWord));
}

function officialConceptsOf(problem) {
  const stems = meaningfulStems(
    `${problem.name} ${problem.recommendation} ${(problem.keywords || []).join(" ")}`,
  );

  if (DOMAIN_SYNONYMS[problem.id]) {
    for (const syn of DOMAIN_SYNONYMS[problem.id]) {
      stems.add(syn);
    }
  }

  return stems;
}

// Grounding suave: el texto generado debe compartir al menos un concepto oficial o de dominio
function sharesOfficialConcept(output, problem) {
  const official = officialConceptsOf(problem);
  if (official.size === 0) return true;
  for (const stem of meaningfulStems(output)) {
    if (official.has(stem)) return true;
  }
  return false;
}

function getProblem(problemId) {
  return problemsData.find((problem) => problem.id === problemId);
}

function validateInputRequirements(markedProblems, freeText) {
  if (!Array.isArray(markedProblems)) {
    return "Los problemas marcados deben ser una lista válida.";
  }

  if (markedProblems.length < 3 && !freeText.trim()) {
    return "La descripción libre es obligatoria si seleccionas menos de 3 problemas.";
  }

  return null;
}

/**
 * Validación post-inferencia de la salida de Gemini/OpenRouter:
 * 1. Estructura JSON válida.
 * 2. Todos los problem_id existen en problemsData.
 * 3. Todos los allowed_problem_ids están presentes en problems.
 * 4. Cada service coincide carácter a carácter con el vertexService del catálogo.
 * 5. diagnosis y roadmap no vacíos y sin copias textuales exactas de recommendation.
 * 6. Anti-inyección: blacklist de precios/promesas y grounding suave.
 */
function validateAiDiagnosis(
  value,
  expectedProblemIds,
  catalog = problemsData,
) {
  const findInCatalog = (problemId) =>
    catalog.find((problem) => problem.id === problemId);

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, reason: "La respuesta de IA no es un objeto." };
  }

  if (typeof value.diagnosis !== "string" || !value.diagnosis.trim()) {
    return {
      valid: false,
      reason: "La respuesta de IA no incluye un diagnosis ejecutivo.",
    };
  }

  if (value.diagnosis.length > MAX_AI_TEXT_LENGTH) {
    return {
      valid: false,
      reason: "El diagnosis ejecutivo supera el límite permitido.",
    };
  }

  if (FORBIDDEN_OUTPUT.test(value.diagnosis)) {
    return {
      valid: false,
      reason:
        "El diagnosis ejecutivo contiene precios o promesas no autorizadas.",
    };
  }

  // Grounding suave del resumen ejecutivo
  const rootConcepts = new Set();
  for (const expectedId of expectedProblemIds) {
    const catalogProblem = findInCatalog(expectedId);
    if (catalogProblem) {
      for (const stem of officialConceptsOf(catalogProblem)) {
        rootConcepts.add(stem);
      }
    }
  }
  if (rootConcepts.size > 0) {
    let rootGrounded = false;
    for (const stem of meaningfulStems(value.diagnosis)) {
      if (rootConcepts.has(stem)) {
        rootGrounded = true;
        break;
      }
    }
    if (!rootGrounded) {
      return {
        valid: false,
        reason: "El diagnosis ejecutivo no está fundamentado en el catálogo.",
      };
    }
  }

  if (!Array.isArray(value.problems) || value.problems.length === 0) {
    return {
      valid: false,
      reason: "La respuesta de IA no incluye la lista de problems.",
    };
  }

  if (!Array.isArray(value.services)) {
    return {
      valid: false,
      reason: "La respuesta de IA no incluye la lista de services.",
    };
  }

  const problemIds = new Set();
  for (const [index, item] of value.problems.entries()) {
    let problemReason = null;

    if (!item || typeof item !== "object" || Array.isArray(item)) {
      problemReason = "no es un objeto";
    } else if (!Number.isInteger(item.problem_id)) {
      problemReason = "problem_id no es un entero";
    } else if (problemIds.has(item.problem_id)) {
      problemReason = "problem_id duplicado";
    } else {
      const catalogProblem = findInCatalog(item.problem_id);
      if (!catalogProblem) {
        problemReason = "problem_id no existe en problemsData";
      } else if (typeof item.diagnosis !== "string" || !item.diagnosis.trim()) {
        problemReason = "diagnosis vacío o no es string";
      } else if (typeof item.roadmap !== "string" || !item.roadmap.trim()) {
        problemReason = "roadmap vacío o no es string";
      } else if (
        item.diagnosis.length > MAX_AI_TEXT_LENGTH ||
        item.roadmap.length > MAX_AI_TEXT_LENGTH
      ) {
        problemReason = "diagnosis o roadmap supera el límite permitido";
      } else {
        const officialRecommendation = normalizeComparable(
          catalogProblem.recommendation,
        );
        const diagnosisText = normalizeComparable(item.diagnosis);
        const roadmapText = normalizeComparable(item.roadmap);

        if (diagnosisText === normalizeComparable(catalogProblem.name)) {
          problemReason =
            "diagnosis tautológica: solo repite el nombre del problema";
        } else if (diagnosisText === officialRecommendation) {
          problemReason =
            "diagnosis es una copia textual exacta de la recommendation del catálogo";
        } else if (roadmapText === officialRecommendation) {
          problemReason =
            "roadmap es una copia textual exacta de la recommendation del catálogo";
        } else if (
          FORBIDDEN_OUTPUT.test(item.diagnosis) ||
          FORBIDDEN_OUTPUT.test(item.roadmap)
        ) {
          problemReason = "contiene precios o promesas no autorizadas";
        } else if (!sharesOfficialConcept(item.diagnosis, catalogProblem)) {
          problemReason = "diagnosis no está fundamentada en el catálogo";
        } else if (!sharesOfficialConcept(item.roadmap, catalogProblem)) {
          problemReason = "roadmap no está fundamentado en el catálogo";
        }
      }
    }

    if (problemReason) {
      const problemId =
        item && typeof item === "object" ? item.problem_id : "desconocido";
      return {
        valid: false,
        reason: `La IA devolvió un problema no válido (índice ${index}, ID ${problemId}: ${problemReason}).`,
      };
    }

    problemIds.add(item.problem_id);
  }

  for (const expectedId of expectedProblemIds) {
    if (!problemIds.has(expectedId)) {
      return {
        valid: false,
        reason: "La IA omitió un problema preseleccionado.",
      };
    }
  }

  if (problemIds.size !== expectedProblemIds.length) {
    return {
      valid: false,
      reason: "La IA intentó añadir un problema fuera del conjunto autorizado.",
    };
  }

  const serviceByProblem = new Map();
  for (const item of value.services) {
    const catalogProblem =
      item && typeof item === "object" ? findInCatalog(item.problem_id) : null;
    if (
      !catalogProblem ||
      serviceByProblem.has(item.problem_id) ||
      typeof item.service !== "string" ||
      item.service !== catalogProblem.vertexService
    ) {
      return {
        valid: false,
        reason:
          "La IA devolvió un servicio que no coincide exactamente con el vertexService del catálogo.",
      };
    }
    serviceByProblem.set(item.problem_id, item.service);
  }

  for (const problemId of problemIds) {
    if (!serviceByProblem.has(problemId)) {
      return { valid: false, reason: "Falta el servicio de un problema." };
    }
  }

  return {
    valid: true,
    value: {
      diagnosis: value.diagnosis.trim(),
      problems: value.problems.map((item) => ({
        problem_id: item.problem_id,
        diagnosis: item.diagnosis.trim(),
        roadmap: item.roadmap.trim(),
      })),
      services: value.services.map((item) => ({
        problem_id: item.problem_id,
        service: item.service,
      })),
    },
  };
}

module.exports = {
  getProblem,
  validateInputRequirements,
  validateAiDiagnosis,
};
