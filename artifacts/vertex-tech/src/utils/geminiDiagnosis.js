const {
  buildUserPrompt,
  SYSTEM_PROMPT,
  extractJsonPayload,
} = require("./openrouterDiagnosis");

const DEFAULT_TIMEOUT_MS = 6000;
const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash";

function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_resolve, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} superó el timeout de ${timeoutMs} ms`)),
      timeoutMs,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

async function requestGeminiDiagnosis(formData, catalog, options = {}) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");

  const model = process.env.GEMINI_MODEL || GEMINI_DEFAULT_MODEL;
  const timeoutMs =
    options.timeoutMs ||
    Number(process.env.GEMINI_TIMEOUT_MS) ||
    DEFAULT_TIMEOUT_MS;

  const { GoogleGenAI } = await import("@google/genai");
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { timeout: timeoutMs },
  });

  const interaction = await withTimeout(
    ai.interactions.create({
      model,
      input: buildUserPrompt(formData, catalog),
      system_instruction: SYSTEM_PROMPT,
      response_format: {
        type: "text",
        mime_type: "application/json",
        schema: {
          type: "object",
          required: ["diagnosis", "problems", "services"],
          properties: {
            diagnosis: { type: "string" },
            problems: {
              type: "array",
              items: {
                type: "object",
                required: ["problem_id", "diagnosis", "roadmap"],
                properties: {
                  problem_id: { type: "integer" },
                  diagnosis: { type: "string" },
                  roadmap: { type: "string" },
                },
              },
            },
            services: {
              type: "array",
              items: {
                type: "object",
                required: ["problem_id", "service"],
                properties: {
                  problem_id: { type: "integer" },
                  service: { type: "string" },
                },
              },
            },
          },
        },
      },
      store: false,
    }),
    timeoutMs,
    "Gemini",
  );

  const content = interaction.output_text;
  if (!content || !content.trim())
    throw new Error("Gemini devolvió una respuesta vacía");
  return { value: extractJsonPayload(content), model };
}

module.exports = { requestGeminiDiagnosis, GEMINI_DEFAULT_MODEL };
