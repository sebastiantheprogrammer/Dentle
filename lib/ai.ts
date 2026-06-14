import { cases, type DentalCase } from "./cases";
import { diagnoses } from "./diagnoses";

export type GeneratedDentleCase = Omit<DentalCase, "id" | "number">;

const fallbackImages: Record<string, DentalCase["image"]> = {
  "Dentle Dx": cases[0].image,
  Radiograph: cases[1].image,
  "Oral Path": cases[2].image,
  "Treatment Plan": cases[3].image,
  Emergency: cases[4].image
};
const modeImageQueries: Record<string, string[]> = {
  "Dentle Dx": [
    "dental caries xray",
    "tooth decay dental radiograph",
    "root canal dental xray"
  ],
  Radiograph: [
    "dental xray",
    "panoramic dental radiograph",
    "impacted wisdom tooth xray",
    "jaw radiograph dental"
  ],
  "Oral Path": [
    "oral lesion mouth",
    "oral pathology clinical",
    "mouth ulcer clinical",
    "tongue lesion oral"
  ],
  "Treatment Plan": [
    "dental trauma tooth",
    "avulsed tooth",
    "fractured tooth dental",
    "dental treatment clinical"
  ],
  Emergency: [
    "dental emergency kit",
    "glucose meter medical",
    "glucagon emergency kit",
    "medical emergency dental office"
  ]
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

Return only valid JSON. No markdown. No commentary.

JSON shape:
{
  "mode": "string",
  "category": "string",
  "difficulty": "string",
  "title": "string",
  "prompt": "string",
  "clues": ["string", "string", "string", "string", "string"],
  "answer": "string",
  "aliases": ["string"],
  "explanation": "string",
  "differentials": ["string", "string", "string"],
  "image": {
    "src": "",
    "alt": "string",
    "credit": "string",
    "apiQuery": "string",
    "clueRole": "string"
  }
}

Rules:
- prompt must be one short patient case, under 28 words.
- clues must contain exactly 5 progressive clues.
- answer must be specific, board-review style, and accepted by dental learners.
- aliases must include common abbreviations and simpler answer variants.
- explanation must be under 35 words.
- differentials must contain exactly 3 tempting wrong answers.
- image.apiQuery must be a targeted Openverse/Wikimedia-style search phrase for a real educational image that directly supports the case.
- image.src should be an empty string unless you know a specific licensed clinical image URL.
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

Return only valid JSON. No markdown. No commentary.

JSON shape:
{ "cases": [ five case objects ] }

Each case object must include:
{
  "mode": "string",
  "category": "string",
  "difficulty": "string",
  "title": "string",
  "prompt": "string",
  "clues": ["string", "string", "string", "string", "string"],
  "answer": "string",
  "aliases": ["string"],
  "explanation": "string",
  "differentials": ["string", "string", "string"],
  "image": {
    "src": "",
    "alt": "string",
    "credit": "string",
    "apiQuery": "string",
    "clueRole": "string"
  }
}

Rules for every board:
- prompt must be one short patient case, under 28 words.
- clues must contain exactly 5 progressive clues.
- answer must be specific, board-review style, and accepted by dental learners.
- aliases must include common abbreviations and simpler answer variants.
- explanation must be under 35 words.
- differentials must contain exactly 3 tempting wrong answers.
- image.apiQuery must be a targeted Openverse/Wikimedia-style search phrase for a real educational image that directly supports the case.
- image.src should be an empty string unless you know a specific licensed clinical image URL.
- image.alt and image.clueRole must describe what the image should show.
- Do not include patient-identifying information.
- Do not give patient-specific treatment advice.
`;
}

function coerceCase(input: Partial<GeneratedDentleCase>, mode: string): GeneratedDentleCase {
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

type OpenverseImage = {
  id?: string;
  title?: string;
  creator?: string;
  license?: string;
  url?: string;
  thumbnail?: string;
  foreign_landing_url?: string;
};

function seededIndex(seed: string, max: number) {
  if (max <= 1) return 0;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash % max;
}

async function searchOpenverseImages(query: string) {
  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "10");
  url.searchParams.set("license_type", "commercial,modification");

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Dentle/0.1 daily dental education game"
    }
  });

  if (!response.ok) return [];

  const data = await response.json();
  return ((data.results || []) as OpenverseImage[])
    .filter((image) => image.thumbnail || image.url)
    .filter((image) => !image.url?.endsWith(".svg"));
}

async function findImageForCase(dentalCase: GeneratedDentleCase, seed: string) {
  const targetedQuery = [
    dentalCase.image.apiQuery,
    dentalCase.answer,
    dentalCase.mode,
    dentalCase.category,
    "dentistry"
  ].filter(Boolean).join(" ");

  const fallbackQuery = [dentalCase.answer, dentalCase.category, "dental"].filter(Boolean).join(" ");
  const queries = [
    targetedQuery,
    fallbackQuery,
    ...(modeImageQueries[dentalCase.mode] || []),
    `${dentalCase.mode} dentistry`,
    "dental education"
  ];
  const seenQueries = new Set<string>();
  const results: OpenverseImage[] = [];

  for (const query of queries) {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery || seenQueries.has(normalizedQuery)) continue;
    seenQueries.add(normalizedQuery);
    results.push(...await searchOpenverseImages(query));
    if (results.length >= 12) break;
  }

  const originalSrc = fallbackImages[dentalCase.mode]?.src || dentalCase.image.src;
  const uniqueResults = results.filter((image, index, all) => {
    const imageUrl = image.thumbnail || image.url || "";
    if (!imageUrl || imageUrl === originalSrc || image.url === originalSrc) return false;
    return all.findIndex((candidate) => (candidate.thumbnail || candidate.url) === imageUrl) === index;
  });

  const image = uniqueResults[seededIndex(`${seed}-${dentalCase.mode}-${dentalCase.answer}`, uniqueResults.length)];
  if (!image) return dentalCase;

  return {
    ...dentalCase,
    image: {
      src: image.thumbnail || image.url || dentalCase.image.src,
      alt: dentalCase.image.alt || image.title || `${dentalCase.answer} dental clue image`,
      credit: [
        "Openverse",
        image.title || "image",
        image.creator ? `by ${image.creator}` : "",
        image.license ? `(${image.license})` : ""
      ].filter(Boolean).join(" "),
      apiQuery: dentalCase.image.apiQuery || targetedQuery,
      clueRole: dentalCase.image.clueRole || `Show a useful visual clue for ${dentalCase.answer}.`
    }
  };
}

async function withFreshImage(dentalCase: GeneratedDentleCase, seed: string) {
  try {
    return await findImageForCase(dentalCase, seed);
  } catch {
    return dentalCase;
  }
}

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return JSON.parse(trimmed);

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));

  throw new Error("Claude returned no JSON object");
}

async function callClaude(prompt: string, maxTokens = 5000) {
  const apiKey = process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY;
  const model = process.env.ANTHROPIC_MODEL || process.env.CLAUDE_MODEL || "claude-haiku-4-5";

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature: 0.85,
      system: "You create concise educational dental board-style game cases. Return only valid JSON. Do not include markdown.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Claude request failed: ${response.status} ${message}`);
  }

  const data = await response.json();
  const text = (data.content || [])
    .filter((part: { type?: string; text?: string }) => part.type === "text" && part.text)
    .map((part: { text: string }) => part.text)
    .join("\n");

  if (!text) {
    throw new Error("Claude returned no text");
  }

  return extractJson(text);
}

