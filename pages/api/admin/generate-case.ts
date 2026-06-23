import type { NextApiRequest, NextApiResponse } from "next";
import { describeAiIssue, generateDentleCase, todaySeed } from "../../../lib/ai";
import { isAdminKeyValid } from "../../../lib/supabaseRest";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  if (!isAdminKeyValid(req.headers["x-admin-key"] as string | undefined)) {
    res.status(401).json({ error: "Admin password required." });
    return;
  }

  try {
    const mode = typeof req.body?.mode === "string" ? req.body.mode : "Dentle Dx";
    const seed = typeof req.body?.seed === "string" ? req.body.seed : todaySeed();
    const generatedCase = await generateDentleCase(mode, seed);
    res.status(200).json({ case: generatedCase, seed, source: "claude" });
  } catch (error) {
    console.error(error);
    const issue = describeAiIssue(error);

    res.status(500).json({
      error: issue.error,
      nextStep: issue.nextStep
    });
  }
}
