/**
 * Source of truth for every word on this site.
 *
 * Requirements §3: "Everything here comes from Niaz's CV. Nothing outside this
 * list may be asserted on the site." So this file is the only place content is
 * authored, and three things are generated from it:
 *
 *   1. supabase/migrations/0002_portfolio_seed.sql  (what the database holds)
 *   2. client/src/data/content.json                 (the build-time snapshot)
 *   3. the payload the Express API serves at /api/content
 *
 * Run `npm run generate` after editing. Never edit the two generated files.
 *
 * Anything unverifiable is marked TODO_NIAZ and rendered as a visible gap
 * rather than invented — see docs/OPEN-ITEMS.md.
 */

/** Rendered by the client as an obvious, un-shippable placeholder. */
export const TODO = (what) => ({ __todo: what });

// ─────────────────────────────────────────────────────────────────────────────
// Identity
// ─────────────────────────────────────────────────────────────────────────────

export const profile = {
  name: "Niaz Nafi Rahman",
  role: "Executive — Product",
  employer: "US-Bangla Airlines Ltd",
  location: "Dhaka, Bangladesh",

  /**
   * Requirements §5.1 gives a starting line and says to tune it for the web.
   * Tightened: the CV line is a sentence; a hero needs to be readable at a
   * glance on a 360px screen. Both halves of the split (§1) are stated once.
   */
  positioning:
    "Product executive at US-Bangla Airlines. I build software that does more with less — and Bangla ambigrams that read two ways.",

  // §3: publish the email, never the phone number or the referees.
  email: "niaznafirahman@gmail.com",
  links: {
    github: "https://github.com/NiazNafi",
    linkedin: "https://www.linkedin.com/in/niaz-rahman",
    practice: "https://ghurnilipi.com",
  },

  /**
   * §5.6: short, first person, and the through-line is Bangla script tying the
   * research, the art and the tooling together. No "passionate about".
   */
  about: [
    "I read Computer Science at BRAC University and finished in 2025. I now work on product at US-Bangla Airlines, which mostly means turning what people actually need into something an engineering team can build.",
    "The thread through everything else is the Bangla script. My thesis was about how language models read Bangla news; my side practice draws Bangla names as rotational ambigrams; and the tool I built for that practice exists because I kept re-solving the same letter-pair problem by hand. Same alphabet, three different problems.",
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Experience — §3, §5.3
// ─────────────────────────────────────────────────────────────────────────────

export const experience = [
  {
    id: "us-bangla",
    title: "Executive — Product",
    org: "US-Bangla Airlines Ltd",
    location: "Dhaka",
    start: "2025-09",
    end: null,
    period: "September 2025 — present",
    /**
     * BLOCKING-1 is unresolved, so this is the document's own stated default:
     * "describe the role generically — requirements gathering, specification
     * writing, prototyping, UAT, working with UI/UX and engineering — with no
     * vendor names, no counts, no internal process detail."
     *
     * Do not add specifics here until Niaz has cleared them with his manager.
     */
    summary:
      "Product work for an airline: gathering requirements from the people who do the job, writing them up as specifications an engineering team can build from, prototyping the parts that need to be seen before they can be agreed, and running user acceptance testing. Day to day that means sitting between operations, UI/UX and engineering.",
    confidentialityNote:
      "Described generically on purpose. Specifics of the current work are the employer's to disclose, not mine.",
    tags: ["Requirements", "Specification", "Prototyping", "UAT"],
  },
  {
    id: "ghurnilipi",
    title: "Independent Ambigram Artist",
    org: "Ghurnilipi",
    orgUrl: "https://ghurnilipi.com",
    location: "Dhaka",
    start: "2020-02",
    end: null,
    period: "February 2020 — present",
    /**
     * §5.3: framed as a practice he built and runs, not a hobby. That framing
     * is the part that counts for a business-facing role.
     */
    summary:
      "An independent practice making original Bangla ambigrams, sold directly. I run the whole pipeline myself: taking the brief, drawing in Adobe Illustrator, pricing, revisions, and delivery.",
    tags: ["Adobe Illustrator", "Pricing", "Client delivery"],
  },
  {
    id: "bracu-tutor",
    title: "Student Tutor",
    org: "BRAC University",
    location: "Dhaka",
    start: "2024-02",
    end: "2025-05",
    period: "February 2024 — May 2025",
    summary:
      "Taught 300+ students across lab sessions and one-to-one consultations in Python, object-oriented programming, and data structures and algorithms. 15 hours a week alongside a full course load.",
    tags: ["Python", "OOP", "Data structures & algorithms"],
  },
];

export const education = [
  {
    id: "bracu",
    qualification: "B.Sc. Computer Science",
    org: "BRAC University",
    finished: "July 2025",
    result: "CGPA 3.90 / 4.00",
  },
  {
    id: "ndc",
    qualification: "HSC",
    org: "Notre Dame College",
    finished: "July 2020",
    result: "GPA 5.00",
  },
  {
    id: "isc",
    qualification: "SSC",
    org: "Ideal School and College",
    finished: "2018",
    result: "GPA 5.00",
  },
];

export const awards = [
  {
    id: "junior-programming-contest",
    title: "Champion, BRACU Intra University Junior Programming Contest",
    year: "2022",
  },
  {
    id: "vc-dean-list",
    title: "Vice Chancellor's List and Dean's List, BRAC University",
    year: "2021 — 2025",
  },
];

/** §3, verbatim groupings. Order within a group is the CV's order. */
export const skills = [
  {
    id: "product",
    label: "Product",
    items: [
      "Requirements gathering",
      "Stakeholder management",
      "User stories",
      "Wireframing",
      "Agile",
      "PRD documentation",
    ],
  },
  {
    id: "prototyping",
    label: "Prototyping",
    items: ["Lovable", "Gemini", "React", "Tailwind"],
  },
  {
    id: "languages",
    label: "Languages",
    items: ["Python (proficient)", "Java", "C++", "JavaScript", "SQL"],
  },
  {
    id: "ml",
    label: "ML & vision",
    items: [
      "LangChain",
      "Hugging Face Transformers",
      "PyTorch",
      "OpenCV",
      "YOLO",
      "NumPy",
      "Pandas",
    ],
  },
  {
    id: "web",
    label: "Web & data",
    items: ["React", "Express.js", "Tailwind", "HTML/CSS", "MySQL", "PostgreSQL"],
  },
  {
    id: "robotics",
    label: "Robotics",
    items: ["ROS", "Jetson Xavier", "Raspberry Pi", "RealSense", "LiDAR"],
  },
  {
    id: "creative",
    label: "Creative",
    items: ["Design thinking", "Adobe Illustrator", "Bangla typography"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Projects — §5.5, in the order the requirements fix
// ─────────────────────────────────────────────────────────────────────────────

export const projects = [
  {
    id: "ambigram-panel",
    order: 10,
    title: "Bangla Ambigram Illustrator Panel",
    kicker: "The art and the engineering meeting",
    /** §5.5: say explicitly that the motivation was re-solving the same
     *  problem by hand. That is the interesting part. */
    oneLiner:
      "An Adobe Illustrator panel that remembers letter pairings, for anyone drawing Bangla ambigrams — which in practice is me.",
    body: "Every ambigram is built out of letter pairings: shapes that read as one letter upright and a different one upside down. I was solving the same pairings over and over by hand. So the panel stores each pairing the first time it is drawn, finds it again by letter, and places it back on the artboard. Each finished word records which pairings built it. Everything lands on disk as readable files plus two spreadsheets, so the archive outlives the tool.",
    stack: ["Adobe Illustrator UXP", "Node.js", "JavaScript"],
    // Verified public, with a substantial README covering installation, the
    // platform decisions, the endpoints and the dataset structure.
    link: "https://github.com/NiazNafi/Bangla-ambigram-illustrator-panel",
  },
  {
    id: "thesis",
    order: 20,
    title: "Bridging Human and Model Perspectives",
    kicker: "Undergraduate thesis",
    oneLiner:
      "Political bias detection in news media using large language models — measured against what human annotators actually agreed on.",
    body: "A 15,000-article human-annotated corpus drawn from the FIGNEWS 2024 subset, with inter-annotator agreement of kappa 0.65 to 0.68. Five model families were evaluated across three inference regimes, and the interesting result is the gap: where models and people disagree about what counts as bias.",
    stack: ["Python", "Hugging Face Transformers", "LangChain"],
    link: null,
    linkNote: TODO("exact arXiv URL for the thesis"),
  },
  {
    id: "ai-tutoring",
    order: 30,
    title: "AI Tutoring Platform",
    kicker: "Full-stack EdTech · Nov — Dec 2024",
    oneLiner:
      "A study tool that generates questions from the material a student is actually reading, and marks them as they go.",
    body: "Contextual multiple-choice generation, a chatbot for follow-up questions, and feedback during a test rather than after it. Built on the Groq API because the latency budget for 'feels like a tutor' is small.",
    stack: ["React", "Express.js", "Groq API"],
    link: null,
    linkNote: TODO(
      "is the AI Tutoring Platform demo still live? A dead 'Live Demo' link is worse than no link",
    ),
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// BRACU Alter — §5.4
//
// Accuracy constraint from §3, which the copy below obeys literally:
//   · he led ONE functional team (AI) inside a larger squad
//   · the robot reached global finalist; he did NOT travel to Eindhoven
// ─────────────────────────────────────────────────────────────────────────────

export const caseStudy = {
  id: "bracu-alter",
  slug: "bracu-alter",
  title: "BRACU Alter at RoboCup Rescue 2024",
  role: "AI Team Lead — the five-person AI team within the BRACU Alter squad",
  period: "February 2023 — August 2024",
  repo: "https://github.com/NiazNafi/Bracu-Alter",
  summary:
    "A rescue rover that has to find hazard signs in a collapsed building and put them on a map, built by a university squad on a student budget. I led the five-person AI team inside that squad.",

  /** §5.4: problem → his team's slice → what they built → the result. */
  sections: [
    {
      id: "problem",
      heading: "The problem",
      body: [
        "RoboCup Rescue sets robots loose in a mocked-up disaster site: rubble, ramps, no reliable radio, no map. A robot scores by finding hazardous-material placards, reading them correctly, and reporting where they are — not just that a sign exists, but where in the building it is.",
        "Two constraints shape everything. The compute has to ride on the robot, so it is a Jetson Xavier and a Raspberry Pi rather than a workstation. And the whole thing is funded like a student project, which turns every sensor choice into a real decision.",
      ],
    },
    {
      id: "slice",
      heading: "My team's slice of it",
      body: [
        "BRACU Alter is a squad split across mechanical, electronics, control and AI. I led the AI team — five people — and we owned the part between the cameras and the map: navigation under ROS Noetic, detecting and classifying the hazmat signs, and turning a detection into a coordinate somebody could act on.",
        "That scoping matters. The chassis, the drivetrain and the firmware were other people's work, and the squad had its own team lead.",
      ],
    },
    {
      id: "built",
      heading: "What we built",
      body: [
        "A computer vision pipeline for hazmat placard detection, running on the robot's own hardware rather than streaming frames off it. Detection alone is not worth much in this event, so we fused it with RealSense depth data: once a sign is detected in the frame, the depth reading places it on the live map at the position it was actually seen from.",
        "The mapping architecture was the decision I am most pleased with. The obvious build for 2D and 3D mapping wanted sensors we could not justify. I proposed an alternative arrangement that held the performance we needed on a substantially cheaper sensor set.",
      ],
    },
  ],

  /** §5.4: the two hard numbers, each with the context that makes it mean
   *  something. Both come straight from §3. */
  outcomes: [
    {
      id: "accuracy",
      figure: "95%",
      label: "hazmat sign detection accuracy",
      context:
        "On the vision pipeline, running on the robot's own edge hardware — a Jetson Xavier and a Raspberry Pi — not on a workstation with the frames streamed off the robot.",
    },
    {
      id: "cost",
      figure: "50%",
      label: "reduction in mapping hardware cost",
      context:
        "A 2D/3D mapping architecture I proposed that reached the performance we needed on half the sensor budget. On a student-funded team this is the difference between building the thing and not.",
    },
    {
      id: "result",
      figure: "Global finalist",
      label: "RoboCup Rescue 2024, Eindhoven",
      context:
        "The robot reached the final. I worked on it from Dhaka and did not travel to the event.",
    },
  ],

  /**
   * BLOCKING-4. Two image files were supplied in the project directory. I
   * looked at both, and neither can be published as-is:
   *
   *   bracu_alter.jpg  (1024×768) — a "Meet the core team" promotional card
   *     carrying head-and-shoulders photographs of nine named people, plus
   *     BRAC University and LASSET logos. That is squad media featuring
   *     identifiable third parties, and it is not Niaz's to republish.
   *
   *   BracuAlter.jfif  (225×225)  — a television news graphic about the team
   *     reaching the final, carrying a broadcaster's branding. Third-party
   *     copyright, and at 225px it is far below the 1600px floor in §5.4
   *     anyway.
   *
   * So the case study ships with no photographs and says so, rather than
   * shipping a rights problem. See docs/OPEN-ITEMS.md.
   */
  photos: [],
  photosNote: TODO(
    "2–3 publishable photographs of the robot or the build, at least 1600px on the long edge, that Niaz shot or has written clearance to republish. The two files currently in the project directory are team promo and TV news graphics — neither is his to post.",
  ),

  /**
   * §5.4 is unambiguous: do not embed this with Facebook's SDK or iframe.
   * Fallback tier 3 (plain text link) until someone confirms the URL resolves
   * and who owns the video.
   */
  video: {
    url: "https://www.facebook.com/watch/?v=1143267400016977",
    label: "Watch the BRACU Alter team video on Facebook",
    credit: "Produced by BRACU Alter. Team context, not a record of my own work.",
    unverified: true,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Ambigrams — §5.2
//
// Bangla readings and notes are carried over from the ghurnilipi catalogue,
// which is Niaz's own copy for his own pieces.
//
// ┌───────────────────────────────────────────────────────────────────────┐
// │ NIAZ — the `bn` strings were transliterated from filenames, not read  │
// │ off the artwork. On an ambigram site a wrong matra is the worst       │
// │ possible bug. Please check them; each is a one-word edit here.        │
// └───────────────────────────────────────────────────────────────────────┘
//
// Assets are WebP, not SVG. §5.2 asks for SVG and he does not have SVG
// exports — see docs/OPEN-ITEMS.md. Rotation of a raster at a fixed display
// size is visually fine; the cost is file weight and scaling headroom.
// ─────────────────────────────────────────────────────────────────────────────

/** @param {string} id @param {number} order */
const piece = (id, order, kind, reads, extra = {}) => ({
  id,
  order,
  kind,
  reads,
  widths: [480, 960, 1600],
  ...extra,
});

export const ambigrams = [
  piece("mayeesha-aaman", 10, "couple", [
    { bn: "মায়ীশা", en: "Mayeesha" },
    { bn: "আমান", en: "Aaman" },
  ], {
    hero: true,
    featured: true,
    year: 2025,
    note: "Two names in one drawing. Turn it over and the other person's name is the one you were looking at all along.",
  }),
  piece("adib-rabita", 20, "couple", [
    { bn: "আদিব", en: "Adib" },
    { bn: "রাবিতা", en: "Rabita" },
  ], {
    featured: true,
    year: 2025,
    note: "Twin spirals at opposite corners, so the composition is symmetrical under the half turn even before you read it.",
  }),
  piece("saiara-akif", 30, "couple", [
    { bn: "সাইয়ারা", en: "Saiara" },
    { bn: "আকিফ", en: "Akif" },
  ], { featured: true, year: 2025 }),
  piece("shourov-taniya", 40, "couple", [
    { bn: "সৌরভ", en: "Shourov" },
    { bn: "তানিয়া", en: "Taniya" },
  ], { year: 2025 }),

  piece("sompriti", 50, "word", [{ bn: "সম্প্রীতি", en: "Sompriti", gloss: "harmony" }], {
    featured: true,
    year: 2025,
    note: "A word whose meaning is two sides agreeing, set as one drawing that reads two ways. The conjunct ম্প্র is three consonants stacked — it had to survive being turned over intact.",
  }),
  piece("bangla", 60, "word", [{ bn: "বাংলা", en: "Bangla" }], {
    featured: true,
    year: 2025,
    note: "Two red discs, one above and one below, so the flag reads the same either way up.",
  }),
  piece("shunnota", 70, "word", [{ bn: "শূন্যতা", en: "Shunnota", gloss: "emptiness" }], {
    featured: true,
    year: 2025,
  }),

  piece("musab", 80, "single", [{ bn: "মুসআব", en: "Musab" }], {
    featured: true,
    year: 2025,
    note: "Drawn in white on black — the one reversed-out piece in the set.",
  }),
  piece("shreya", 90, "single", [{ bn: "শ্রেয়া", en: "Shreya" }], {
    featured: true,
    year: 2025,
  }),
  piece("abheri", 100, "single", [{ bn: "আভেরি", en: "Abheri" }], { year: 2025 }),
  piece("minhaj", 110, "single", [{ bn: "মিনহাজ", en: "Minhaj" }], { year: 2025 }),
  piece("minhaj-alt", 120, "single", [{ bn: "মিনহাজ", en: "Minhaj" }], {
    year: 2025,
    note: "The same name, resolved a second way. Most names have more than one solution; they are rarely equally good.",
  }),
  piece("nafis", 130, "single", [{ bn: "নাফিস", en: "Nafis" }], { year: 2025 }),
  piece("towsif", 140, "single", [{ bn: "তাওসিফ", en: "Towsif" }], { year: 2025 }),
  piece("tonu", 150, "single", [{ bn: "তনু", en: "Tonu" }], { year: 2025 }),
  piece("jarif", 160, "single", [{ bn: "জারিফ", en: "Jarif" }], { year: 2025 }),
  piece("mihan", 170, "single", [{ bn: "মিহান", en: "Mihan" }], { year: 2025 }),
];

/**
 * §5.2: two or three sentences, plain language, positioned where a curious
 * recruiter reads it by accident. No definition-then-example; the example is
 * above it on the page and they have already turned one over.
 */
export const technique = {
  heading: "Why Bangla makes this hard",
  body: [
    "A rotational ambigram is one drawing that reads as one word the right way up and a different word turned 180°. Nothing changes but your point of view.",
    "Bangla resists it in three specific ways. Conjuncts (যুক্তাক্ষর) fuse two or three consonants into a single shape, so the unit you are inverting is often not a letter at all. Matras hang above and below the line, and they do not survive a rotation unless the pairing was designed for it. And the মাত্রা — the headline stroke running across the top of the word — becomes a floor when you turn the drawing over, so it has to read as both.",
    "Most letter pairs simply do not resolve. The work is finding the ones that do, and then drawing them so neither reading looks like the compromise.",
  ],
  commission: {
    text: "The finished pieces are sold through my practice.",
    linkLabel: "ghurnilipi.com",
    href: "https://ghurnilipi.com",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Site-level
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  /** BLOCKING-2 unresolved. Placeholder canonical origin; change in one place. */
  url: "https://niaznafi.com",
  urlIsPlaceholder: true,
  title: "Niaz Nafi Rahman — Product, and Bangla ambigrams",
  description:
    "Executive — Product at US-Bangla Airlines, Dhaka. Computer Science, BRAC University. AI team lead on a RoboCup Rescue global finalist. Rotational ambigrams in Bangla script.",
  ogImage: "/og.png",
  cv: {
    href: "/cv.pdf",
    label: "Download CV",
    missing: true, // generator warns until the real file is dropped in
  },
};

export default {
  site,
  profile,
  experience,
  education,
  awards,
  skills,
  projects,
  caseStudy,
  ambigrams,
  technique,
};
