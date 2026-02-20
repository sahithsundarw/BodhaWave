"use client";

import {
  TrendingUp,
  Users,
  Building2,
  Rocket,
  FlaskConical,
  Shield,
  Clock,
  Globe,
  Loader2,
} from "lucide-react";
import { useState, useCallback } from "react";
import type { ImpactAnalysis } from "@/types";

interface ImpactAnalyzerProps {
  pdfBase64: string;
  onImpactLoaded: (impact: ImpactAnalysis) => void;
  impact: ImpactAnalysis | null;
}

export default function ImpactAnalyzer({
  pdfBase64,
  onImpactLoaded,
  impact,
}: ImpactAnalyzerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImpact = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/impact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfBase64 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to analyze impact");
      onImpactLoaded(data.impact);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impact analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [pdfBase64, onImpactLoaded]);

  if (!impact) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-rose-500/20 to-orange-500/20 border border-rose-500/20 flex items-center justify-center mb-6">
          <TrendingUp className="w-10 h-10 text-rose-400" />
        </div>
        <h3 className="text-xl font-bold text-white mb-2">
          Future & Impact Analyzer
        </h3>
        <p className="text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
          Discover who benefits from this research, which industries it disrupts,
          what startups it could birth, and its 2026 strategic significance.
        </p>
        <button
          onClick={generateImpact}
          disabled={isLoading}
          className="btn-gradient px-8 py-3 rounded-xl text-white font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing Impact...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Generate Impact Analysis
            </>
          )}
        </button>
        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}
        <p className="text-xs text-gray-600 mt-3">
          Takes ~15 seconds · Powered by Claude AI
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Why It Matters Now */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-500/10 to-orange-500/10 border border-rose-500/20">
        <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4" />
          Why This Matters in 2026
        </h3>
        <p className="text-sm text-gray-200 leading-relaxed">
          {impact.whyItMatters}
        </p>
      </div>

      {/* Timeline */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Timeline to Impact
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {impact.timelineToImpact}
        </p>
      </div>

      {/* Beneficiaries */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-emerald-400" />
          Who Benefits
        </h3>
        <div className="space-y-2">
          {impact.beneficiaries.map((b, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Users className="w-3 h-3 text-emerald-400" />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{b}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Industry Impact */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-violet-400" />
          Industry Impact
        </h3>
        <div className="space-y-3">
          {impact.industryImpact.map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-900/50 border border-gray-800">
              <div className="text-xs font-semibold text-violet-400 mb-1">
                {item.industry}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {item.impact}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Potential Startups */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <Rocket className="w-4 h-4 text-yellow-400" />
          Startup Opportunities
        </h3>
        <div className="space-y-3">
          {impact.potentialStartups.map((startup, i) => (
            <div
              key={i}
              className="p-4 rounded-xl bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="font-semibold text-yellow-300 text-sm">
                  🚀 {startup.name}
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 max-w-[140px] truncate" title={startup.marketSize}>
                  {startup.marketSize}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">
                {startup.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Future Research */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-cyan-400" />
          Future Research Directions
        </h3>
        <div className="space-y-2">
          {impact.futureResearch.map((dir, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="text-cyan-400 text-xs font-mono mt-1">→</div>
              <p className="text-sm text-gray-300 leading-relaxed">{dir}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ethical Considerations */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/5 to-red-500/5 border border-amber-500/20">
        <h3 className="text-sm font-semibold text-amber-400 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Ethical Considerations
        </h3>
        <div className="space-y-2">
          {impact.ethicalConsiderations.map((consideration, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
              <p className="text-sm text-gray-300 leading-relaxed">
                {consideration}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Competitive Landscape */}
      <div className="p-5 rounded-2xl glass">
        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-blue-400" />
          Competitive Landscape
        </h3>
        <p className="text-sm text-gray-300 leading-relaxed">
          {impact.competitiveLandscape}
        </p>
      </div>
    </div>
  );
}
