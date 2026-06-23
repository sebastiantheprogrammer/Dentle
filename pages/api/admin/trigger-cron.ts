import type { NextApiRequest, NextApiResponse } from "next";
import { todaySeed } from "../../../lib/ai";
import { publishDailyBoards } from "../../../lib/dailyPublisher";
import { isAdminKeyValid } from "../../../lib/supabaseRest";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed. Use POST." });
    return;
  }

  const adminKey = req.headers["x-admin-key"] as string | undefined;
  if (!isAdminKeyValid(adminKey)) {
    res.status(401).json({ error: "Admin password required." });
    return;
  }

  try {
    const publishDate = typeof req.query.date === "string" ? req.query.date : todaySeed();
    const result = await publishDailyBoards(publishDate, "claude-admin-trigger");
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Failed to trigger daily publish:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Internal server error triggering daily publish."
    });
  }
}
