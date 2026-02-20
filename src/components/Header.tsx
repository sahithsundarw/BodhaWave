"use client";

import { Mic2, Sparkles } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onReset?: () => void;
  showReset?: boolean;
}

export default function Header({ onReset, showReset }: HeaderProps) {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-6 py-4 navbar-bg">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={onReset}
        >
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center overflow-hidden">
              {imgFailed ? (
                <Mic2 className="w-7 h-7 text-white" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/logo1.jpeg"
                  alt="BodhaWave"
                  className="w-full h-full object-cover"
                  onError={() => setImgFailed(true)}
                />
              )}
            </div>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-cyan-400 flex items-center justify-center">
              <Sparkles className="w-2 h-2 text-cyan-900" />
            </div>
          </div>
          <div className="text-xl font-bold leading-none whitespace-nowrap">
            <span className="text-white">Bodha</span>
            <span className="gradient-text-violet">Wave</span>
          </div>
        </div>

        {/* Nav */}
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6 text-sm text-gray-400">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              How it works
            </a>
            <a
              href="#about"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hover:text-white transition-colors cursor-pointer"
            >
              About
            </a>
          </nav>

          {showReset && (
            <button
              onClick={onReset}
              className="text-xs px-4 py-2 rounded-lg border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all"
            >
              New Document
            </button>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span>AI Ready</span>
          </div>
        </div>
      </div>
    </header>
  );
}
