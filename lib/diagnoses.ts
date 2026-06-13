export type Diagnosis = {
  name: string;
  aliases: string[];
  category: string;
};

export const diagnoses: Diagnosis[] = [
  { name: "Gingivitis", aliases: ["gum inflammation", "inflamed gums"], category: "Periodontics" },
  { name: "Periodontitis", aliases: ["gum disease", "periodontal disease"], category: "Periodontics" },
  { name: "Localized periodontitis", aliases: ["localized periodontal disease"], category: "Periodontics" },
  { name: "Generalized periodontitis", aliases: ["generalized periodontal disease"], category: "Periodontics" },
  { name: "Molar-incisor pattern periodontitis", aliases: ["localized aggressive periodontitis", "molar incisor periodontitis"], category: "Periodontics" },
  { name: "Necrotizing ulcerative gingivitis", aliases: ["NUG", "trench mouth"], category: "Periodontics" },
  { name: "Necrotizing periodontitis", aliases: ["necrotizing periodontal disease"], category: "Periodontics" },
  { name: "Periodontal abscess", aliases: ["gum abscess", "localized periodontal abscess"], category: "Periodontics" },
  { name: "Peri-implantitis", aliases: ["implantitis"], category: "Periodontics" },
  { name: "Peri-implant mucositis", aliases: ["implant mucositis"], category: "Periodontics" },
  { name: "Gingival recession", aliases: ["recession defect"], category: "Periodontics" },
  { name: "Symptomatic irreversible pulpitis", aliases: ["irreversible pulpitis", "SIP"], category: "Endodontics" },
  { name: "Asymptomatic irreversible pulpitis", aliases: ["asymptomatic pulpitis"], category: "Endodontics" },
  { name: "Reversible pulpitis", aliases: ["mild pulpitis"], category: "Endodontics" },
  { name: "Pulp necrosis", aliases: ["necrotic pulp", "nonvital tooth"], category: "Endodontics" },
  { name: "Acute apical abscess", aliases: ["apical abscess"], category: "Endodontics" },
  { name: "Chronic apical abscess", aliases: ["sinus tract abscess"], category: "Endodontics" },
  { name: "Symptomatic apical periodontitis", aliases: ["SAP"], category: "Endodontics" },
  { name: "Asymptomatic apical periodontitis", aliases: ["AAP"], category: "Endodontics" },
  { name: "Previously treated tooth", aliases: ["root canal treated tooth"], category: "Endodontics" },
  { name: "Previously initiated therapy", aliases: ["partial endodontic treatment"], category: "Endodontics" },
  { name: "Cracked tooth syndrome", aliases: ["cracked tooth"], category: "Endodontics" },
  { name: "Vertical root fracture", aliases: ["root fracture"], category: "Endodontics" },
  { name: "Internal resorption", aliases: ["internal root resorption"], category: "Endodontics" },
  { name: "External cervical resorption", aliases: ["external resorption"], category: "Endodontics" },
  { name: "Dental caries", aliases: ["tooth decay", "cavity"], category: "Restorative" },
  { name: "Recurrent caries", aliases: ["secondary caries"], category: "Restorative" },
  { name: "Root caries", aliases: ["cemental caries"], category: "Restorative" },
  { name: "Enamel hypoplasia", aliases: ["hypoplastic enamel"], category: "Developmental" },
  { name: "Amelogenesis imperfecta", aliases: ["AI"], category: "Developmental" },
  { name: "Dentinogenesis imperfecta", aliases: ["DI"], category: "Developmental" },
  { name: "Fluorosis", aliases: ["dental fluorosis"], category: "Developmental" },
  { name: "Dentigerous cyst", aliases: ["follicular cyst"], category: "Oral Radiology" },
  { name: "Radicular cyst", aliases: ["periapical cyst"], category: "Oral Radiology" },
  { name: "Residual cyst", aliases: ["residual radicular cyst"], category: "Oral Radiology" },
  { name: "Nasopalatine duct cyst", aliases: ["incisive canal cyst"], category: "Oral Radiology" },
  { name: "Lateral periodontal cyst", aliases: ["LPC"], category: "Oral Radiology" },
  { name: "Odontoma", aliases: ["compound odontoma", "complex odontoma"], category: "Oral Radiology" },
  { name: "Cemento-osseous dysplasia", aliases: ["COD", "cemento osseous dysplasia"], category: "Oral Radiology" },
  { name: "Fibrous dysplasia", aliases: ["ground glass lesion"], category: "Oral Radiology" },
  { name: "Idiopathic osteosclerosis", aliases: ["dense bone island"], category: "Oral Radiology" },
  { name: "Condensing osteitis", aliases: ["focal sclerosing osteomyelitis"], category: "Oral Radiology" },
  { name: "Odontogenic keratocyst", aliases: ["OKC"], category: "Oral Pathology" },
  { name: "Ameloblastoma", aliases: ["odontogenic tumor"], category: "Oral Pathology" },
  { name: "Pseudomembranous candidiasis", aliases: ["oral candidiasis", "thrush"], category: "Oral Pathology" },
  { name: "Erythematous candidiasis", aliases: ["atrophic candidiasis"], category: "Oral Pathology" },
  { name: "Angular cheilitis", aliases: ["perlèche", "cheilitis"], category: "Oral Pathology" },
  { name: "Leukoplakia", aliases: ["white patch"], category: "Oral Pathology" },
  { name: "Erythroplakia", aliases: ["red patch"], category: "Oral Pathology" },
  { name: "Lichen planus", aliases: ["oral lichen planus"], category: "Oral Pathology" },
  { name: "Primary herpetic gingivostomatitis", aliases: ["HSV gingivostomatitis"], category: "Oral Pathology" },
  { name: "Recurrent herpes labialis", aliases: ["cold sore"], category: "Oral Pathology" },
  { name: "Recurrent aphthous stomatitis", aliases: ["aphthous ulcer", "canker sore"], category: "Oral Pathology" },
  { name: "Traumatic ulcer", aliases: ["traumatic oral ulcer"], category: "Oral Pathology" },
  { name: "Mucocele", aliases: ["mucous cyst"], category: "Oral Pathology" },
  { name: "Ranula", aliases: ["floor of mouth mucocele"], category: "Oral Pathology" },
  { name: "Irritation fibroma", aliases: ["traumatic fibroma", "fibroma"], category: "Oral Pathology" },
  { name: "Pyogenic granuloma", aliases: ["pregnancy tumor"], category: "Oral Pathology" },
  { name: "Peripheral giant cell granuloma", aliases: ["PGCG"], category: "Oral Pathology" },
  { name: "Peripheral ossifying fibroma", aliases: ["POF"], category: "Oral Pathology" },
  { name: "Squamous cell carcinoma", aliases: ["oral cancer", "oral squamous cell carcinoma"], category: "Oral Pathology" },
  { name: "Oral hairy leukoplakia", aliases: ["hairy leukoplakia"], category: "Oral Pathology" },
  { name: "Burning mouth syndrome", aliases: ["BMS"], category: "Oral Pathology" },
  { name: "Dry socket", aliases: ["alveolar osteitis"], category: "Oral Surgery" },
  { name: "Pericoronitis", aliases: ["inflamed operculum"], category: "Oral Surgery" },
  { name: "Osteomyelitis", aliases: ["jaw osteomyelitis"], category: "Oral Surgery" },
  { name: "Medication-related osteonecrosis of the jaw", aliases: ["MRONJ", "bisphosphonate osteonecrosis"], category: "Oral Surgery" },
  { name: "Oroantral communication", aliases: ["oroantral fistula"], category: "Oral Surgery" },
  { name: "Avulsed permanent tooth", aliases: ["dental avulsion", "knocked out tooth"], category: "Dental Trauma" },
  { name: "Uncomplicated crown fracture", aliases: ["enamel dentin fracture"], category: "Dental Trauma" },
  { name: "Complicated crown fracture", aliases: ["pulp exposure fracture"], category: "Dental Trauma" },
  { name: "Root fracture", aliases: ["horizontal root fracture"], category: "Dental Trauma" },
  { name: "Luxation injury", aliases: ["tooth luxation"], category: "Dental Trauma" },
  { name: "Intrusive luxation", aliases: ["intruded tooth"], category: "Dental Trauma" },
  { name: "Extrusive luxation", aliases: ["extruded tooth"], category: "Dental Trauma" },
  { name: "Lateral luxation", aliases: ["laterally displaced tooth"], category: "Dental Trauma" },
  { name: "Concussion injury", aliases: ["tooth concussion"], category: "Dental Trauma" },
  { name: "Subluxation injury", aliases: ["mobile traumatized tooth"], category: "Dental Trauma" },
  { name: "Early childhood caries", aliases: ["ECC", "baby bottle caries"], category: "Pediatric Dentistry" },
  { name: "Eruption cyst", aliases: ["eruption hematoma"], category: "Pediatric Dentistry" },
  { name: "Ankylosed primary molar", aliases: ["submerged primary molar"], category: "Pediatric Dentistry" },
  { name: "Space loss", aliases: ["arch length loss"], category: "Pediatric Dentistry" },
  { name: "Impacted canine", aliases: ["canine impaction"], category: "Orthodontics" },
  { name: "Anterior open bite", aliases: ["open bite"], category: "Orthodontics" },
  { name: "Class II malocclusion", aliases: ["Angle class II"], category: "Orthodontics" },
  { name: "Class III malocclusion", aliases: ["Angle class III"], category: "Orthodontics" },
  { name: "Crossbite", aliases: ["posterior crossbite", "anterior crossbite"], category: "Orthodontics" },
  { name: "Hypoglycemia", aliases: ["low blood sugar", "insulin shock"], category: "Medical Emergencies" },
  { name: "Syncope", aliases: ["fainting", "vasovagal syncope"], category: "Medical Emergencies" },
  { name: "Local anesthetic systemic toxicity", aliases: ["LAST", "local anesthetic toxicity"], category: "Medical Emergencies" },
  { name: "Epinephrine reaction", aliases: ["adrenaline reaction"], category: "Medical Emergencies" },
  { name: "Anaphylaxis", aliases: ["allergic emergency"], category: "Medical Emergencies" },
  { name: "Asthma attack", aliases: ["bronchospasm"], category: "Medical Emergencies" },
  { name: "Angina", aliases: ["chest pain"], category: "Medical Emergencies" },
  { name: "Myocardial infarction", aliases: ["heart attack", "MI"], category: "Medical Emergencies" },
  { name: "Seizure", aliases: ["epileptic seizure"], category: "Medical Emergencies" },
  { name: "Hyperventilation", aliases: ["panic attack breathing"], category: "Medical Emergencies" }
];