export async function generateDentleCase(mode: string, seed = todaySeed()) {
  return withFreshImage(coerceCase(await callClaude(casePrompt(mode, seed), 2500), mode), seed);
}

export async function generateDailyBoards(seed = todaySeed()) {
  const modes = ["Dentle Dx", "Radiograph", "Oral Path", "Treatment Plan", "Emergency"];
  const parsed = await callClaude(dailyBoardsPrompt(seed), 7000);
  const generated = modes.map((mode, index) => coerceCase(parsed.cases?.[index] || {}, mode));
  const withImages = await Promise.all(generated.map((dentalCase) => withFreshImage(dentalCase, seed)));

  return withImages.map((board, index) => ({
    ...board,
    id: `ai-${seed}-${index + 1}`,
    number: String(index + 1)
  }));
}

export function describeAiIssue(error: unknown) {
  const message = error instanceof Error ? error.message : "AI generation failed.";

  if (message.includes("Missing ANTHROPIC_API_KEY")) {
    return {
      error: "Missing Claude API key.",
      nextStep: "Set ANTHROPIC_API_KEY in .env.local and Vercel, then restart or redeploy."
    };
  }

  if (message.includes("401")) {
    return {
      error: "Claude API key is invalid or missing access.",
      nextStep: "Check ANTHROPIC_API_KEY in your environment variables."
    };
  }

  if (message.includes("403")) {
    return {
      error: "Claude project or key does not have access to this model.",
      nextStep: "Check your Anthropic Console key permissions or switch ANTHROPIC_MODEL."
    };
  }

  if (message.includes("429")) {
    return {
      error: "Claude rate limit or balance is temporarily exhausted.",
      nextStep: "Wait for the rate limit to reset, add credits, or use a cheaper/faster model."
    };
  }

  return {
    error: "Claude generation failed.",
    nextStep: "Check server logs, ANTHROPIC_MODEL, and whether Claude returned valid JSON."
  };
}
