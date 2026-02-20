export type DocumentType =
  | "Empirical Research Article"
  | "Review Paper"
  | "Theoretical / Conceptual Paper"
  | "Case Study"
  | "Technical Whitepaper"
  | "Academic Report"
  | "Policy Paper"
  | "Other Scholarly Document";

export interface PaperAnalysis {
  // Document classification
  documentType: DocumentType;
  documentTypeExplanation: string;

  // Bibliographic
  title: string;
  authors: string[];
  year: string;
  domain: string;
  subField: string;

  // Core content — field meaning adapts by document type
  coreProblem: string;        // central question / thesis / objective
  methodology: string;        // approach / framework / structure (empty if N/A)
  keyContributions: string[]; // key arguments / findings / recommendations
  limitations: string[];      // gaps / weaknesses / caveats
  realWorldApplications: string[];

  // Assessment
  noveltyAssessment: "Breakthrough" | "Significant Advancement" | "Incremental";
  noveltyExplanation: string;

  // Optional deep fields (empty arrays for non-technical docs)
  keyEquations: Array<{ equation: string; explanation: string }>;
  relatedWork: string[];

  // Meta
  targetAudience: string;
  accessibilityScore: number;
  impactScore: number;
  technicalDepth: number;
  executiveSummary: string;
  oneLiner: string;
  topInsights: string[];
}

export interface PodcastSegment {
  speaker: "HOST" | "GUEST";
  text: string;
  emotion?: string;
}

export interface PodcastScript {
  title: string;
  tagline: string;
  duration: string;
  segments: PodcastSegment[];
  keyTakeaways: string[];
}

export interface QAMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ImpactAnalysis {
  whyItMatters: string;
  beneficiaries: string[];
  industryImpact: Array<{ industry: string; impact: string }>;
  potentialStartups: Array<{
    name: string;
    description: string;
    marketSize: string;
  }>;
  futureResearch: string[];
  ethicalConsiderations: string[];
  timelineToImpact: string;
  competitiveLandscape: string;
}

export interface BattleComparison {
  aspect: string;
  paper1: string;
  paper2: string;
  winner: "1" | "2" | "tie";
}

export interface PaperBattleResult {
  paper1Title: string;
  paper2Title: string;
  paper1Summary: string;
  paper2Summary: string;
  methodologyComparison: string;
  comparisons: BattleComparison[];
  overallWinner: "1" | "2" | "contextual";
  winnerExplanation: string;
  debateSegments: PodcastSegment[];
}

export type Perspective =
  | "student"
  | "researcher"
  | "investor"
  | "journalist"
  | "beginner";

export interface PdfData {
  base64: string;
  name: string;
}

export type AppPhase =
  | "upload"
  | "perspective"
  | "loading"
  | "results"
  | "battle-upload";
