"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  FileText,
  Sparkles,
  Zap,
  Brain,
  Headphones,
  ArrowRight,
  Swords,
} from "lucide-react";
import type { PdfData } from "@/types";

interface PaperUploadProps {
  onUpload: (pdfData: PdfData) => void;
  onBattleMode: () => void;
}

const FEATURES = [
  { icon: Brain, label: "Deep Analysis", desc: "Extracts insights, methods & contributions" },
  { icon: Headphones, label: "Podcast Generation", desc: "Two-voice conversational format" },
  { icon: Sparkles, label: "5 Perspectives", desc: "Student to Investor mode" },
  { icon: Zap, label: "Interactive Q&A", desc: "Ask anything about the paper" },
];

const SAMPLE_PAPERS = [
  "Attention Is All You Need",
  "AlphaFold 2",
  "GPT-4 Technical Report",
  "ImageNet Classification",
];

export default function PaperUpload({ onUpload, onBattleMode }: PaperUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.type.includes("pdf")) {
        setError("Please upload a PDF file");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be smaller than 10MB");
        return;
      }

      setIsProcessing(true);
      setError(null);

      try {
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // Remove the data URL prefix to get just base64
          const base64 = dataUrl.split(",")[1];
          onUpload({ base64, name: file.name });
          setIsProcessing(false);
        };
        reader.onerror = () => {
          setError("Failed to read file");
          setIsProcessing(false);
        };
        reader.readAsDataURL(file);
      } catch {
        setError("Failed to process file");
        setIsProcessing(false);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => {
      setIsDragging(false);
      if (files[0]) processFile(files[0]);
    },
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
      {/* Hero text */}
      <div className="text-center mb-12 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-violet text-violet-300 text-xs font-medium mb-6">
          <Sparkles className="w-3 h-3" />
          Powered by Gemini AI
          <span className="w-1 h-1 rounded-full bg-violet-400" />
          Next-Gen Research Experience
        </div>

        <h1 className="text-5xl md:text-7xl font-black mb-4 leading-tight tracking-tight">
          <span className="text-white">Research</span>
          <br />
          <span className="gradient-text">Reimagined.</span>
        </h1>

        <p className="text-gray-400 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          Upload any academic document and transform it into an engaging podcast,
          interactive Q&A companion, and strategic impact analysis.
          <span className="text-violet-400"> All in one intelligent experience.</span>
        </p>
      </div>

      {/* Feature pills */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {FEATURES.map(({ icon: Icon, label, desc }) => (
          <div
            key={label}
            className="flex items-center gap-2 px-4 py-2 rounded-xl glass hover:border-violet-500/30 transition-all group cursor-default"
          >
            <Icon className="w-4 h-4 text-violet-400 group-hover:text-violet-300" />
            <div>
              <div className="text-xs font-semibold text-white">{label}</div>
              <div className="text-xs text-gray-500">{desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Upload Area */}
      <div className="w-full max-w-2xl">
        <div
          {...getRootProps()}
          className={`relative rounded-2xl border-2 border-dashed p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragActive || isDragging
              ? "border-violet-400 bg-violet-500/10 upload-active"
              : "border-gray-700 hover:border-violet-500/50 hover:bg-violet-500/5"
          }`}
        >
          <input {...getInputProps()} />

          {isProcessing ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-white font-medium">Reading your document...</p>
              <p className="text-gray-400 text-sm">Preparing for analysis</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  isDragActive
                    ? "bg-violet-500 scale-110"
                    : "bg-gradient-to-br from-violet-600/30 to-indigo-600/30 border border-violet-500/30"
                }`}
              >
                {isDragActive ? (
                  <FileText className="w-8 h-8 text-white" />
                ) : (
                  <Upload className="w-8 h-8 text-violet-400" />
                )}
              </div>

              <div>
                <p className="text-white text-lg font-semibold mb-1">
                  {isDragActive
                    ? "Drop your document here"
                    : "Drop your academic document"}
                </p>
                <p className="text-gray-400 text-sm">
                  or{" "}
                  <span className="text-violet-400 underline underline-offset-2">
                    click to browse
                  </span>{" "}
                  · PDF up to 10MB
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs text-gray-500 mt-2">
                <span className="tag-pill">PDF</span>
                <span className="tag-pill">Any research domain</span>
                <span className="tag-pill">Up to 10MB</span>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        {/* Try these papers */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-600 mb-2">Works great with:</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SAMPLE_PAPERS.map((paper) => (
              <span key={paper} className="text-xs text-gray-500 italic">
                &ldquo;{paper}&rdquo;
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Battle mode CTA */}
      <div className="mt-8 flex flex-col items-center gap-2">
        <button
          onClick={onBattleMode}
          className="flex items-center gap-3 px-6 py-3 rounded-xl glass-violet hover:bg-violet-500/15 transition-all group"
        >
          <Swords className="w-4 h-4 text-violet-400" />
          <span className="text-sm font-medium text-violet-300">
            Paper Battle Mode
          </span>
          <span className="text-xs text-gray-500">
            Compare two papers head-to-head
          </span>
          <ArrowRight className="w-4 h-4 text-violet-400 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
