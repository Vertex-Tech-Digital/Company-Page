const { analyzeFreeText } = require("./analyzeFreeText");
const { problemsData } = require("../data/problemsData");
const { validateAiDiagnosis } = require("./diagnosisValidation");
const {
  requestOpenRouter,
  OPENROUTER_DEFAULT_MODEL,
} = require("./openrouterDiagnosis");
const { requestGeminiDiagnosis } = require("./geminiDiagnosis");

const DEFAULT_TIMEOUT_MS = 6000;

/**
 * Fallback determinista local (Tarea 1, intento 3).
 * Construye el diagnóstico exclusivamente con analyzeFreeText + problemsData:
 * sin llamadas externas, sin precios, sin plazos ni tecnologías ajenas.
 */
function buildDeterministicFallback(payload, catalog) {
  const { formData, markedProblemIds, detectedProblems } = payload;
  const allowedIds = [
    ...new Set([...(markedProblemIds || []), ...(detectedProblems || [])]),
  ];
  const selected = allowedIds
    .map((id) => catalog.find((problem) => problem.id === id))
    .filter(Boolean);

  const companyName = formData?.company_name || "la empresa";
  const sector = formData?.sector || "sector sin especificar";
  const size = formData?.size || "tamaño sin especificar";

  const diagnosis = selected.length
    ? `Análisis preliminar de ${companyName} (${sector}, ${size}): se identificaron ${selected.length} focos de fricción operativa — ${selected
        .map((problem) => problem.name)
        .join(
          ", ",
        )}—. Abordados de forma coordinada, estos puntos reducen la pérdida de tiempo del equipo, el riesgo de errores de transcripción y los cuellos de botella en la gestión diaria.`
    : `Análisis preliminar de ${companyName} (${sector}, ${size}): no se confirmaron focos de fricción con los datos aportados; se recomienda una revisión preventiva de la operativa.`;

  return {
    diagnosis,
    problems: selected.map((problem) => ({
      problem_id: problem.id,
      diagnosis: `Foco de fricción detectado en la operativa de ${companyName}: el punto «${problem.name}» consume tiempo del equipo, introduce riesgo de error humano y condiciona la capacidad de respuesta del negocio.`,
      roadmap: `Fase 1: Análisis del punto «${problem.name}» y definición del alcance. Fase 2: ${problem.recommendation} Fase 3: Validación, ajustes y puesta en producción.`,
    })),
    services: selected.map((problem) => ({
      problem_id: problem.id,
      service: problem.vertexService,
    })),
  };
}

/**
 * Pipeline de inferencia en cascada resiliente:
 * 1. Gemini API -> 2. OpenRouter -> 3. Fallback determinista local.
 *
 * Cada proveedor dispone de timeout independiente (6000 ms por defecto) y
 * cualquier caída, timeout, JSON corrupto o fallo de validación escala al
 * siguiente proveedor sin lanzar errores al handler del lead.
 */
async function resolveDiagnosis({
  formData,
  markedProblemIds,
  catalog = problemsData,
  request = requestOpenRouter,
  primaryRequest = requestGeminiDiagnosis,
  timeoutMs = Number(process.env.AI_PROVIDER_TIMEOUT_MS) || DEFAULT_TIMEOUT_MS,
}) {
  const detectedProblems = analyzeFreeText(
    formData.free_text,
    markedProblemIds,
  );
  const allowedProblemIds = [
    ...new Set([...markedProblemIds, ...detectedProblems]),
  ];
  const payload = {
    ...formData,
    marked_problem_ids: markedProblemIds,
    allowed_problem_ids: allowedProblemIds,
  };

  const providers = [
    { name: "Gemini", providerRequest: primaryRequest },
    { name: "OpenRouter", providerRequest: request },
  ];

  for (const { name, providerRequest } of providers) {
    try {
      const response = await providerRequest(payload, catalog, { timeoutMs });
      const value = response?.value ?? response;
      const model = response?.value
        ? response.model
        : process.env.OPENROUTER_MODEL || OPENROUTER_DEFAULT_MODEL;

      const validation = validateAiDiagnosis(value, allowedProblemIds, catalog);
      if (!validation.valid) throw new Error(validation.reason);

      return {
        source: "ai",
        detectedProblems,
        aiDiagnosis: validation.value.diagnosis,
        aiRoadmap: validation.value,
        aiModel: model || null,
        aiProvider: name.toLowerCase(),
      };
    } catch (error) {
      const next =
        name === "Gemini"
          ? "escalando a OpenRouter"
          : "pasando a Fallback local";
      console.warn(`[AI Pipeline] ${name} falló, ${next}:`, error.message);
    }
  }

  const fallbackData = buildDeterministicFallback(
    { formData, markedProblemIds, detectedProblems },
    catalog,
  );

  return {
    source: "fallback",
    detectedProblems,
    aiDiagnosis: fallbackData.diagnosis,
    aiRoadmap: fallbackData,
    aiModel: null,
    aiProvider: "local",
  };
}

module.exports = { resolveDiagnosis, buildDeterministicFallback };
