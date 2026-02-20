"use client";

import { useState } from "react";
import { FileText, ChevronRight, Check, Sparkles } from "lucide-react";
import type { Perspective, PdfData } from "@/types";
import { PERSPECTIVE_CONFIG } from "@/lib/prompts";

interface PerspectiveSelectorProps {
  pdfData: PdfData;
  onSelect: (perspective: Perspective) => void;
  onBack: () => void;
}

const PERSPECTIVES: Perspective[] = [
  "student",
  "researcher",
  "investor",
  "journalist",
  "beginner",
];

export default function PerspectiveSelector({
  pdfData,
  onSelect,
  onBack,
}: PerspectiveSelectorProps) {
  const [selected, setSelected] = useState<Perspective | null>(null);

  const handleContinue = () => {
    if (selected) onSelect(selected);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-3xl">
        {/* Paper confirmed */}
        <div className="flex items-center gap-3 mb-8 px-5 py-4 rounded-xl glass-violet">
          <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <FileText className="w-5 h-5 text-violet-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500 mb-0.5">Document ready for analysis</div>
            <div className="text-sm font-medium text-white truncate">
              {pdfData.name}
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <Check className="w-3.5 h-3.5" />
            <span>Ready</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Choose your{" "}
            <span className="gradient-text">perspective</span>
          </h2>
          <p className="text-gray-400 text-base">
            The same paper transforms into a completely different conversation
            based on your lens.
          </p>
        </div>

        {/* Perspective cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {PERSPECTIVES.map((p) => {
            const config = PERSPECTIVE_CONFIG[p];
            const isSelected = selected === p;

            return (
              <button
                key={p}
                onClick={() => setSelected(p)}
                className={`relative text-left p-5 rounded-2xl border transition-all duration-300 ${
                  p === "beginner" ? "md:col-span-2" : ""
                } ${
                  isSelected
                    ? "border-violet-500/60 bg-violet-500/10"
                    : "border-gray-800 bg-white/2 hover:border-gray-600 hover:bg-white/3"
                }`}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                    <Check className="w-3 h-3 text-white" />
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center text-lg flex-shrink-0`}
                  >
                    {config.icon}
                  </div>
                  <div>
                    <div className="font-semibold text-white text-sm mb-0.5">
                      {config.label} Mode
                    </div>
                    <div className="text-xs text-gray-400 leading-relaxed mb-2">
                      {config.description}
                    </div>
                    {p === "researcher" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Most detailed
                      </span>
                    )}
                    {p === "beginner" && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Most accessible
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}

        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onBack}
            className="px-5 py-3 rounded-xl text-sm text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600 transition-all"
          >
            Back
          </button>

          <button
            onClick={handleContinue}
            disabled={!selected}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${
              selected
                ? "btn-gradient text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Generate {selected ? `${PERSPECTIVE_CONFIG[selected].label} Experience` : "Experience"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-center text-xs text-gray-600 mt-4">
          Analysis + podcast generation takes approximately 30-60 seconds
        </p>
      </div>
    </div>
  );
}
