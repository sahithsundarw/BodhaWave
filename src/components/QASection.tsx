"use client";

import { Send, Sparkles, Bot, User, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import type { PaperAnalysis, Perspective, QAMessage } from "@/types";

interface QASectionProps {
  analysis: PaperAnalysis;
  perspective: Perspective;
  pdfBase64: string;
}

const SUGGESTED_QUESTIONS = [
  "Explain the methodology in simpler terms",
  "What are the main limitations of this research?",
  "What real-world applications could this enable?",
  "What could go wrong with this approach?",
  "How does this compare to existing work?",
  "What follow-up research would you recommend?",
  "Give me a concrete example of the key idea",
  "What's the most surprising finding?",
];

export default function QASection({
  analysis,
  perspective,
}: QASectionProps) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<QAMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendQuestion = useCallback(
    async (q: string) => {
      if (!q.trim() || isLoading) return;

      const userMsg: QAMessage = {
        role: "user",
        content: q.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setQuestion("");
      setIsLoading(true);
      setError(null);

      try {
        const chatHistory = messages
          .slice(-8)
          .map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch("/api/qa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question: q.trim(),
            paperContext: analysis,
            perspective,
            chatHistory,
          }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to get answer");

        const assistantMsg: QAMessage = {
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to get answer. Try again."
        );
        // Remove the user message on error
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
      }
    },
    [analysis, messages, perspective, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(question);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 rounded-2xl glass-violet flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">
              Interactive Research Companion
            </h3>
            <p className="text-xs text-gray-400">
              Ask anything about{" "}
              <span className="text-violet-400 italic truncate max-w-[200px] inline-block align-bottom">
                {analysis.title}
              </span>
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="p-2 rounded-lg glass hover:bg-white/5 transition-all"
            title="Clear chat"
          >
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-3">
            Try asking one of these:
          </p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendQuestion(q)}
                className="text-xs px-3 py-2 rounded-xl border border-gray-700 text-gray-400 hover:border-violet-500/40 hover:text-violet-300 hover:bg-violet-500/5 transition-all text-left"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat messages */}
      {messages.length > 0 && (
        <div className="rounded-2xl glass overflow-hidden">
          <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-violet-600/20 border border-violet-500/30 text-white"
                      : "glass text-gray-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="glass rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-400 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-gray-500">
                      Analyzing document...
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input area */}
      <div className="relative">
        <textarea
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about this document... (Enter to send, Shift+Enter for new line)"
          className="w-full px-4 py-3 pr-14 rounded-xl bg-gray-900 border border-gray-700 text-white placeholder-gray-600 text-sm focus:outline-none focus:border-violet-500/50 resize-none min-h-[60px] max-h-32 transition-all"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={() => sendQuestion(question)}
          disabled={!question.trim() || isLoading}
          className={`absolute right-3 bottom-3 p-2 rounded-lg transition-all ${
            question.trim() && !isLoading
              ? "bg-violet-600 hover:bg-violet-700 text-white"
              : "bg-gray-800 text-gray-600 cursor-not-allowed"
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {messages.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <p className="text-xs text-gray-600 w-full mb-1">Quick follow-ups:</p>
          {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
            <button
              key={q}
              onClick={() => sendQuestion(q)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-800 text-gray-500 hover:border-violet-500/30 hover:text-violet-400 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
