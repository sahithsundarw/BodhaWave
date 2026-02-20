"use client";

import { useEffect, useState } from "react";

interface LoadingStateProps {
  message?: string;
}

const LOADING_STEPS = [
  { text: "Reading and parsing the document...", icon: "📄", duration: 3000 },
  { text: "Identifying research domain and methodology...", icon: "🔬", duration: 4000 },
  { text: "Extracting key contributions and insights...", icon: "💡", duration: 4000 },
  { text: "Crafting your personalized podcast script...", icon: "🎙️", duration: 5000 },
  { text: "Polishing the conversation for maximum engagement...", icon: "✨", duration: 3000 },
  { text: "Almost ready — finalizing your experience...", icon: "🚀", duration: 2000 },
];

export default function LoadingState({ message }: LoadingStateProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [dots, setDots] = useState("");

  useEffect(() => {
    let elapsed = 0;
    const intervals: NodeJS.Timeout[] = [];

    LOADING_STEPS.forEach((step, i) => {
      const timeout = setTimeout(() => {
        setCurrentStep(i);
      }, elapsed);
      intervals.push(timeout);
      elapsed += step.duration;
    });

    return () => intervals.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const step = LOADING_STEPS[currentStep];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6">
      {/* Central animation */}
      <div className="relative mb-12">
        {/* Outer rings */}
        <div className="absolute inset-0 -m-8 rounded-full border border-violet-500/10 animate-pulse-slow" />
        <div className="absolute inset-0 -m-16 rounded-full border border-violet-500/5 animate-pulse-slow" style={{ animationDelay: "1s" }} />

        {/* Brain icon with gradient */}
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-2xl glow-violet">
          <span className="text-5xl" style={{ filter: "drop-shadow(0 0 10px rgba(255,255,255,0.3))" }}>
            {step.icon}
          </span>
        </div>

        {/* Orbiting dots */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute w-3 h-3 rounded-full bg-violet-400"
            style={{
              top: "50%",
              left: "50%",
              transform: `rotate(${i * 120}deg) translateX(60px) translateY(-50%)`,
              animation: `spin-slow 3s linear infinite`,
              animationDelay: `${i * 1}s`,
              opacity: 0.7,
            }}
          />
        ))}
      </div>

      {/* Status */}
      <div className="text-center max-w-md">
        <div className="text-xl font-semibold text-white mb-2">
          {message || step.text}
          <span className="text-violet-400">{dots}</span>
        </div>
        <p className="text-gray-500 text-sm">
          AI is deeply reading your document — this is thorough, not quick.
        </p>
      </div>

      {/* Progress steps */}
      <div className="mt-10 w-full max-w-sm">
        <div className="flex justify-between mb-2">
          <span className="text-xs text-gray-500">Progress</span>
          <span className="text-xs text-violet-400">
            {Math.round(((currentStep + 1) / LOADING_STEPS.length) * 100)}%
          </span>
        </div>
        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${((currentStep + 1) / LOADING_STEPS.length) * 100}%`,
            }}
          />
        </div>

        {/* Step list */}
        <div className="mt-6 space-y-3">
          {LOADING_STEPS.map((s, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 text-sm transition-all duration-500 ${
                i < currentStep
                  ? "text-gray-500"
                  : i === currentStep
                  ? "text-white"
                  : "text-gray-700"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-all ${
                  i < currentStep
                    ? "bg-green-500/20 text-green-400"
                    : i === currentStep
                    ? "bg-violet-500 text-white"
                    : "bg-gray-800 text-gray-600"
                }`}
              >
                {i < currentStep ? "✓" : i + 1}
              </div>
              <span>{s.text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
