"use client";

import {
  BookOpen,
  Target,
  Lightbulb,
  AlertTriangle,
  Globe,
  TrendingUp,
  Users,
  Beaker,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import type { PaperAnalysis } from "@/types";

interface PaperInsightsProps {
  analysis: PaperAnalysis;
}

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ScoreBar({ score, label, color }: { score: number; label: string; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-gray-400">{label}</span>
        <span className="text-xs font-semibold text-white">{score}/10</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score * 10}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.25 }}
        />
      </div>
    </div>
  );
}

function NoveltyBadge({ novelty }: { novelty: string }) {
  const config = {
    Breakthrough: { color: "bg-green-500/20 border-green-500/40 text-green-400", icon: "🚀" },
    "Significant Advancement": { color: "bg-blue-500/20 border-blue-500/40 text-blue-400", icon: "⚡" },
    Incremental: { color: "bg-yellow-500/20 border-yellow-500/40 text-yellow-400", icon: "📈" },
  }[novelty] || { color: "bg-gray-500/20 border-gray-500/40 text-gray-400", icon: "📄" };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${config.color}`}>
      {config.icon} {novelty}
    </span>
  );
}

function DocumentTypeBadge({ type, explanation }: { type: string; explanation?: string }) {
  const icons: Record<string, string> = {
    "Empirical Research Article": "🧪",
    "Review Paper": "📚",
    "Theoretical / Conceptual Paper": "💡",
    "Case Study": "🔍",
    "Technical Whitepaper": "⚙️",
    "Academic Report": "📋",
    "Policy Paper": "🏛️",
    "Other Scholarly Document": "📄",
  };
  const icon = icons[type] ?? "📄";

  return (
    <span
      title={explanation}
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold cursor-default"
    >
      {icon} {type}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PaperInsights({ analysis }: PaperInsightsProps) {
  const [showEquations, setShowEquations] = useState(false);
  const [showRelated, setShowRelated] = useState(false);

  return (
    <motion.div
      className="space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Paper header */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-white leading-tight mb-1">
              {analysis.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              {analysis.authors.slice(0, 3).join(", ")}
              {analysis.authors.length > 3 && ` +${analysis.authors.length - 3} more`}
              {analysis.year && (
                <>
                  <span className="text-gray-700">·</span>
                  <span>{analysis.year}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {analysis.documentType && (
              <DocumentTypeBadge
                type={analysis.documentType}
                explanation={analysis.documentTypeExplanation}
              />
            )}
            <NoveltyBadge novelty={analysis.noveltyAssessment} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className="tag-pill">{analysis.domain}</span>
          <span className="tag-pill">{analysis.subField}</span>
          <span className="tag-pill">{analysis.targetAudience}</span>
        </div>

        <p className="text-gray-300 text-sm leading-relaxed">
          {analysis.executiveSummary}
        </p>
      </motion.div>

      {/* Scores */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-violet-400" />
          Paper Metrics
        </h3>
        <div className="space-y-3">
          <ScoreBar
            score={analysis.impactScore}
            label="Research Impact"
            color="from-violet-600 to-violet-400"
          />
          <ScoreBar
            score={analysis.accessibilityScore}
            label="Accessibility"
            color="from-emerald-600 to-emerald-400"
          />
          <ScoreBar
            score={analysis.technicalDepth}
            label="Technical Depth"
            color="from-blue-600 to-blue-400"
          />
        </div>
      </motion.div>

      {/* Top Insights */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-yellow-400" />
          Top 5 Insights
        </h3>
        <div className="space-y-3">
          {analysis.topInsights.map((insight, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{insight}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Core Problem */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-rose-400" />
          Core Problem
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">{analysis.coreProblem}</p>
      </motion.div>

      {/* Methodology */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Beaker className="w-4 h-4 text-blue-400" />
          Methodology
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">{analysis.methodology}</p>
      </motion.div>

      {/* Key Contributions */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-violet-400" />
          Key Contributions
        </h3>
        <div className="space-y-2">
          {analysis.keyContributions.map((contribution, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-300 leading-relaxed">{contribution}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Real-World Applications */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          Real-World Applications
        </h3>
        <div className="space-y-2">
          {analysis.realWorldApplications.map((app, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-300 leading-relaxed">{app}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Limitations */}
      <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          Limitations & Caveats
        </h3>
        <div className="space-y-2">
          {analysis.limitations.map((limitation, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-300 leading-relaxed">{limitation}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Key Equations - collapsible, hidden when empty */}
      {analysis.keyEquations && analysis.keyEquations.length > 0 && (
        <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
          <button
            onClick={() => setShowEquations(!showEquations)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
          >
            <div className="flex items-center gap-2">
              <span className="text-violet-400 font-mono text-base">∑</span>
              Key Equations (Explained Simply)
            </div>
            {showEquations ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {showEquations && (
            <div className="mt-4 space-y-4">
              {analysis.keyEquations.map((eq, i) => (
                <div key={i} className="p-3 rounded-xl bg-gray-900/50 border border-gray-700">
                  <div className="font-mono text-violet-300 text-sm mb-2">
                    {eq.equation}
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {eq.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Related Work - collapsible, hidden when empty */}
      {analysis.relatedWork && analysis.relatedWork.length > 0 && (
        <motion.div variants={cardVariants} className="p-5 rounded-2xl glass">
          <button
            onClick={() => setShowRelated(!showRelated)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-300"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" />
              Related Work & Context
            </div>
            {showRelated ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </button>
          {showRelated && (
            <div className="mt-4 space-y-2">
              {analysis.relatedWork.map((work, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-500 mt-2 flex-shrink-0" />
                  <p className="text-sm text-gray-400 leading-relaxed">{work}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
