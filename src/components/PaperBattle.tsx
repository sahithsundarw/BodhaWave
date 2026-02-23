"use client";

import {
  Swords,
  Trophy,
  Upload,
  FileText,
  Loader2,
  Check,
  X,
  Minus,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import type { PaperBattleResult, PdfData } from "@/types";
import PodcastPlayer from "./PodcastPlayer";

interface PaperBattleProps {
  pdf1: PdfData;
  onBattleComplete: (result: PaperBattleResult) => void;
  battleResult: PaperBattleResult | null;
}

const BATTLE_MAX_BYTES = 1.5 * 1024 * 1024; // 1.5 MB per paper in battle mode

function MiniUpload({
  label,
  pdfData,
  onUpload,
  onError,
}: {
  label: string;
  pdfData: PdfData | null;
  onUpload: (data: PdfData) => void;
  onError: (msg: string) => void;
}) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      if (files[0]) {
        if (files[0].size > BATTLE_MAX_BYTES) {
          onError("Each paper must be under 1.5 MB for battle mode.");
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1];
          onUpload({ base64, name: files[0].name });
        };
        reader.readAsDataURL(files[0]);
      }
    },
    accept: { "application/pdf": [".pdf"] },
    maxSize: BATTLE_MAX_BYTES,
    multiple: false,
  });

  if (pdfData) {
    return (
      <div className="p-4 rounded-xl border border-green-500/30 bg-green-500/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-green-400 font-medium mb-0.5">
              {label}
            </div>
            <div className="text-sm text-white truncate">{pdfData.name}</div>
          </div>
          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all text-center ${
        isDragActive
          ? "border-violet-400 bg-violet-500/10"
          : "border-gray-700 hover:border-violet-500/40 hover:bg-violet-500/5"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="w-6 h-6 text-gray-500 mx-auto mb-2" />
      <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
      <div className="text-xs text-gray-600">Drop PDF here · max 1.5 MB</div>
    </div>
  );
}

export default function PaperBattle({
  pdf1,
  onBattleComplete,
  battleResult,
}: PaperBattleProps) {
  const [pdf2, setPdf2] = useState<PdfData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebate, setShowDebate] = useState(false);

  const startBattle = useCallback(async () => {
    if (!pdf2) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdf1Base64: pdf1.base64,
          pdf2Base64: pdf2.base64,
        }),
      });
      if (!res.ok) {
        const msg =
          res.status === 413
            ? "Combined PDFs too large — keep each paper under 1.5 MB."
            : ((await res.json().catch(() => ({ error: "Battle failed" }))).error || "Battle failed");
        throw new Error(msg);
      }
      const data = await res.json();
      onBattleComplete(data.battle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Battle analysis failed");
    } finally {
      setIsLoading(false);
    }
  }, [pdf1, pdf2, onBattleComplete]);

  const getWinnerIcon = (winner: "1" | "2" | "tie") => {
    if (winner === "1") return <Trophy className="w-4 h-4 text-yellow-400" />;
    if (winner === "2") return <Trophy className="w-4 h-4 text-yellow-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  if (!battleResult) {
    return (
      <div className="space-y-6">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
              <Swords className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Paper Battle Mode</h3>
              <p className="text-xs text-gray-400">
                Compare two papers in a head-to-head intellectual debate
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Paper 1 (current)</div>
              <div className="p-4 rounded-xl border border-violet-500/30 bg-violet-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <FileText className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{pdf1.name}</div>
                    <div className="text-xs text-green-400">Already uploaded</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-gray-500 mb-2 font-medium">Paper 2 (challenger)</div>
              <MiniUpload
                label="Upload Challenger"
                pdfData={pdf2}
                onUpload={setPdf2}
                onError={setError}
              />
            </div>
          </div>

          <button
            onClick={startBattle}
            disabled={!pdf2 || isLoading}
            className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${
              pdf2 && !isLoading
                ? "btn-gradient text-white"
                : "bg-gray-800 text-gray-600 cursor-not-allowed"
            }`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running Battle Analysis...
              </>
            ) : (
              <>
                <Swords className="w-4 h-4" />
                Start Paper Battle
              </>
            )}
          </button>

          {error && (
            <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="text-center text-sm text-gray-500">
          <p>The AI will compare methodologies, strengths, weaknesses,</p>
          <p>and generate a debate-style podcast between both papers.</p>
        </div>
      </div>
    );
  }

  // Show battle results
  const paper1Wins = battleResult.comparisons.filter((c) => c.winner === "1").length;
  const paper2Wins = battleResult.comparisons.filter((c) => c.winner === "2").length;
  const ties = battleResult.comparisons.filter((c) => c.winner === "tie").length;

  return (
    <div className="space-y-4">
      {/* Battle header */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-violet-500/30">
        <div className="flex items-center gap-2 mb-4">
          <Swords className="w-5 h-5 text-violet-400" />
          <h3 className="text-base font-bold text-white">Battle Results</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className={`p-3 rounded-xl border ${battleResult.overallWinner === "1" ? "border-yellow-500/40 bg-yellow-500/10" : "border-gray-700 bg-gray-900/30"}`}>
            <div className="text-xs text-gray-500 mb-1">Paper 1</div>
            <div className="text-sm font-medium text-white leading-tight">
              {battleResult.paper1Title}
            </div>
            <div className="text-2xl font-black text-violet-400 mt-2">
              {paper1Wins}
            </div>
            <div className="text-xs text-gray-500">wins</div>
          </div>

          <div className={`p-3 rounded-xl border ${battleResult.overallWinner === "2" ? "border-yellow-500/40 bg-yellow-500/10" : "border-gray-700 bg-gray-900/30"}`}>
            <div className="text-xs text-gray-500 mb-1">Paper 2</div>
            <div className="text-sm font-medium text-white leading-tight">
              {battleResult.paper2Title}
            </div>
            <div className="text-2xl font-black text-cyan-400 mt-2">
              {paper2Wins}
            </div>
            <div className="text-xs text-gray-500">wins</div>
          </div>
        </div>

        {ties > 0 && (
          <div className="text-center text-xs text-gray-500 mt-2">
            {ties} ties
          </div>
        )}
      </div>

      {/* Overall verdict */}
      <div className={`p-5 rounded-2xl border ${
        battleResult.overallWinner === "1"
          ? "border-yellow-500/30 bg-yellow-500/5"
          : battleResult.overallWinner === "2"
          ? "border-cyan-500/30 bg-cyan-500/5"
          : "border-gray-700 glass"
      }`}>
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <h4 className="text-sm font-semibold text-white">Overall Verdict</h4>
          <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-medium ${
            battleResult.overallWinner === "1"
              ? "bg-violet-500/20 text-violet-400"
              : battleResult.overallWinner === "2"
              ? "bg-cyan-500/20 text-cyan-400"
              : "bg-gray-700 text-gray-400"
          }`}>
            {battleResult.overallWinner === "contextual"
              ? "Context-Dependent"
              : `Paper ${battleResult.overallWinner} Wins`}
          </span>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed">
          {battleResult.winnerExplanation}
        </p>
      </div>

      {/* Comparison table */}
      <div className="rounded-2xl glass overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800">
          <h4 className="text-sm font-semibold text-gray-300">
            Head-to-Head Comparison
          </h4>
        </div>
        <div className="divide-y divide-gray-800">
          {battleResult.comparisons.map((comp, i) => (
            <div key={i} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-violet-400">
                  {comp.aspect}
                </span>
                {getWinnerIcon(comp.winner)}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className={`p-2 rounded-lg text-xs text-gray-400 leading-relaxed ${
                  comp.winner === "1" ? "bg-violet-500/10 text-gray-200" : ""
                }`}>
                  <span className="text-violet-500 font-medium block mb-1">P1</span>
                  {comp.paper1}
                </div>
                <div className={`p-2 rounded-lg text-xs text-gray-400 leading-relaxed ${
                  comp.winner === "2" ? "bg-cyan-500/10 text-gray-200" : ""
                }`}>
                  <span className="text-cyan-500 font-medium block mb-1">P2</span>
                  {comp.paper2}
                </div>
              </div>
              {comp.winner !== "tie" && (
                <div className="mt-2 flex items-center gap-1">
                  <X className="w-3 h-3 text-gray-600" />
                  <span className="text-xs text-gray-600">
                    Paper {comp.winner} wins this round
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Debate podcast */}
      {battleResult.debateSegments && battleResult.debateSegments.length > 0 && (
        <div>
          <button
            onClick={() => setShowDebate(!showDebate)}
            className="w-full p-4 rounded-xl glass-violet text-sm font-semibold text-violet-300 flex items-center justify-center gap-2 hover:bg-violet-500/15 transition-all"
          >
            <Swords className="w-4 h-4" />
            {showDebate ? "Hide" : "Play"} Battle Debate Podcast
          </button>
          {showDebate && (
            <div className="mt-4">
              <PodcastPlayer
                podcast={{
                  title: `${battleResult.paper1Title} vs ${battleResult.paper2Title}`,
                  tagline:
                    "A head-to-head debate analyzing both papers",
                  duration: "6 minutes",
                  segments: battleResult.debateSegments,
                  keyTakeaways: [
                    battleResult.winnerExplanation,
                    battleResult.methodologyComparison,
                  ],
                }}
                perspective="researcher"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
