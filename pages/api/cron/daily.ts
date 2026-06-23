import type { NextApiRequest, NextApiResponse } from "next";
import { todaySeed } from "../../../lib/ai";
import { publishDailyBoards } from "../../../lib/dailyPublisher";

function hasCronAccess(req: NextApiRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  return req.headers.authorization === `Bearer ${secret}` || req.headers["x-cron-key"] === secret;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!hasCronAccess(req)) {
    res.status(401).json({ error: "Cron secret required." });
    return;
  }

  const publishDate = typeof req.query.date === "string" ? req.query.date : todaySeed();
  const result = await publishDailyBoards(publishDate);
  res.status(result.status).json(result.body);
}
