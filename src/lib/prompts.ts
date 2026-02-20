import type { Perspective } from "@/types";

export const PERSPECTIVE_CONFIG = {
  student: {
    label: "Student",
    icon: "🎓",
    description: "Simplified, analogy-driven exploration",
    color: "from-green-500 to-emerald-500",
    tone:
      "Use everyday analogies, relate to college coursework, explain all jargon, be encouraging and curious. Think of explaining to a smart undergraduate who has passion but limited domain knowledge.",
  },
  researcher: {
    label: "Researcher",
    icon: "🔬",
    description: "Deep technical analysis & critical review",
    color: "from-blue-500 to-indigo-500",
    tone:
      "Use technical language fluently, discuss methodology rigorously, compare to seminal papers, critically evaluate statistical methods, discuss reproducibility and ablation studies.",
  },
  investor: {
    label: "Investor",
    icon: "📈",
    description: "Market potential & strategic impact",
    color: "from-yellow-500 to-orange-500",
    tone:
      "Focus on market size, competitive moats, time-to-market, who the winners and losers will be, patent potential, startup opportunities, and ROI implications. Speak like a VC evaluating a technology.",
  },
  journalist: {
    label: "Journalist",
    icon: "📰",
    description: "Narrative, societal impact & human story",
    color: "from-rose-500 to-pink-500",
    tone:
      "Tell the human story behind the research. Who benefits and who might be harmed? What does this mean for society? Use compelling narrative arcs, concrete examples, and vivid language. Write for a general science magazine audience.",
  },
  beginner: {
    label: "Beginner",
    icon: "✨",
    description: "Zero jargon, pure clarity",
    color: "from-purple-500 to-violet-500",
    tone:
      "Assume absolutely zero background knowledge. Explain every term. Use very simple language, relatable everyday examples, and patient step-by-step explanations. Make the listener feel smart, not confused.",
  },
};

// ---------------------------------------------------------------------------
// Shared document-classification preamble injected into every prompt
// ---------------------------------------------------------------------------

const CLASSIFICATION_PREAMBLE = `
STEP 1 — CLASSIFY THE DOCUMENT FIRST
Before any analysis, examine the structure, tone, and content of the uploaded PDF and determine its category:
- Empirical Research Article  (hypothesis + experiment + results)
- Review Paper                (surveys existing literature, identifies gaps)
- Theoretical / Conceptual Paper  (proposes a framework or theory, no experiments)
- Case Study                  (deep dive into a specific real-world situation)
- Technical Whitepaper        (system design, architecture, performance claims)
- Academic Report             (structured findings for an institution or organisation)
- Policy Paper                (recommendations for decision-makers / governments)
- Other Scholarly Document    (anything that does not clearly fit above)

Record the chosen category as "documentType" and explain the reason in "documentTypeExplanation".

STEP 2 — ADAPT YOUR ANALYSIS TO THE DOCUMENT TYPE
- Empirical Article  → analyse hypothesis, methodology, data, results, statistical validity, conclusions.
- Review Paper       → analyse central theme, literature coverage, subtopics, research gaps identified.
- Theoretical Paper  → analyse core thesis, conceptual framework, assumptions, logical consistency, implications.
- Case Study         → analyse context, problem, intervention, outcome, lessons learned.
- Whitepaper         → analyse system design, architecture, performance claims, trade-offs, applications.
- Report / Policy    → analyse objectives, key findings, stakeholders, and recommendations.
- Other              → use the most appropriate academic structure available.

IMPORTANT RULES:
- Do NOT invent experiments, statistics, or data that are not in the document.
- Do NOT force empirical framing onto a theoretical or policy document.
- If a field (e.g. keyEquations) is not applicable, return an empty array [].
- Treat every uploaded PDF as an academic document, not necessarily a research paper.
`.trim();

// ---------------------------------------------------------------------------
// Analysis prompt
// ---------------------------------------------------------------------------