export function normalizeTerm(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function editDistance(left: string, right: string) {
  const rows = Array.from({ length: left.length + 1 }, () => [] as number[]);

  for (let row = 0; row <= left.length; row += 1) rows[row][0] = row;
  for (let col = 0; col <= right.length; col += 1) rows[0][col] = col;

  for (let row = 1; row <= left.length; row += 1) {
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      rows[row][col] = Math.min(
        rows[row - 1][col] + 1,
        rows[row][col - 1] + 1,
        rows[row - 1][col - 1] + cost
      );
    }
  }

  return rows[left.length][right.length];
}

export function scoreTerm(query: string, term: string) {
  const normalizedQuery = normalizeTerm(query);
  const normalizedTerm = normalizeTerm(term);

  if (!normalizedQuery) return 0;
  if (normalizedTerm === normalizedQuery) return 100;
  if (normalizedTerm.startsWith(normalizedQuery)) return 90;
  if (normalizedTerm.includes(normalizedQuery)) return 75;

  const compactQuery = normalizedQuery.replace(/\s/g, "");
  const compactTerm = normalizedTerm.replace(/\s/g, "");
  const termWords = normalizedTerm.split(" ");
  const typoDistance = Math.min(
    editDistance(compactQuery, compactTerm.slice(0, Math.max(compactQuery.length, 1))),
    ...termWords.map((word) => editDistance(compactQuery, word.slice(0, Math.max(compactQuery.length, 1))))
  );

  if (compactQuery.length >= 4 && compactQuery.length < 6 && typoDistance <= 1) return 68;
  if (compactQuery.length >= 6 && typoDistance <= 3) return 62;

  return 0;
}

export function searchDiagnoses(query: string, limit = 8) {
  return diagnoses
    .map((diagnosis) => ({
      diagnosis,
      score: Math.max(scoreTerm(query, diagnosis.name), ...diagnosis.aliases.map((alias) => scoreTerm(query, alias)))
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.diagnosis.name.localeCompare(b.diagnosis.name))
    .slice(0, limit)
    .map((item) => item.diagnosis);
}
