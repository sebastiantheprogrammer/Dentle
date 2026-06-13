window.LAUNCH_CASES = [
  {
    id: "dental-dx-001",
    publishSlot: "#001",
    mode: "Dental Dx",
    title: "The Lingering Cold Case",
    category: "Endodontics",
    difficulty: "Beginner",
    sceneClass: "",
    prompt: "A 29-year-old patient reports sharp cold pain on a mandibular first molar. The pain lingers for nearly a minute after the stimulus is removed.",
    clues: [
      "The tooth has a deep occlusal restoration with recurrent caries at the margin.",
      "Percussion and palpation are normal.",
      "Periapical imaging does not show an apical radiolucency.",
      "Cold testing reproduces severe lingering pain.",
      "The diagnosis is pulpal rather than apical."
    ],
    answer: "Symptomatic irreversible pulpitis",
    aliases: [
      "irreversible pulpitis",
      "sip",
      "symptomatic irreversible pulpitis with normal apical tissues"
    ],
    explanation: "Lingering thermal pain with no apical findings is the classic pattern for symptomatic irreversible pulpitis, often before periapical disease is visible.",
    differentials: ["Reversible pulpitis", "Cracked tooth syndrome", "Symptomatic apical periodontitis"]
  },
  {
    id: "dental-radio-001",
    publishSlot: "#002",
    mode: "Radiograph",
    title: "The Posterior Mandible Shadow",
    category: "Oral Radiology",
    difficulty: "Intermediate",
    sceneClass: "scene-radiograph",
    prompt: "A panoramic image shows a well-defined unilocular radiolucency surrounding the crown of an unerupted mandibular third molar.",
    clues: [
      "The radiolucency attaches near the cementoenamel junction.",
      "The lesion is associated with an impacted tooth.",
      "The patient reports no pain or swelling.",
      "The differential includes odontogenic keratocyst and ameloblastoma.",
      "The most likely answer is a developmental odontogenic cyst."
    ],
    answer: "Dentigerous cyst",
    aliases: ["dentigerous cyst", "follicular cyst"],
    explanation: "A unilocular radiolucency attached at the CEJ and surrounding the crown of an unerupted tooth strongly suggests a dentigerous cyst.",
    differentials: ["Odontogenic keratocyst", "Ameloblastoma", "Normal dental follicle"]
  },
  {
    id: "dental-lesion-001",
    publishSlot: "#003",
    mode: "Oral Path",
    title: "The Wipeable White Patch",
    category: "Oral Pathology",
    difficulty: "Beginner",
    sceneClass: "scene-lesion",
    prompt: "A patient who recently used broad-spectrum antibiotics presents with burning oral discomfort and white plaques on the buccal mucosa.",
    clues: [
      "The plaques can be wiped away, leaving an erythematous surface.",
      "The patient reports altered taste.",
      "The corners of the mouth are also irritated.",
      "The finding is opportunistic and fungal.",
      "Topical antifungal therapy is commonly used."
    ],
    answer: "Pseudomembranous candidiasis",
    aliases: ["oral candidiasis", "candidiasis", "thrush", "pseudomembranous candidosis"],
    explanation: "Wipeable white plaques after antibiotic use point toward pseudomembranous candidiasis rather than a non-wipeable potentially malignant disorder.",
    differentials: ["Leukoplakia", "Lichen planus", "Chemical burn"]
  },
  {
    id: "dental-plan-001",
    publishSlot: "#004",
    mode: "Treatment Plan",
    title: "The Knocked-Out Incisor",
    category: "Dental Trauma",
    difficulty: "Intermediate",
    sceneClass: "scene-plan",
    prompt: "A 12-year-old arrives 25 minutes after a permanent maxillary central incisor was avulsed during basketball. The tooth was stored in milk.",
    clues: [
      "The tooth has a closed apex.",
      "Extraoral dry time was under 60 minutes.",
      "The socket is intact.",
      "The tooth should not be scrubbed aggressively.",
      "The immediate priority is to put the tooth back in the socket."
    ],
    answer: "Replant the tooth",
    aliases: [
      "immediate replantation",
      "reimplant the tooth",
      "replantation",
      "replant"
    ],
    explanation: "For a permanent avulsed tooth with short extraoral time and physiologic storage, prompt replantation is the key next step before splinting and endodontic follow-up.",
    differentials: ["Store and refer only", "Extract permanently", "Primary tooth replantation"]
  },
  {
    id: "dental-emergency-001",
    publishSlot: "#005",
    mode: "Emergency",
    title: "The Sweaty Patient",
    category: "Medical Emergencies",
    difficulty: "Beginner",
    sceneClass: "scene-emergency",
    prompt: "During a long morning appointment, a diabetic patient becomes shaky, sweaty, confused, and says they skipped breakfast.",
    clues: [
      "The patient is conscious and able to swallow.",
      "Symptoms began before local anesthesia was administered.",
      "The condition can progress quickly if untreated.",
      "A fast carbohydrate is indicated.",
      "The likely event is low blood glucose."
    ],
    answer: "Hypoglycemia",
    aliases: ["low blood sugar", "hypoglycemic episode", "insulin shock"],
    explanation: "Shakiness, sweating, confusion, skipped food intake, and diabetes point to hypoglycemia. If conscious, oral glucose or another fast carbohydrate is appropriate.",
    differentials: ["Syncope", "Epinephrine reaction", "Local anesthetic toxicity"]
  }
];
