import type { NextApiRequest, NextApiResponse } from "next";

type OpenverseImage = {
  id: string;
  title: string;
  creator?: string;
  license?: string;
  url: string;
  thumbnail?: string;
  foreign_landing_url?: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  if (!query.trim()) {
    res.status(400).json({ error: "Missing q query parameter." });
    return;
  }

  const url = new URL("https://api.openverse.org/v1/images/");
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "8");
  url.searchParams.set("license_type", "commercial,modification");

  try {
    const response = await fetch(url);

    if (!response.ok) {
      res.status(response.status).json({ error: "Openverse image search failed." });
      return;
    }

    const data = await response.json();
    const results = (data.results || []).map((image: OpenverseImage) => ({
      id: image.id,
      title: image.title,
      creator: image.creator,
      license: image.license,
      imageUrl: image.thumbnail || image.url,
      sourceUrl: image.foreign_landing_url
    }));

    res.status(200).json({ results });
  } catch {
    res.status(502).json({ error: "Could not reach image provider." });
  }
}