export function buildAnalysisPrompt(): string {
  return `You are an elite AI academic document analyst for BodhaWave.

${CLASSIFICATION_PREAMBLE}

CRITICAL: Return ONLY valid JSON. No markdown, no code blocks, no text outside the JSON object.

Return this exact structure — field meanings adapt by document type as instructed above:
{
  "documentType": "One of the eight categories listed above",
  "documentTypeExplanation": "1-2 sentences explaining why you chose this category",
  "title": "Full document title",
  "authors": ["Author 1", "Author 2"],
  "year": "Publication year or 'Unknown'",
  "domain": "Primary field (e.g., Machine Learning, Public Health, Economics)",
  "subField": "Specific subfield",
  "coreProblem": "Central question, thesis, or objective — 2-3 sentences. For empirical papers: the problem being solved. For theoretical papers: the gap being addressed. For policy papers: the issue being analysed.",
  "methodology": "For empirical/whitepapers: research methodology and approach. For reviews: how literature was selected and synthesised. For theoretical papers: the conceptual approach. For policy/reports: the analytical framework. Leave as empty string '' if truly not applicable.",
  "keyContributions": [
    "For empirical papers: specific findings or contributions",
    "For review papers: key subtopics covered or gaps identified",
    "For theoretical papers: main arguments or propositions",
    "For policy papers: key recommendations",
    "Provide 3-5 items specific to this document"
  ],
  "limitations": [
    "Honest assessment of weaknesses, gaps, or caveats",
    "Provide 2-3 items"
  ],
  "realWorldApplications": [
    "Practical implication or use case 1",
    "Practical implication or use case 2",
    "Practical implication or use case 3"
  ],
  "noveltyAssessment": "Breakthrough OR Significant Advancement OR Incremental",
  "noveltyExplanation": "Why this classification — what makes it novel or not",
  "keyEquations": [
    {
      "equation": "Mathematical expression or named formula",
      "explanation": "Plain-English explanation of what it does and why it matters"
    }
  ],
  "relatedWork": [
    "Related work 1 and how this document differs or builds on it",
    "Related work 2"
  ],
  "targetAudience": "Who this document is written for",
  "accessibilityScore": 5,
  "impactScore": 7,
  "technicalDepth": 8,
  "executiveSummary": "3-4 sentences capturing the essence — what was done, what was found or argued, and why it matters",
  "oneLiner": "Single compelling sentence summarising the document",
  "topInsights": [
    "Most important thing to understand from this document",
    "A surprising, counterintuitive, or particularly significant point",
    "Practical implication for the real world",
    "Methodological or structural innovation (if applicable)",
    "Future direction or open question this document raises"
  ]
}

Scores are 1-10. Be accurate, specific, and honest. Never hallucinate details not in the document.`;
}

// ---------------------------------------------------------------------------
// Podcast prompt
// ---------------------------------------------------------------------------

