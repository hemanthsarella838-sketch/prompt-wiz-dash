export type Domain = "coding" | "academic" | "writing" | "marketing";
export type Preset = "vague" | "coding" | "structured" | null;

export interface Scores {
  clarity: number;
  completeness: number;
  efficiency: number;
}

export interface OptimizationRun {
  id: string;
  createdAt: number;
  original: string;
  optimized: string;
  domain: Domain;
  preset: Preset;
  intent: string;
  detectedDomain: string;
  scores: Scores;
  baseline: Scores;
  improvements: string[];
}

const DOMAIN_LABEL: Record<Domain, string> = {
  coding: "Coding",
  academic: "Academic",
  writing: "Writing",
  marketing: "Marketing",
};

const VAGUE_WORDS = [
  "good","nice","better","stuff","things","some","maybe","kind of","a bit","etc","asap","etc.",
];

export function countTokens(text: string) {
  return Math.max(0, Math.round(text.trim().length / 4));
}

export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function clamp(n: number) {
  return Math.max(4, Math.min(99, Math.round(n)));
}

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/\b(fix|debug|error|bug|refactor|optimize code)\b/.test(t)) return "Debug / Refactor";
  if (/\b(write|draft|compose|blog|essay|article|copy)\b/.test(t)) return "Content Generation";
  if (/\b(summar|tl;dr|condense|shorten)\b/.test(t)) return "Summarization";
  if (/\b(explain|why|how does|teach|understand)\b/.test(t)) return "Explanation";
  if (/\b(analy|compare|evaluate|review|audit)\b/.test(t)) return "Analysis";
  if (/\b(build|create|implement|generate|make)\b/.test(t)) return "Creation";
  return "General Instruction";
}

function detectDomain(text: string, fallback: Domain): string {
  const t = text.toLowerCase();
  if (/\b(react|python|api|function|typescript|sql|component|code|bug)\b/.test(t)) return "Coding";
  if (/\b(paper|citation|research|thesis|study|literature)\b/.test(t)) return "Academic";
  if (/\b(campaign|audience|brand|conversion|landing|ad|seo)\b/.test(t)) return "Marketing";
  if (/\b(story|character|essay|tone|narrative|blog)\b/.test(t)) return "Writing";
  return DOMAIN_LABEL[fallback];
}

function scoreBaseline(text: string): Scores {
  const words = countWords(text);
  const t = text.toLowerCase();
  const vagueHits = VAGUE_WORDS.filter((w) => t.includes(w)).length;
  const hasStructure = /[\n•\-\d]\s/.test(text) ? 12 : 0;
  const hasConstraint = /\b(must|should|format|limit|within|no more than|audience)\b/.test(t) ? 14 : 0;

  const clarity = clamp(38 + Math.min(words, 60) * 0.35 - vagueHits * 7 + hasStructure);
  const completeness = clamp(28 + Math.min(words, 90) * 0.45 + hasConstraint + hasStructure * 0.5);
  const efficiency = clamp(88 - Math.max(0, words - 45) * 0.6 - vagueHits * 4);
  return { clarity, completeness, efficiency };
}

const DOMAIN_ROLE: Record<Domain, string> = {
  coding: "a senior software engineer with deep expertise in production-grade systems",
  academic: "a meticulous research assistant trained in academic rigor and citation discipline",
  writing: "an award-winning editor with a sharp ear for voice and pacing",
  marketing: "a growth marketing strategist who writes conversion-focused copy",
};

const DOMAIN_REQS: Record<Domain, string[]> = {
  coding: [
    "State assumptions about language, framework and runtime version before coding.",
    "Return complete, runnable code — no placeholders or elisions.",
    "Include edge cases, error handling and a short complexity note.",
  ],
  academic: [
    "Use precise, neutral academic register; avoid unsupported claims.",
    "Structure as: thesis, supporting evidence, counterpoints, conclusion.",
    "Flag any claim that would require a citation.",
  ],
  writing: [
    "Match the requested tone consistently across the whole piece.",
    "Vary sentence rhythm; cut filler and adverb stacking.",
    "Open with a hook and close with a resonant final line.",
  ],
  marketing: [
    "Lead with the customer's problem, not the product.",
    "Include one clear call to action and a measurable success metric.",
    "Keep claims specific and substantiated.",
  ],
};

