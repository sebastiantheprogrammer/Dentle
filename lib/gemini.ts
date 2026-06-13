import { cases, type DentalCase } from "./cases";
import { diagnoses } from "./diagnoses";

export type GeneratedDentleCase = Omit<DentalCase, "id" | "number">;

const caseSchema = {
  type: "object",
  properties: {
    mode: { type: "string" },
    category: { type: "string" },
    difficulty: { type: "string" },
    title: { type: "string" },
    prompt: { type: "string" },
    clues: {
      type: "array",
      items: { type: "string" }
    },
    answer: { type: "string" },
    aliases: {
      type: "array",
      items: { type: "string" }
    },
    explanation: { type: "string" },
    differentials: {
      type: "array",
      items: { type: "string" }
    },
    image: {
      type: "object",
      properties: {
        src: { type: "string" },
        alt: { type: "string" },
        credit: { type: "string" },
        apiQuery: { type: "string" },
        clueRole: { type: "string" }
      },
      required: ["src", "alt", "credit", "apiQuery", "clueRole"]
    }
  },
  required: [
    "mode",
    "category",
    "difficulty",
    "title",
    "prompt",
    "clues",
    "answer",
    "aliases",
    "explanation",
    "differentials",
    "image"
  ]
};

const fallbackImages: Record<string, DentalCase["image"]> = {
  "Dentle Dx": cases[0].image,
  Radiograph: cases[1].image,
  "Oral Path": cases[2].image,
  "Treatment Plan": cases[3].image,
  Emergency: cases[4].image
};
const dailyBoardsSchema = {
  type: "object",
  properties: {
    cases: {
      type: "array",
      items: caseSchema
    }
  },
  required: ["cases"]
};

export function todaySeed(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function casePrompt(mode: string, seed = todaySeed()) {
  const diagnosisNames = diagnoses.map((diagnosis) => diagnosis.name).slice(0, 90).join(", ");

  return `
Create one Dentle board for ${seed}.

Dentle is a Wordle-like daily dental diagnosis game. The image is a clue, not decoration.

Mode: ${mode}

Use a diagnosis or clinical decision that belongs naturally to this mode. You may choose from this diagnosis bank or a closely related dental term:
${diagnosisNames}

Return strict JSON only.

Rules:
- prompt must be one short patient case, under 28 words.
- clues must contain exactly 5 progressive clues.
- answer must be specific, board-review style, and accepted by dental learners.
- aliases must include common abbreviations and simpler answer variants.
- explanation must be under 35 words.
- differentials must contain exactly 3 tempting wrong answers.
- image.apiQuery must be a targeted search phrase for a real educational image that directly supports the case.
- image.src may be an empty string if a specific licensed URL is not known.
- image.alt and image.clueRole must describe what the image should show.
- Do not include patient-identifying information.
- Do not give patient-specific treatment advice.
`;
}

export function dailyBoardsPrompt(seed = todaySeed()) {
  const diagnosisNames = diagnoses.map((diagnosis) => diagnosis.name).slice(0, 120).join(", ");

  return `
Create five Dentle boards for ${seed}.

Dentle is a Wordle-like daily dental diagnosis game. Each image is a clue, not decoration.

Create exactly one board for each mode:
- Dentle Dx
- Radiograph
- Oral Path
- Treatment Plan
- Emergency

Use diagnoses or clinical decisions from this bank when possible:
${diagnosisNames}

Return strict JSON only with this shape:
{ "cases": [ ...five case objects... ] }

Rules for every board:
- prompt must be one short patient case, under 28 words.
- clues must contain exactly 5 progressive clues.
- answer must be specific, board-review style, and accepted by dental learners.
- aliases must include common abbreviations and simpler answer variants.
- explanation must be under 35 words.
- differentials must contain exactly 3 tempting wrong answers.
- image.apiQuery must be a targeted search phrase for a real educational image that directly supports the case.
- image.src may be an empty string if a specific licensed URL is not known.
- image.alt and image.clueRole must describe what the image should show.
- Do not include patient-identifying information.
- Do not give patient-specific treatment advice.
`;
}

function coerceCase(input: GeneratedDentleCase, mode: string): GeneratedDentleCase {
  return {
    mode: input.mode || mode,
    category: input.category || mode,
    difficulty: input.difficulty || "Beginner",
    title: input.title || `${mode} Case`,
    prompt: input.prompt || "Review the image and clues, then name the most likely dental diagnosis.",
    clues: (input.clues || []).slice(0, 5).concat(Array(5).fill("Use the clinical pattern to narrow the diagnosis.")).slice(0, 5),
    answer: input.answer || "Gingivitis",
    aliases: input.aliases || [],
    explanation: input.explanation || "The answer best matches the pattern of findings in the case.",
    differentials: (input.differentials || []).slice(0, 3).concat(["Periodontitis", "Pulpitis", "Caries"]).slice(0, 3),
    image: input.image?.src ? input.image : {
      ...fallbackImages[mode],
      apiQuery: input.image?.apiQuery || fallbackImages[mode]?.apiQuery || `${mode} dental diagnosis`,
      alt: input.image?.alt || fallbackImages[mode]?.alt || `${mode} dental image clue`,
      clueRole: input.image?.clueRole || fallbackImages[mode]?.clueRole || "Show a useful visual clue for this case."
    }
  };
}

export async function generateDentleCase(mode: string, seed = todaySeed()) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: casePrompt(mode, seed) }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: caseSchema,
        temperature: 0.85
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no JSON text");
  }

  return coerceCase(JSON.parse(text), mode);
}

export async function generateDailyBoards(seed = todaySeed()) {
  const modes = ["Dentle Dx", "Radiograph", "Oral Path", "Treatment Plan", "Emergency"];
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash";

  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: dailyBoardsPrompt(seed) }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: dailyBoardsSchema,
        temperature: 0.85
      }
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Gemini request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned no JSON text");
  }

  const parsed = JSON.parse(text);
  const generated = modes.map((mode, index) => coerceCase(parsed.cases?.[index] || {}, mode));

  return generated.map((board, index) => ({
    ...board,
    id: `ai-${seed}-${index + 1}`,
    number: String(index + 1)
  }));
}

export function describeGeminiIssue(error: unknown) {
  const message = error instanceof Error ? error.message : "Gemini generation failed.";

  if (message.includes("Missing GEMINI_API_KEY")) {
    return {
      error: "Missing Gemini API key.",
      nextStep: "Set GEMINI_API_KEY in .env.local and restart the dev server."
    };
  }

  if (message.includes("PERMISSION_DENIED") || message.includes("403")) {
    return {
      error: "Gemini project or key does not have API access.",
      nextStep: "Enable Gemini API access for the Google project, or rotate in a new Gemini key, then restart the dev server."
    };
  }

  if (message.includes("RESOURCE_EXHAUSTED") || message.includes("429")) {
    return {
      error: "Gemini quota is temporarily exhausted for this model/project.",
      nextStep: "Wait for the quota window to reset, add billing or quota, or switch GEMINI_MODEL to a model with available quota."
    };
  }

  return {
    error: "Gemini generation failed.",
    nextStep: "Check the server logs, then verify the model name, API key, and generated JSON schema."
  };
}