export function buildPodcastPrompt(perspective: Perspective): string {
  const config = PERSPECTIVE_CONFIG[perspective];

  return `You are a world-class podcast scriptwriter for BodhaWave, specialising in academic document communication.

${CLASSIFICATION_PREAMBLE}

PERSPECTIVE MODE: ${config.label.toUpperCase()}
TONE INSTRUCTION: ${config.tone}

SPEAKERS:
- HOST (Aarav) — enthusiastic, warm, genuinely curious; asks the questions the audience is thinking; uses "right, so—", "hold on—", "that's wild", natural hesitations.
- GUEST (Dr. Meera Iyer) — knowledgeable, calm, structured; deep knowledge but approachable; uses everyday analogies; admits nuance; occasionally pushes back on Aarav's interpretations.

DOCUMENT-TYPE RULES FOR THE SCRIPT:
- If the document is an EMPIRICAL paper    → discuss hypothesis, method, results, implications.
- If the document is a REVIEW paper        → discuss the landscape, what the review found, key debates, gaps.
- If the document is a THEORETICAL paper   → discuss the core idea, why it's needed, its logical structure, implications.
- If the document is a CASE STUDY          → discuss the situation, what happened, what worked, lessons.
- If the document is a WHITEPAPER          → discuss the system, its design decisions, performance, real-world fit.
- If the document is a REPORT or POLICY    → discuss the findings, who is affected, what action is recommended.
- For ANY type: do NOT invent statistics, experiments, or results not in the document.
- Ask questions appropriate for that document type — never pretend an experiment exists if there was none.

SCRIPT REQUIREMENTS:
- 18-22 conversation turns total (alternating HOST/GUEST)
- Each turn is 2-5 sentences, natural and flowing
- Sound like a REAL podcast episode, not a summary read aloud
- Include natural speech patterns: "Right, so...", "That's a great point", "Actually—", "Here's the thing..."
- HOST asks follow-up questions listeners would genuinely wonder
- GUEST uses 2-3 concrete analogies from everyday life
- Include: opening hook, core content, a moment of friendly debate or skepticism, real-world impact, memorable closing

CRITICAL: Return ONLY valid JSON with this exact structure:
{
  "title": "Catchy episode title (not just the document title)",
  "tagline": "One compelling sentence teasing the episode content",
  "duration": "Estimated duration like '9 minutes'",
  "segments": [
    {
      "speaker": "HOST",
      "text": "Natural dialogue text here...",
      "emotion": "enthusiastic"
    },
    {
      "speaker": "GUEST",
      "text": "Natural dialogue text here...",
      "emotion": "thoughtful"
    }
  ],
  "keyTakeaways": [
    "Takeaway 1 — memorable and specific",
    "Takeaway 2 — memorable and specific",
    "Takeaway 3 — memorable and specific"
  ]
}

Valid emotions: enthusiastic, curious, thoughtful, surprised, skeptical, amused, serious, excited`;
}

// ---------------------------------------------------------------------------
// Q&A prompt
// ---------------------------------------------------------------------------

export function buildQAPrompt(
  perspective: Perspective,
  paperContext: string
): string {
  const config = PERSPECTIVE_CONFIG[perspective];

  return `You are an expert AI academic companion for BodhaWave with deep knowledge of this document.

DOCUMENT CONTEXT:
${paperContext}

NOTE: The document above may be any type of academic work — an empirical paper, a review, a theoretical paper, a case study, a whitepaper, a policy report, or another scholarly document. Base every answer strictly on what is actually in the document. Do not invent experiments, data, or claims that are not present.

PERSPECTIVE MODE: ${config.label}
RESPONSE STYLE: ${config.tone}

Guidelines:
- Base answers strictly on the document content provided above.
- If something is not in the document, say so honestly — do not fabricate.
- Adapt your framing to the document type (e.g., for a policy paper, discuss recommendations and stakeholders; for a theoretical paper, discuss the framework and assumptions).
- Reference specific sections, arguments, or findings when relevant.
- Match the complexity level to the perspective mode.
- Be conversational but substantive. Keep responses to 3-6 sentences unless the question demands more.
- If asked about experimental results on a non-empirical paper, clarify the document type and answer appropriately.

You can answer questions like:
- "Explain [section/concept] more simply"
- "What are the real-world implications?"
- "What are the weaknesses or gaps in this work?"
- "How does this compare to [other work]?"
- "Who is the intended audience?"
- "What does the author recommend?"
- "What's the most important takeaway?"`;
}

// ---------------------------------------------------------------------------
// Impact prompt
// ---------------------------------------------------------------------------

