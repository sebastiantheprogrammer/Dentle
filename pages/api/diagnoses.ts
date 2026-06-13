import type { NextApiRequest, NextApiResponse } from "next";
import { diagnoses, normalizeTerm, searchDiagnoses } from "../../lib/diagnoses";

type WikidataSearchItem = {
  label?: string;
  description?: string;
  aliases?: string[];
};

const dentalKeywords = [
  "tooth",
  "teeth",
  "dental",
  "dentistry",
  "oral",
  "gingiva",
  "gingival",
  "periodontal",
  "periodont",
  "pulp",
  "odontogenic",
  "jaw",
  "cyst",
  "caries",
  "enamel",
  "dentin",
  "molar",
  "incisor",
  "canine",
  "occlusion"
];

function isDentalish(item: WikidataSearchItem) {
  const haystack = normalizeTerm(`${item.label || ""} ${item.description || ""} ${(item.aliases || []).join(" ")}`);
  return dentalKeywords.some((keyword) => haystack.includes(keyword));
}

async function searchWikidata(query: string) {
  const url = new URL("https://www.wikidata.org/w/api.php");
  url.searchParams.set("action", "wbsearchentities");
  url.searchParams.set("search", query);
  url.searchParams.set("language", "en");
  url.searchParams.set("format", "json");
  url.searchParams.set("type", "item");
  url.searchParams.set("limit", "8");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "Dentle/0.1 diagnosis-bank prototype"
    }
  });

  if (!response.ok) return [];

  const data = await response.json();
  return ((data.search || []) as WikidataSearchItem[])
    .filter((item) => item.label && isDentalish(item))
    .map((item) => ({
      name: item.label || "",
      aliases: item.aliases || [],
      category: "External terminology"
    }));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const query = typeof req.query.q === "string" ? req.query.q : "";

  if (!query.trim()) {
    res.status(200).json({ results: diagnoses.slice(0, 30), source: "curated" });
    return;
  }

  const curated = searchDiagnoses(query, 12);

  if (curated.length >= 8) {
    res.status(200).json({ results: curated, source: "curated" });
    return;
  }

  try {
    const external = await searchWikidata(query);
    const seen = new Set(curated.map((diagnosis) => normalizeTerm(diagnosis.name)));
    const merged = [
      ...curated,
      ...external.filter((diagnosis) => {
        const key = normalizeTerm(diagnosis.name);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
    ].slice(0, 12);

    res.status(200).json({ results: merged, source: external.length ? "curated+wikidata" : "curated" });
  } catch {
    res.status(200).json({ results: curated, source: "curated" });
  }
}
