import type { DentalCase } from "./cases";
import { canonicalDiagnosisName, diagnoses } from "./diagnoses";
import { supabaseRest } from "./supabaseRest";

type PublishedBoardSet = {
  publish_date: string;
  cases: DentalCase[];
};

const recentAnswerLimit = 60;

export function diagnosisRotation(records: PublishedBoardSet[], limit = recentAnswerLimit) {
  const recentAnswers: string[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    for (const dentalCase of record.cases || []) {
      const canonical = canonicalDiagnosisName(dentalCase.answer);
      if (!canonical || seen.has(canonical)) continue;
      seen.add(canonical);
      recentAnswers.push(canonical);
      if (recentAnswers.length >= limit) break;
    }
    if (recentAnswers.length >= limit) break;
  }

  const availableAnswers = diagnoses
    .map((diagnosis) => diagnosis.name)
    .filter((name) => !seen.has(name));

  return {
    bankSize: diagnoses.length,
    recentAnswers,
    availableAnswers,
    recentLimit: limit
  };
}

export async function loadDiagnosisRotation() {
  const records = await supabaseRest<PublishedBoardSet[]>(
    "dentle_daily_cases?select=publish_date,cases&status=eq.published&order=publish_date.desc&limit=20"
  );
  return diagnosisRotation(records);
}