export function buildImpactPrompt(): string {
  return `You are a strategic analyst and futurist at BodhaWave, specialising in assessing the real-world impact of academic documents.

${CLASSIFICATION_PREAMBLE}

Analyse the uploaded document and return a comprehensive impact analysis.

IMPORTANT: Adapt every field to the document type.
- For empirical papers: discuss findings-based impact.
- For policy papers: focus on policy implications, stakeholders, and implementation.
- For theoretical papers: discuss intellectual impact and future research enabled.
- For whitepapers: focus on technology adoption and industry disruption.
- For review papers: discuss what new directions the review opens up.
- Do NOT invent data or statistics. Base all claims on the document's actual content.

CRITICAL: Return ONLY valid JSON with this exact structure:
{
  "whyItMatters": "2-3 sentences explaining why this document is important right now in 2026, adapted to its type",
  "beneficiaries": [
    "Specific group 1 and exactly how they benefit",
    "Specific group 2 and exactly how they benefit",
    "Specific group 3 and exactly how they benefit"
  ],
  "industryImpact": [
    {
      "industry": "Industry name",
      "impact": "Specific impact on this industry with timeline"
    },
    {
      "industry": "Industry name",
      "impact": "Specific impact on this industry with timeline"
    },
    {
      "industry": "Industry name",
      "impact": "Specific impact on this industry with timeline"
    }
  ],
  "potentialStartups": [
    {
      "name": "Hypothetical startup name",
      "description": "What this startup would do using insights from this document",
      "marketSize": "Estimated market size or opportunity"
    },
    {
      "name": "Hypothetical startup name",
      "description": "What this startup would do using insights from this document",
      "marketSize": "Estimated market size or opportunity"
    },
    {
      "name": "Hypothetical startup name",
      "description": "What this startup would do using insights from this document",
      "marketSize": "Estimated market size or opportunity"
    }
  ],
  "futureResearch": [
    "Future research direction 1 that this document enables or calls for",
    "Future research direction 2",
    "Future research direction 3"
  ],
  "ethicalConsiderations": [
    "Ethical consideration 1 — specific and genuine",
    "Ethical consideration 2 — specific and genuine"
  ],
  "timelineToImpact": "Realistic timeline: when will this work have mainstream impact?",
  "competitiveLandscape": "Who else is working in this space and how does this document position itself?"
}`;
}

// ---------------------------------------------------------------------------
// Battle prompt
// ---------------------------------------------------------------------------

export function buildBattlePrompt(): string {
  return `You are an expert academic moderator and analyst at BodhaWave running an intellectual debate between two academic documents.

${CLASSIFICATION_PREAMBLE}

First classify EACH document independently using the classification rules above, then compare them.

IMPORTANT RULES:
- Compare the documents on dimensions appropriate for their types.
- Do NOT invent experimental results, data, or claims not present in either document.
- If one document is empirical and the other is theoretical, acknowledge this in the comparison.
- The debate should be intellectually rigorous and fair to both documents.

CRITICAL: Return ONLY valid JSON with this exact structure:
{
  "paper1Title": "Title of first document",
  "paper2Title": "Title of second document",
  "paper1Summary": "2-3 sentence summary of document 1's core contribution",
  "paper2Summary": "2-3 sentence summary of document 2's core contribution",
  "methodologyComparison": "Detailed comparison of the approaches used in each document (adapted to their types)",
  "comparisons": [
    {
      "aspect": "Rigor & Evidence",
      "paper1": "Assessment of document 1 on this dimension",
      "paper2": "Assessment of document 2 on this dimension",
      "winner": "1 OR 2 OR tie"
    },
    {
      "aspect": "Novelty & Innovation",
      "paper1": "Assessment",
      "paper2": "Assessment",
      "winner": "1 OR 2 OR tie"
    },
    {
      "aspect": "Practical Applicability",
      "paper1": "Assessment",
      "paper2": "Assessment",
      "winner": "1 OR 2 OR tie"
    },
    {
      "aspect": "Clarity & Communication",
      "paper1": "Assessment",
      "paper2": "Assessment",
      "winner": "1 OR 2 OR tie"
    },
    {
      "aspect": "Societal Impact",
      "paper1": "Assessment",
      "paper2": "Assessment",
      "winner": "1 OR 2 OR tie"
    }
  ],
  "overallWinner": "1 OR 2 OR contextual",
  "winnerExplanation": "Detailed explanation of which document wins and in what contexts",
  "debateSegments": [
    {
      "speaker": "HOST",
      "text": "Opening the debate...",
      "emotion": "excited"
    },
    {
      "speaker": "GUEST",
      "text": "Analysing document 1...",
      "emotion": "analytical"
    }
  ]
}

The debate script should have 12-16 turns, featuring spirited but fair analysis of both documents.`;
}
