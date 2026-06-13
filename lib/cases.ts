export type DentalCase = {
  id: string;
  number: string;
  mode: string;
  category: string;
  difficulty: string;
  title: string;
  prompt: string;
  clues: string[];
  answer: string;
  aliases: string[];
  explanation: string;
  differentials: string[];
  image: {
    src: string;
    alt: string;
    credit: string;
    apiQuery: string;
    clueRole: string;
  };
};

export const cases: DentalCase[] = [
  {
    id: "dental-dx-001",
    number: "1",
    mode: "Dentle Dx",
    category: "Endodontics",
    difficulty: "Beginner",
    title: "Lingering Cold Pain",
    prompt: "Cold pain on a mandibular molar lingers for nearly a minute after the stimulus is removed.",
    clues: [
      "Deep occlusal restoration with recurrent caries.",
      "Percussion and palpation are normal.",
      "No apical radiolucency is visible.",
      "Cold testing reproduces severe lingering pain.",
      "The diagnosis is pulpal, not apical."
    ],
    answer: "Symptomatic irreversible pulpitis",
    aliases: ["irreversible pulpitis", "SIP"],
    explanation: "Lingering thermal pain without apical findings is the classic pattern for symptomatic irreversible pulpitis.",
    differentials: ["Reversible pulpitis", "Cracked tooth syndrome", "Symptomatic apical periodontitis"],
    image: {
      src: "https://upload.wikimedia.org/wikipedia/commons/d/d2/ToothMontage3.jpg",
      alt: "Dental caries montage with visible decay and radiographic demineralization arrows",
      credit: "Wikimedia Commons: ToothMontage3.jpg",
      apiQuery: "deep dental caries radiograph pulpitis",
      clueRole: "Show deep caries or radiographic decay that supports pulpal inflammation."
    }
  },
  {
    id: "dental-radio-001",
    number: "2",
    mode: "Radiograph",
    category: "Oral Radiology",
    difficulty: "Intermediate",
    title: "Cyst Around An Impacted Tooth",
    prompt: "A well-defined radiolucency surrounds the crown of an unerupted mandibular third molar.",
    clues: [
      "The radiolucency attaches near the cementoenamel junction.",
      "The lesion is associated with an impacted tooth.",
      "The patient reports no pain or swelling.",
      "The differential includes OKC and ameloblastoma.",
      "This is a developmental odontogenic cyst."
    ],
    answer: "Dentigerous cyst",
    aliases: ["follicular cyst"],
    explanation: "A unilocular radiolucency attached at the CEJ and surrounding an unerupted crown strongly suggests a dentigerous cyst.",
    differentials: ["Odontogenic keratocyst", "Ameloblastoma", "Normal dental follicle"],
    image: {
      src: "https://upload.wikimedia.org/wikipedia/commons/c/c9/JawCyst_%28with_arrows%29.jpg",
      alt: "Radiograph showing a dentigerous cyst around an impacted wisdom tooth, marked with arrows",
      credit: "Wikimedia Commons: JawCyst_(with_arrows).jpg",
      apiQuery: "dentigerous cyst radiograph",
      clueRole: "Show the actual radiolucency around an impacted wisdom tooth."
    }
  },
  {
    id: "dental-lesion-001",
    number: "3",
    mode: "Oral Path",
    category: "Oral Pathology",
    difficulty: "Beginner",
    title: "Wipeable White Plaques",
    prompt: "A patient recently used broad-spectrum antibiotics and now has burning discomfort with white oral plaques.",
    clues: [
      "The plaques wipe away.",
      "The surface underneath is erythematous.",
      "The patient reports altered taste.",
      "This is opportunistic and fungal.",
      "Topical antifungal therapy is commonly used."
    ],
    answer: "Pseudomembranous candidiasis",
    aliases: ["oral candidiasis", "thrush", "pseudomembranous candidosis"],
    explanation: "Wipeable white plaques after antibiotic use point toward pseudomembranous candidiasis.",
    differentials: ["Leukoplakia", "Lichen planus", "Chemical burn"],
    image: {
      src: "https://upload.wikimedia.org/wikipedia/commons/4/4f/Oral_pseudomembranous_candidiasis_on_the_dorsum_of_the_tongue_of_a_59-year-old_male_%28third_week_of_RT_for_a_squamous_cell_carcinoma_of_the_floor_of_the_mouth%2C_T3N0M0%2C_daily_dose_1.8_Gy%29.png",
      alt: "Oral pseudomembranous candidiasis showing white plaques on the tongue",
      credit: "Wikimedia Commons: Oral pseudomembranous candidiasis image",
      apiQuery: "oral candidiasis mouth",
      clueRole: "Show wipeable white plaques or a closely matching oral candidiasis finding."
    }
  },
  {
    id: "dental-plan-001",
    number: "4",
    mode: "Treatment Plan",
    category: "Dental Trauma",
    difficulty: "Intermediate",
    title: "Knocked-Out Incisor",
    prompt: "A 12-year-old arrives 25 minutes after a permanent maxillary central incisor was avulsed and stored in milk.",
    clues: [
      "The tooth has a closed apex.",
      "Extraoral dry time was under 60 minutes.",
      "The socket is intact.",
      "The root should not be scrubbed.",
      "The immediate priority is returning the tooth to the socket."
    ],
    answer: "Replant the tooth",
    aliases: ["immediate replantation", "reimplant the tooth", "replantation", "replant"],
    explanation: "For a permanent avulsed tooth with short extraoral time and physiologic storage, prompt replantation is the key next step.",
    differentials: ["Store and refer only", "Extract permanently", "Primary tooth replantation"],
    image: {
      src: "https://upload.wikimedia.org/wikipedia/commons/7/76/Avulsion.jpg",
      alt: "Avulsed permanent tooth displaced from its socket",
      credit: "Wikimedia Commons: Avulsion.jpg",
      apiQuery: "dental avulsion permanent tooth",
      clueRole: "Show the avulsed tooth finding that makes replantation the tested decision."
    }
  },
  {
    id: "dental-emergency-001",
    number: "5",
    mode: "Emergency",
    category: "Medical Emergencies",
    difficulty: "Beginner",
    title: "Shaky And Sweaty",
    prompt: "A diabetic patient becomes shaky, sweaty, and confused during a long appointment after skipping breakfast.",
    clues: [
      "The patient is conscious and able to swallow.",
      "Symptoms began before local anesthesia.",
      "A fast carbohydrate is indicated.",
      "The likely event is low blood glucose.",
      "This can progress quickly if untreated."
    ],
    answer: "Hypoglycemia",
    aliases: ["low blood sugar", "hypoglycemic episode", "insulin shock"],
    explanation: "Shakiness, sweating, confusion, skipped food intake, and diabetes point to hypoglycemia.",
    differentials: ["Syncope", "Epinephrine reaction", "Local anesthetic toxicity"],
    image: {
      src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/GlucaGen.jpg",
      alt: "Glucagon emergency kit used for severe hypoglycemia",
      credit: "Wikimedia Commons: GlucaGen.jpg",
      apiQuery: "hypoglycemia glucagon emergency kit",
      clueRole: "Show a hypoglycemia emergency treatment clue rather than a generic clinic image."
    }
  }
];
