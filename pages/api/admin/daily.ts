import type { NextApiRequest, NextApiResponse } from "next";
import type { DentalCase } from "../../../lib/cases";
import { describeAiIssue, generateDailyBoards, todaySeed } from "../../../lib/ai";
import { loadDiagnosisRotation } from "../../../lib/diagnosisRotation";
import { canonicalDiagnosisName } from "../../../lib/diagnoses";
import { getSupabaseStatus, isAdminKeyValid, supabaseRest } from "../../../lib/supabaseRest";

function isCaseList(value: unknown): value is DentalCase[] {
  return Array.isArray(value) && value.every((item) =>
    item &&
    typeof item === "object" &&
    "answer" in item &&
    typeof item.answer === "string" &&
    canonicalDiagnosisName(item.answer) !== null &&
    "clues" in item
  );
}

async function getPublished(date: string) {
  return supabaseRest<Array<{ cases: DentalCase[]; source: string; status: string; publish_date: string }>>(
    `dentle_daily_cases?select=publish_date,source,status,cases&publish_date=eq.${encodeURIComponent(date)}&status=eq.published&limit=1`
  );
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!isAdminKeyValid(req.headers["x-admin-key"] as string | undefined)) {
    res.status(401).json({ error: "Admin password required." });
    return;
  }

  const status = getSupabaseStatus();
  if (!status.configured) {
    res.status(503).json({ error: `Missing ${status.missing.join(", ")}` });
    return;
  }

  const publishDate = typeof req.query.date === "string" ? req.query.date : todaySeed();

  try {
    if (req.method === "GET") {
      const rows = await getPublished(publishDate);
      res.status(200).json({ publishDate, dailyCase: rows[0] || null });
      return;
    }

    if (req.method === "POST") {
      const source = typeof req.body?.source === "string" ? req.body.source : "admin";
      const submittedCases = req.body?.cases;
      if (submittedCases !== undefined && !isCaseList(submittedCases)) {
        res.status(400).json({
          error: "Every board answer must be an approved diagnosis. Treatments and clinical actions cannot be published as answers."
        });
        return;
      }
      const rotation = await loadDiagnosisRotation();
      if (isCaseList(submittedCases)) {
        const submittedAnswers = submittedCases.map((dentalCase) => canonicalDiagnosisName(dentalCase.answer)!);
        if (new Set(submittedAnswers).size !== submittedAnswers.length) {
          res.status(400).json({ error: "Every board in a daily set must have a different diagnosis." });
          return;
        }
        const repeated = submittedAnswers.find((answer) => rotation.recentAnswers.includes(answer));
        if (repeated) {
          res.status(400).json({
            error: `${repeated} was used recently. Choose a fresh diagnosis before publishing.`
          });
          return;
        }
      }
      const caseList = isCaseList(submittedCases)
        ? submittedCases
        : await generateDailyBoards(publishDate, rotation.recentAnswers);

      const rows = await supabaseRest("dentle_daily_cases?on_conflict=publish_date", {
        method: "POST",
        headers: { Prefer: "resolution=merge-duplicates,return=representation" },
        body: JSON.stringify({
          publish_date: publishDate,
          source,
          status: "published",
          cases: caseList,
          updated_at: new Date().toISOString()
        })
      });

      res.status(200).json({ published: true, publishDate, rows });
      return;
    }

    res.status(405).json({ error: "Use GET or POST." });
  } catch (error) {
    console.error(error);
    const isAiError = error instanceof Error && error.message.includes("Claude request failed");
    const issue = isAiError ? describeAiIssue(error) : null;

    res.status(500).json({
      error: issue?.error || (error instanceof Error ? error.message : "Daily case update failed."),
      nextStep: issue?.nextStep
    });
  }
}