const PRESET_LAYER: Record<Exclude<Preset, null>, string> = {
  vague: "Resolve ambiguity explicitly: if any requirement is underspecified, state the interpretation you chose and why before answering.",
  coding: "Treat this as an engineering task: plan briefly, then implement, then list how to verify the result.",
  structured: "Return the answer in clearly labelled sections with headings and bullet points. No walls of text.",
};

export function optimize(input: string, domain: Domain, preset: Preset): OptimizationRun {
  const original = input.trim();
  const baseline = scoreBaseline(original);
  const intent = detectIntent(original);
  const detectedDomain = detectDomain(original, domain);
  const reqs = DOMAIN_REQS[domain];

  const objective = original.replace(/\s+/g, " ").replace(/^(please|hey|hi|can you|could you)\s+/i, "");

  const optimized = [
    `# Role`,
    `You are ${DOMAIN_ROLE[domain]}.`,
    ``,
    `# Objective`,
    objective.endsWith(".") ? objective : `${objective}.`,
    ``,
    `# Context`,
    `- Domain: ${DOMAIN_LABEL[domain]}`,
    `- Detected intent: ${intent}`,
    `- Audience: a competent practitioner who wants actionable output, not a lecture.`,
    ``,
    `# Requirements`,
    ...reqs.map((r) => `- ${r}`),
    preset ? `- ${PRESET_LAYER[preset]}` : `- Prioritise correctness over length.`,
    ``,
    `# Output format`,
    `Respond in Markdown. Begin with a one-sentence summary of your approach, then the full answer.`,
    ``,
    `# Quality bar`,
    `If information is missing, ask at most two targeted clarifying questions first. Otherwise answer in full.`,
  ].join("\n");

  const scores: Scores = {
    clarity: clamp(Math.max(baseline.clarity + 26, 82) + (preset ? 4 : 0)),
    completeness: clamp(Math.max(baseline.completeness + 34, 86)),
    efficiency: clamp(Math.max(baseline.efficiency, 68) + 9),
  };

  const improvements: string[] = [
    `Assigned an explicit expert role to anchor the model's voice and depth.`,
    `Separated objective, context, requirements and output format into labelled sections.`,
    `Injected ${DOMAIN_LABEL[domain].toLowerCase()}-specific quality requirements (${reqs.length} rules).`,
    `Declared intent as "${intent}" so the model optimises for the right task shape.`,
    `Added an explicit output format contract to make responses parseable.`,
    `Added a clarifying-question fallback instead of letting the model guess silently.`,
  ];
  const vagueFound = VAGUE_WORDS.filter((w) => original.toLowerCase().includes(w));
  if (vagueFound.length) {
    improvements.splice(1, 0, `Flagged ${vagueFound.length} vague term(s): ${vagueFound.slice(0, 4).join(", ")}.`);
  }
  if (preset) improvements.push(`Applied preset transformation layer for stronger instruction following.`);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
    original,
    optimized,
    domain,
    preset,
    intent,
    detectedDomain,
    scores,
    baseline,
    improvements,
  };
}

export const SAMPLE_PROMPTS = [
  "write me some good code for a react component that shows a list of things maybe with filters",
  "help me make my blog post better, it's kind of boring and needs some nice stuff",
  "summarize this research paper and explain why it matters asap",
  "give me marketing ideas for my new app launch",
];

export function diffWords(a: string, b: string) {
  const aSet = new Set(a.toLowerCase().match(/[a-z0-9']+/g) ?? []);
  const bSet = new Set(b.toLowerCase().match(/[a-z0-9']+/g) ?? []);
  return {
    added: [...bSet].filter((w) => !aSet.has(w)),
    removed: [...aSet].filter((w) => !bSet.has(w)),
  };
}
