"use client";

import { useState, useCallback } from "react";
import {
  BookOpen,
  Headphones,
  MessageSquare,
  TrendingUp,
  Swords,
  ChevronRight,
  Sparkles,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Header from "@/components/Header";
import PaperUpload from "@/components/PaperUpload";
import PerspectiveSelector from "@/components/PerspectiveSelector";
import LoadingState from "@/components/LoadingState";
import PaperInsights from "@/components/PaperInsights";
import PodcastPlayer from "@/components/PodcastPlayer";
import QASection from "@/components/QASection";
import ImpactAnalyzer from "@/components/ImpactAnalyzer";
import PaperBattle from "@/components/PaperBattle";
import type {
  PaperAnalysis,
  PodcastScript,
  ImpactAnalysis,
  PaperBattleResult,
  Perspective,
  PdfData,
  AppPhase,
} from "@/types";
import { PERSPECTIVE_CONFIG } from "@/lib/prompts";

type ResultTab = "podcast" | "insights" | "qa" | "impact" | "battle";

const RESULT_TABS = [
  {
    id: "podcast" as ResultTab,
    label: "Podcast",
    icon: Headphones,
    description: "Listen to AI-generated conversation",
  },
  {
    id: "insights" as ResultTab,
    label: "Insights",
    icon: BookOpen,
    description: "Deep paper analysis",
  },
  {
    id: "qa" as ResultTab,
    label: "Q&A",
    icon: MessageSquare,
    description: "Interactive companion",
  },
  {
    id: "impact" as ResultTab,
    label: "Impact",
    icon: TrendingUp,
    description: "Future & strategic analysis",
  },
  {
    id: "battle" as ResultTab,
    label: "Battle",
    icon: Swords,
    description: "Compare with another paper",
  },
];

export default function HomePage() {
  const [phase, setPhase] = useState<AppPhase>("upload");
  const [pdf1, setPdf1] = useState<PdfData | null>(null);
  const [perspective, setPerspective] = useState<Perspective>("student");
  const [analysis, setAnalysis] = useState<PaperAnalysis | null>(null);
  const [podcast, setPodcast] = useState<PodcastScript | null>(null);
  const [impact, setImpact] = useState<ImpactAnalysis | null>(null);
  const [battleResult, setBattleResult] = useState<PaperBattleResult | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTab>("podcast");
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage] = useState("");

  const handleUpload = useCallback((pdfData: PdfData) => {
    setPdf1(pdfData);
    setPhase("perspective");
  }, []);

  const handleBattleMode = useCallback(() => {
    setPhase("battle-upload");
  }, []);

  const handlePerspectiveSelect = useCallback(
    async (selectedPerspective: Perspective) => {
      if (!pdf1) return;
      setPerspective(selectedPerspective);
      setPhase("loading");
      setError(null);

      try {
        // Run analysis and podcast generation in parallel for speed.
        // Use allSettled so a failure in one doesn't kill the other.
        const [analysisResult, podcastResult] = await Promise.allSettled([
          fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pdfBase64: pdf1.base64 }),
          }).then(async (res) => {
            if (!res.ok) {
              const msg =
                res.status === 413
                  ? "PDF too large — please use a file under 3 MB."
                  : `Server error ${res.status}`;
              throw new Error(msg);
            }
            return res.json();
          }),
          fetch("/api/podcast", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              pdfBase64: pdf1.base64,
              perspective: selectedPerspective,
            }),
          }).then(async (res) => {
            if (!res.ok) {
              const msg =
                res.status === 413
                  ? "PDF too large — please use a file under 3 MB."
                  : `Server error ${res.status}`;
              throw new Error(msg);
            }
            return res.json();
          }),
        ]);

        const analysisData =
          analysisResult.status === "fulfilled" ? analysisResult.value : null;
        const podcastData =
          podcastResult.status === "fulfilled" ? podcastResult.value : null;

        // Gather human-readable errors from either call
        const errors: string[] = [];
        if (analysisData?.error) errors.push(analysisData.error);
        if (podcastData?.error) errors.push(podcastData.error);
        if (analysisResult.status === "rejected")
          errors.push(String(analysisResult.reason));
        if (podcastResult.status === "rejected")
          errors.push(String(podcastResult.reason));

        // Both failed completely — go back to perspective screen with the real error
        if (!analysisData?.analysis && !podcastData?.podcast) {
          setError(errors.join("\n\n") || "Analysis failed. Check your API key and try again.");
          setPhase("perspective");
          return;
        }

        if (analysisData?.analysis) setAnalysis(analysisData.analysis);
        if (podcastData?.podcast) setPodcast(podcastData.podcast);

        // Partial failure — surface a non-blocking warning but still show results
        if (errors.length > 0) setError(errors.join(" | "));

        setPhase("results");
        setActiveTab(podcastData?.podcast ? "podcast" : "insights");
      } catch (err) {
        console.error("Generation error:", err);
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again."
        );
        setPhase("perspective");
      }
    },
    [pdf1]
  );

  const handleReset = useCallback(() => {
    setPhase("upload");
    setPdf1(null);
    setAnalysis(null);
    setPodcast(null);
    setImpact(null);
    setBattleResult(null);
    setError(null);
    setActiveTab("podcast");
    // Stop any speech
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  return (
    <div className="min-h-screen grid-bg">
      {/* Ambient blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-violet-600/10 blur-3xl animate-pulse-slow" />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl animate-pulse-slow"
          style={{ animationDelay: "2s" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-cyan-600/5 blur-3xl animate-pulse-slow"
          style={{ animationDelay: "4s" }}
        />
      </div>

      <Header
        onReset={handleReset}
        showReset={phase !== "upload"}
        isGenerating={phase === "loading"}
      />

      <main className="relative z-10">
        {/* UPLOAD PHASE */}
        {phase === "upload" && (
          <>
            <PaperUpload onUpload={handleUpload} onBattleMode={handleBattleMode} />

            {/* ── FEATURES ─────────────────────────────────────────────── */}
            <section id="features" className="relative z-10 px-6 py-24 max-w-7xl mx-auto">
              <div className="text-center mb-14">
                <span className="text-xs font-semibold tracking-widest text-violet-400 uppercase">
                  What it does
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
                  Every tool you need to{" "}
                  <span className="gradient-text">understand research</span>
                </h2>
                <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
                  BodhaWave is not a summariser. It&apos;s a full AI research
                  companion — built to think with you, not just for you.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {[
                  {
                    icon: "🧠",
                    title: "Deep AI Understanding",
                    desc: "Gemini reads the entire PDF — methodology, results, limitations, equations — not just the abstract.",
                  },
                  {
                    icon: "🎭",
                    title: "5 Perspective Modes",
                    desc: "Hear the document explained as a student, researcher, investor, journalist, or total beginner. One document, five lenses.",
                  },
                  {
                    icon: "🎙️",
                    title: "Two-Host Podcast",
                    desc: "Aarav and Dr. Meera Iyer debate, question, and explore the research in a natural, flowing conversation.",
                  },
                  {
                    icon: "💬",
                    title: "Interactive Q&A",
                    desc: "Ask anything about the document — methodology, implications, comparisons — and get precise, context-aware answers.",
                  },
                  {
                    icon: "⚔️",
                    title: "Paper Battle Mode",
                    desc: "Upload two papers and watch an AI moderator judge them head-to-head across five dimensions.",
                  },
                  {
                    icon: "⏩",
                    title: "0.5× – 2.0× Playback",
                    desc: "Fine-tune your pace. Sprint through a familiar topic or slow down to catch every nuance.",
                  },
                  {
                    icon: "📊",
                    title: "Impact Analyzer",
                    desc: "Get a strategic breakdown: who benefits, which industries are disrupted, and what startups this research enables.",
                  },
                  {
                    icon: "🌐",
                    title: "Multilingual Support",
                    desc: "Listen in English, Hindi, or Telugu. Scripts are AI-translated into native Devanagari or Telugu script — not Romanized.",
                  },
                  {
                    icon: "🎵",
                    title: "Natural AI Voices",
                    desc: "Powered by ElevenLabs — two distinct studio-quality voices (Aarav & Dr. Meera Iyer) for an authentic podcast experience.",
                  },
                  {
                    icon: "📄",
                    title: "Transcript Download",
                    desc: "Every conversation is downloadable as a clean text transcript — perfect for notes, sharing, or further study.",
                  },
                ].map((f) => (
                  <div
                    key={f.title}
                    className="p-5 rounded-2xl glass hover:bg-white/4 transition-all duration-300 group"
                  >
                    <div className="text-3xl mb-3">{f.icon}</div>
                    <h3 className="text-sm font-semibold text-white mb-1.5 group-hover:text-violet-300 transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
            <section id="how-it-works" className="relative z-10 px-6 py-24 border-t border-gray-800/40">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-14">
                  <span className="text-xs font-semibold tracking-widest text-cyan-400 uppercase">
                    The workflow
                  </span>
                  <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4">
                    From PDF to podcast in{" "}
                    <span className="gradient-text">under a minute</span>
                  </h2>
                  <p className="text-gray-400 max-w-xl mx-auto text-sm leading-relaxed">
                    No setup. No prompt engineering. Just upload and listen.
                  </p>
                </div>

                <div className="relative">
                  {/* connector line */}
                  <div className="absolute left-7 top-10 bottom-10 w-px bg-gradient-to-b from-violet-600/40 via-cyan-500/30 to-transparent hidden md:block" />

                  <div className="space-y-8">
                    {[
                      {
                        num: "01",
                        title: "Upload your academic document",
                        desc: "Drop any PDF — preprints, journal articles, theses, whitepapers. Up to 20 MB. No account needed.",
                        color: "from-violet-600 to-indigo-600",
                      },
                      {
                        num: "02",
                        title: "Choose your perspective",
                        desc: "Pick how you want to hear the document — as a curious student, a rigorous researcher, a sharp investor, a storytelling journalist, or a first-time reader.",
                        color: "from-indigo-600 to-blue-600",
                      },
                      {
                        num: "03",
                        title: "AI reads everything",
                        desc: "Gemini 2.5 Pro analyzes the full document in parallel — extracting structure, methodology, findings, limitations, and real-world context.",
                        color: "from-blue-600 to-cyan-600",
                      },
                      {
                        num: "04",
                        title: "A podcast is born",
                        desc: "A natural two-person script is crafted around your perspective. Aarav and Dr. Meera Iyer take over — no reading aloud, just genuine conversation.",
                        color: "from-cyan-600 to-teal-600",
                      },
                      {
                        num: "05",
                        title: "Listen, explore, and go deeper",
                        desc: "Adjust playback speed, ask follow-up questions, analyze long-term impact, or pit this document against another in Battle Mode.",
                        color: "from-teal-600 to-green-600",
                      },
                    ].map((step) => (
                      <div key={step.num} className="flex gap-5 items-start group">
                        <div
                          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white font-bold text-sm flex-shrink-0 shadow-lg`}
                        >
                          {step.num}
                        </div>
                        <div className="pt-1">
                          <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-violet-300 transition-colors">
                            {step.title}
                          </h3>
                          <p className="text-xs text-gray-500 leading-relaxed max-w-lg">
                            {step.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ── ABOUT ────────────────────────────────────────────────── */}
            <section id="about" className="relative z-10 px-6 py-24 border-t border-gray-800/40">
              <div className="max-w-3xl mx-auto text-center">
                <span className="text-xs font-semibold tracking-widest text-violet-400 uppercase">
                  Our mission
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-6">
                  Research should be for{" "}
                  <span className="gradient-text">everyone</span>
                </h2>

                <div className="space-y-5 text-gray-400 text-sm leading-relaxed text-left">
                  <p>
                    Every year, over two million academic papers are published. Most of them
                    will never be read beyond the researchers who wrote them — not because
                    the ideas aren&apos;t valuable, but because the format makes them inaccessible.
                  </p>
                  <p>
                    BodhaWave was built to change that. We believe that scientific
                    knowledge belongs to everyone — the student who can&apos;t afford a tutor,
                    the founder evaluating a technology, the journalist covering a breakthrough,
                    and the curious mind who simply wants to understand the world better.
                  </p>
                  <p>
                    By converting academic documents into engaging, multi-perspective podcast
                    conversations, we make the ideas inside accessible without stripping
                    away their depth. You can listen on your commute, ask follow-up
                    questions at 2 AM, or get a VC-level breakdown of a paper in minutes —
                    in English, Hindi, or Telugu.
                  </p>
                  <p>
                    This is not a summariser. It is an AI research companion — one that
                    adapts to your background, thinks alongside you, and opens doors you
                    didn&apos;t know were there.
                  </p>
                  <p className="text-gray-600 text-xs pt-2 border-t border-gray-800/60">
                    Built by <span className="text-gray-400 font-semibold">Team Pettu</span>{" "}
                    — Nikhil Siddharth · S Sahith Somasundar · R Shashwat · Madireddy Tanishka · Shanmukh Gara
                  </p>
                </div>

                <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { stat: "2M+", label: "Documents published yearly", sub: "Most never reach a wide audience" },
                    { stat: "5", label: "Perspective modes", sub: "One document, five unique lenses" },
                    { stat: "< 60s", label: "Upload to podcast", sub: "No setup, no prompt engineering" },
                  ].map((item) => (
                    <div key={item.stat} className="p-5 rounded-2xl glass text-center">
                      <div className="text-2xl font-bold gradient-text mb-1">{item.stat}</div>
                      <div className="text-xs font-semibold text-white mb-1">{item.label}</div>
                      <div className="text-xs text-gray-600">{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* BATTLE UPLOAD PHASE */}
        {phase === "battle-upload" && (
          <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
            <div className="w-full max-w-2xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">
                  <span className="gradient-text">Paper Battle</span> Mode
                </h2>
                <p className="text-gray-400">
                  Upload your first paper to kick off the battle
                </p>
              </div>
              <PaperUpload
                onUpload={(data) => {
                  setPdf1(data);
                  setPhase("perspective");
                }}
                onBattleMode={() => {}}
              />
              <button
                onClick={() => setPhase("upload")}
                className="mt-4 w-full text-sm text-gray-500 hover:text-gray-400 transition-colors"
              >
                ← Back to normal mode
              </button>
            </div>
          </div>
        )}

        {/* PERSPECTIVE SELECTION */}
        {phase === "perspective" && pdf1 && (
          <div>
            {error && (
              <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm max-w-md">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
                <button
                  onClick={() => setError(null)}
                  className="ml-2 hover:text-red-300 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
            <PerspectiveSelector
              pdfData={pdf1}
              onSelect={handlePerspectiveSelect}
              onBack={() => setPhase("upload")}
            />
          </div>
        )}

        {/* LOADING */}
        {phase === "loading" && (
          <LoadingState message={loadingMessage || undefined} />
        )}

        {/* RESULTS — at least one of analysis/podcast must be present */}
        {phase === "results" && (analysis || podcast) && pdf1 && (
          <div className="pt-20">
            {/* Paper summary bar */}
            <div className="sticky top-16 z-40 px-6 py-3 border-b border-gray-800/60 bg-gray-950/80 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-sm font-semibold text-white truncate">
                      {analysis?.title ?? podcast?.title ?? pdf1.name}
                    </h1>
                    {analysis?.domain && (
                      <>
                        <span className="text-gray-700">·</span>
                        <span className="text-xs text-gray-500 flex-shrink-0">
                          {analysis.domain}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 italic mt-0.5">
                    {analysis?.oneLiner ?? podcast?.tagline ?? ""}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${PERSPECTIVE_CONFIG[perspective].color} bg-clip-text`}
                    style={{
                      background: `linear-gradient(135deg, ${
                        perspective === "student"
                          ? "#10b981, #34d399"
                          : perspective === "researcher"
                          ? "#3b82f6, #6366f1"
                          : perspective === "investor"
                          ? "#f59e0b, #f97316"
                          : perspective === "journalist"
                          ? "#f43f5e, #ec4899"
                          : "#8b5cf6, #7c3aed"
                      })`,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    <span>
                      {PERSPECTIVE_CONFIG[perspective].icon}
                    </span>
                    <span>{PERSPECTIVE_CONFIG[perspective].label}</span>
                  </div>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-all"
                  >
                    <RefreshCw className="w-3 h-3" />
                    New Document
                  </button>
                </div>
              </div>
            </div>

            {/* Tab navigation */}
            <div className="px-6 py-0 border-b border-gray-800/60 sticky top-32 z-40 bg-gray-950/80 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto">
                <div className="flex overflow-x-auto gap-0 no-scrollbar">
                  {RESULT_TABS.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-5 py-4 text-sm font-medium transition-all whitespace-nowrap border-b-2 ${
                          isActive
                            ? "text-white border-violet-500"
                            : "text-gray-500 border-transparent hover:text-gray-300 hover:border-gray-700"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                        {tab.id === "podcast" && isActive && (
                          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Tab content */}
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main content */}
                <div className="lg:col-span-2 space-y-0">
                  {activeTab === "podcast" && podcast && (
                    <PodcastPlayer podcast={podcast} perspective={perspective} />
                  )}
                  {activeTab === "podcast" && !podcast && (
                    <div className="p-8 rounded-2xl glass text-center text-gray-500 text-sm">
                      Podcast generation failed. Switch to the Insights tab or try again.
                    </div>
                  )}
                  {activeTab === "insights" && analysis && (
                    <PaperInsights analysis={analysis} />
                  )}
                  {activeTab === "insights" && !analysis && (
                    <div className="p-8 rounded-2xl glass text-center text-gray-500 text-sm">
                      Paper analysis unavailable. Check the error above and retry.
                    </div>
                  )}
                  {activeTab === "qa" && analysis && (
                    <QASection
                      analysis={analysis}
                      perspective={perspective}
                      pdfBase64={pdf1.base64}
                    />
                  )}
                  {activeTab === "qa" && !analysis && (
                    <div className="p-8 rounded-2xl glass text-center text-gray-500 text-sm">
                      Q&amp;A requires paper analysis. Please retry the analysis.
                    </div>
                  )}
                  {activeTab === "impact" && (
                    <ImpactAnalyzer
                      pdfBase64={pdf1.base64}
                      impact={impact}
                      onImpactLoaded={setImpact}
                    />
                  )}
                  {activeTab === "battle" && (
                    <PaperBattle
                      pdf1={pdf1}
                      battleResult={battleResult}
                      onBattleComplete={setBattleResult}
                    />
                  )}
                </div>

                {/* Sidebar - Quick info */}
                <div className="hidden lg:block space-y-4">
                  {/* Quick insights */}
                  <div className="p-5 rounded-2xl glass sticky top-56">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
                      Quick Summary
                    </h3>
                    <div className="space-y-3">
                      {analysis?.domain && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Domain</div>
                          <div className="text-sm text-white">{analysis.domain}</div>
                        </div>
                      )}
                      {analysis?.noveltyAssessment && (
                        <div>
                          <div className="text-xs text-gray-600 mb-1">Novelty</div>
                          <div
                            className={`text-sm font-medium ${
                              analysis.noveltyAssessment === "Breakthrough"
                                ? "text-green-400"
                                : analysis.noveltyAssessment === "Significant Advancement"
                                ? "text-blue-400"
                                : "text-yellow-400"
                            }`}
                          >
                            {analysis.noveltyAssessment}
                          </div>
                        </div>
                      )}
                      {analysis?.impactScore != null && (
                        <div className="pt-2 border-t border-gray-800">
                          <div className="text-xs text-gray-600 mb-2">Impact Score</div>
                          <div className="h-1.5 bg-gray-800 rounded-full">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-violet-600 to-violet-400"
                              style={{ width: `${analysis.impactScore * 10}%` }}
                            />
                          </div>
                          <div className="text-xs text-violet-400 mt-1">
                            {analysis.impactScore}/10
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Navigation shortcuts */}
                    <div className="mt-6 space-y-1">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Explore
                      </div>
                      {RESULT_TABS.filter((t) => t.id !== activeTab).map(
                        (tab) => {
                          const Icon = tab.icon;
                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveTab(tab.id)}
                              className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-white py-2 px-3 rounded-lg hover:bg-white/3 transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <Icon className="w-3.5 h-3.5" />
                                <span>{tab.label}</span>
                              </div>
                              <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                          );
                        }
                      )}
                    </div>

                    {/* Top insights preview */}
                    {activeTab !== "insights" && analysis?.topInsights?.[0] && (
                      <div className="mt-6 pt-4 border-t border-gray-800">
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                          Top Insight
                        </div>
                        <div className="flex gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <p className="text-xs text-gray-400 leading-relaxed">
                            {analysis.topInsights[0]}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {phase === "upload" && (
        <footer className="relative z-10 text-center py-8 text-xs text-gray-700 border-t border-gray-800/40">
          <div className="flex items-center justify-center gap-2 mb-3">
            <span className="font-semibold text-gray-500">BodhaWave</span>
            <span>·</span>
            <span>Powered by Gemini AI</span>
            <span>·</span>
            <span>Built for the future of learning</span>
          </div>
          <div className="text-gray-700">
            Team Pettu &mdash; Nikhil Siddharth &middot; S Sahith Somasundar &middot; R Shashwat &middot; Madireddy Tanishka &middot; Shanmukh Gara
          </div>
        </footer>
      )}
    </div>
  );
}
