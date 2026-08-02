const { problemsData } = require("../data/problemsData");

const normalizeText = (str) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

function analyzeFreeText(text, markedIds) {
  if (!text || !text.trim()) {
    return [];
  }

  const normalizedText = normalizeText(text);

  // Filtrar problemas que ya fueron marcados manualmente
  const candidateProblems = problemsData.filter(
    (problem) => !markedIds.includes(problem.id),
  );

  // Mapear cada problema con su cantidad de palabras clave coincidentes
  const matches = candidateProblems
    .map((problem) => {
      let count = 0;
      for (const keyword of problem.keywords) {
        const normalizedKw = normalizeText(keyword);
        if (normalizedKw && normalizedText.includes(normalizedKw)) {
          count++;
        }
      }
      return { id: problem.id, count };
    })
    .filter((match) => match.count > 0);

  // Ordenar de mayor a menor según el número de impactos/coincidencias
  matches.sort((a, b) => b.count - a.count);

  // Retornar los IDs de los problemas detectados, limitado a un máximo de 4
  return matches.map((match) => match.id).slice(0, 4);
}

module.exports = { analyzeFreeText };
