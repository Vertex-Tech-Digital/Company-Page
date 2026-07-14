import { problemsData } from "../data/problemsData";

/**
 * Normaliza una cadena de texto a minúsculas y elimina acentos básicos.
 */
const normalizeText = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
};

/**
 * Procesa las coincidencias automáticas de problemas a partir de un texto libre.
 * 
 * @param text Texto libre ingresado por el usuario.
 * @param markedIds Array de IDs de problemas marcados manualmente (tienen prioridad y se omiten).
 * @returns Array con un máximo de 4 IDs de problemas detectados, ordenados de mayor a menor coincidencia.
 */
export function analyzeFreeText(text: string, markedIds: number[]): number[] {
  if (!text || !text.trim()) {
    return [];
  }

  const normalizedText = normalizeText(text);

  // Filtrar problemas que ya fueron marcados manualmente
  const candidateProblems = problemsData.filter(
    (problem) => !markedIds.includes(problem.id)
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
    .filter((match) => match.count > 0); // Solo problemas que tengan al menos una coincidencia

  // Ordenar de mayor a menor según el número de impactos/coincidencias
  matches.sort((a, b) => b.count - a.count);

  // Retornar los IDs de los problemas detectados, limitado a un máximo de 4
  return matches.map((match) => match.id).slice(0, 4);
}
