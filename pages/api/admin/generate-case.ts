import type { NextApiRequest, NextApiResponse } from "next";
import { describeGeminiIssue, generateDentleCase, todaySeed } from "../../../lib/gemini";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  try {
    const mode = typeof req.body?.mode === "string" ? req.body.mode : "Dentle Dx";
    const seed = typeof req.body?.seed === "string" ? req.body.seed : todaySeed();
    const generatedCase = await generateDentleCase(mode, seed);
    res.status(200).json({ case: generatedCase, seed, source: "gemini" });
  } catch (error) {
    console.error(error);
    const issue = describeGeminiIssue(error);

    res.status(500).json({
      error: issue.error,
      nextStep: issue.nextStep
    });
  }
}
