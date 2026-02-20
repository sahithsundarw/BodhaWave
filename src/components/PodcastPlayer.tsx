"use client";

import {
  Play,
  Pause,
  Square,
  Download,
  Gauge,
  Languages,
  RotateCcw,
  RotateCw,
  Loader2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PodcastScript, PodcastSegment } from "@/types";

// ---------------------------------------------------------------------------
// Types & constants
// ---------------------------------------------------------------------------

type Language = "en" | "hi" | "te";
type GenPhase = "translating" | "generating" | "ready";

interface PodcastPlayerProps {
  podcast: PodcastScript;
  perspective: string;
}

const SPEED_OPTIONS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  hi: "Hindi",
  te: "Telugu",
};

const EMOTIONS_EMOJI: Record<string, string> = {
  enthusiastic: "😊",
  curious: "🤔",
  thoughtful: "💭",
  surprised: "😮",
  skeptical: "🧐",
  amused: "😄",
  serious: "🎯",
  excited: "🎉",
  analytical: "📊",
};

// ---------------------------------------------------------------------------
// Text pre-processor for browser TTS (makes speech sound more natural)
// ---------------------------------------------------------------------------

function preprocessForTTS(text: string): string {
  return text
    .replace(/\s*—\s*/g, ", ")
    .replace(/\.\.\./g, ". ")
    .replace(
      /\b(however|therefore|furthermore|moreover|additionally|consequently|nevertheless|meanwhile|instead|otherwise|interestingly|importantly|essentially|basically|actually|honestly|frankly)\b/gi,
      "$1,"
    )
    .replace(/\be\.g\.\s*/gi, "for example, ")
    .replace(/\bi\.e\.\s*/gi, "that is, ")
    .replace(/\betc\.\s*/gi, "and so on. ")
    .replace(/\bvs\.\s*/gi, "versus ")
    .replace(/\bDr\.\s+/g, "Doctor ")
    .replace(/\bProf\.\s+/g, "Professor ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function WaveformBar({ isActive }: { isActive: boolean }) {
  return (
    <div className="flex items-end gap-0.5 h-6">
      {[40, 70, 100, 60, 80].map((h, i) => (
        <div
          key={i}
          className={`waveform-bar transition-all ${isActive ? "animate-wave" : "opacity-20"}`}
          style={{
            height: `${h}%`,
            animationDelay: isActive ? `${i * 0.15}s` : "0s",
          }}
        />
      ))}
    </div>
  );
}

function SpeakerCard({
  speaker,
  isActive,
}: {
  speaker: "HOST" | "GUEST";
  isActive: boolean;
}) {
  const isHost = speaker === "HOST";
  return (
    <div
      className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-300 ${
        isActive
          ? "bg-violet-500/10 border border-violet-500/30"
          : "opacity-50"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all ${
          isActive
            ? isHost
              ? "speaker-active bg-violet-600"
              : "speaker-active bg-indigo-600"
            : "bg-gray-800"
        }`}
      >
        {isHost ? "🎙" : "👩‍🔬"}
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold text-white">
          {isHost ? "Aarav" : "Dr. Meera Iyer"}
        </div>
        <div className="text-xs text-gray-500">
          {isHost ? "Host" : "Research Expert"}
        </div>
      </div>
      {isActive && <WaveformBar isActive />}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function PodcastPlayer({
  podcast,
  perspective,
}: PodcastPlayerProps) {
  // ---------- Language ----------
  const [language, setLanguage] = useState<Language>("en");

  // ---------- Generation state ----------
  const [genPhase, setGenPhase] = useState<GenPhase>("generating");
  const [genProgress, setGenProgress] = useState(0);
  const [audioUrls, setAudioUrls] = useState<(string | null)[]>([]);
  const [activeSegments, setActiveSegments] = useState<PodcastSegment[]>(
    podcast.segments
  );
  // true when ElevenLabs failed entirely — silently use browser TTS
  const [isFallback, setIsFallback] = useState(false);

  // ---------- Shared playback state ----------
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegment, setCurrentSegment] = useState(-1);
  const [speed, setSpeed] = useState(1.0);

  // ---------- Progress bar state ----------
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState(0);

  // ---------- Refs ----------
  // speedRef mirrors `speed` state so callbacks always read the *current* speed
  // without capturing a stale closure value. Always update both together.
  const speedRef = useRef(1.0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlsRef = useRef<(string | null)[]>([]);
  const activeSegmentsRef = useRef<PodcastSegment[]>(podcast.segments);
  const isFallbackRef = useRef(false); // mirror of isFallback for callbacks
  const isStoppedRef = useRef(false);
  const currentSegmentRef = useRef(-1);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const blobUrlsRef = useRef<string[]>([]); // tracked for cleanup
  const generationIdRef = useRef(0); // incremented per generation run to cancel stale ones
  const progressBarRef = useRef<HTMLDivElement>(null);
  const seekFractionRef = useRef(0); // intra-segment fraction to seek after next segment loads

  // ---------- Browser TTS voices ----------
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => {
      const v = speechSynthesis.getVoices();
      if (v.length) setVoices(v);
    };
    load();
    speechSynthesis.onvoiceschanged = load;
    return () => {
      speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Cleanup blob URLs and audio on unmount
  useEffect(() => {
    return () => {
      isStoppedRef.current = true;
      speechSynthesis.cancel();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = "";
      }
      blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  // Sync refs with state
  useEffect(() => {
    audioUrlsRef.current = audioUrls;
  }, [audioUrls]);

  useEffect(() => {
    activeSegmentsRef.current = activeSegments;
  }, [activeSegments]);

  useEffect(() => {
    isFallbackRef.current = isFallback;
  }, [isFallback]);

  // ==========================================================================
  // BROWSER TTS helpers
  // ==========================================================================

  const getVoice = useCallback(
    (speaker: "HOST" | "GUEST") => {
      if (!voices.length) return null;
      if (speaker === "HOST") {
        return (
          voices.find((v) => v.name === "Google UK English Male") ||
          voices.find((v) => v.name.includes("Daniel") && v.lang.startsWith("en")) ||
          voices.find((v) => v.name.includes("Mark") && v.lang.startsWith("en")) ||
          voices.find((v) => v.name.includes("Alex") && v.lang.startsWith("en")) ||
          voices.find((v) => v.lang === "en-GB") ||
          voices.find((v) => v.lang === "en-US") ||
          voices[0]
        );
      } else {
        return (
          voices.find((v) => v.name === "Google UK English Female") ||
          voices.find((v) => v.name === "Samantha" && v.lang.startsWith("en")) ||
          voices.find((v) => v.name === "Google US English" && v.lang === "en-US") ||
          voices.find((v) => v.name.includes("Zira") && v.lang.startsWith("en")) ||
          voices.find((v) => v.name.includes("Karen") && v.lang.startsWith("en")) ||
          voices.find((v) => v.lang === "en-US") ||
          voices[1] ||
          voices[0]
        );
      }
    },
    [voices]
  );

  const speakSegment = useCallback(
    (index: number) => {
      const segs = activeSegmentsRef.current;
      if (index >= segs.length || isStoppedRef.current) {
        setIsPlaying(false);
        setCurrentSegment(-1);
        currentSegmentRef.current = -1;
        return;
      }
      const segment = segs[index];
      setCurrentSegment(index);
      currentSegmentRef.current = index;
      setTimeout(() => {
        document
          .getElementById(`seg-${index}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);

      const isMeera = segment.speaker === "GUEST";
      const utterance = new SpeechSynthesisUtterance(
        preprocessForTTS(segment.text)
      );
      const voice = getVoice(segment.speaker);
      if (voice) utterance.voice = voice;
      utterance.rate = isMeera ? speedRef.current * 0.93 : speedRef.current;
      utterance.pitch = isMeera ? 1.0 : 0.9;
      utterance.volume = 1;
      utterance.onend = () => {
        if (!isStoppedRef.current) speakSegment(index + 1);
      };
      speechSynthesis.speak(utterance);
    },
    [getVoice]
  );

  // ==========================================================================
  // ELEVENLABS audio helpers
  // ==========================================================================

  const playAudioSegment = useCallback(
    (index: number) => {
      const urls = audioUrlsRef.current;
      if (index >= urls.length || isStoppedRef.current) {
        setIsPlaying(false);
        setCurrentSegment(-1);
        currentSegmentRef.current = -1;
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.src = "";
        }
        return;
      }
      const url = urls[index];
      if (!url) {
        // Skip segments that failed to generate
        playAudioSegment(index + 1);
        return;
      }

      setCurrentSegment(index);
      currentSegmentRef.current = index;
      setTimeout(() => {
        document
          .getElementById(`seg-${index}`)
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);

      setAudioCurrentTime(0);
      setAudioDuration(0);

      const audio = audioRef.current!;
      audio.src = url;
      audio.playbackRate = speedRef.current;
      audio.play().catch(console.error);

      audio.onloadedmetadata = () => {
        const dur = audio.duration;
        setAudioDuration(dur);
        // If a seek was requested (e.g. user clicked progress bar), apply it now
        if (seekFractionRef.current > 0 && dur > 0) {
          audio.currentTime = seekFractionRef.current * dur;
          seekFractionRef.current = 0;
        }
      };
      audio.ontimeupdate = () => {
        setAudioCurrentTime(audio.currentTime);
      };
      audio.onended = () => {
        if (!isStoppedRef.current) {
          setTimeout(() => playAudioSegment(index + 1), 250);
        }
      };
    },
    []
  );

  // ==========================================================================
  // Stop everything (used before re-generation and on explicit stop)
  // ==========================================================================

  const stopAll = useCallback(() => {
    isStoppedRef.current = true;
    speechSynthesis.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    }
    setIsPlaying(false);
    setCurrentSegment(-1);
    currentSegmentRef.current = -1;
    setAudioCurrentTime(0);
    setAudioDuration(0);
  }, []);

  // ==========================================================================
  // AUTO-GENERATE — runs on mount and whenever podcast or language changes
  // ==========================================================================

  useEffect(() => {
    const genId = ++generationIdRef.current;

    stopAll();
    setGenPhase("generating");
    setGenProgress(0);
    setAudioUrls([]);
    setIsFallback(false);
    isFallbackRef.current = false;

    // Revoke previous blob URLs
    blobUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    blobUrlsRef.current = [];

    let cancelled = false;

    const run = async () => {
      let segments = podcast.segments;

      // 1. Translate if non-English
      if (language !== "en") {
        setGenPhase("translating");
        try {
          const res = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              segments: podcast.segments,
              targetLanguage: language,
            }),
          });
          const data = await res.json();
          if (cancelled || generationIdRef.current !== genId) return;
          if (data.error) throw new Error(data.error);
          segments = data.segments;
          setActiveSegments(segments);
        } catch (err) {
          console.warn(
            "[BodhaWave] Translation failed, using English segments:",
            err
          );
          if (cancelled || generationIdRef.current !== genId) return;
          segments = podcast.segments;
          setActiveSegments(podcast.segments);
        }
      } else {
        setActiveSegments(podcast.segments);
      }

      if (cancelled || generationIdRef.current !== genId) return;

      // 2. Generate ElevenLabs audio — all segments in parallel
      setGenPhase("generating");
      setGenProgress(0);

      const urls: (string | null)[] = new Array(segments.length).fill(null);
      let completedCount = 0;
      let successCount = 0;

      // Hinglish ("hi") and Tenglish ("te") are Roman-script, so always send
      // language "en" to ElevenLabs — avoids multilingual accent mode entirely.
      const allResults = await Promise.all(
        segments.map(async (seg, i) => {
          try {
            const res = await fetch("/api/tts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: seg.text, speaker: seg.speaker, language: "en" }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            blobUrlsRef.current.push(url);
            completedCount++;
            setGenProgress(Math.round((completedCount / segments.length) * 100));
            return { index: i, url };
          } catch {
            completedCount++;
            setGenProgress(Math.round((completedCount / segments.length) * 100));
            return { index: i, url: null };
          }
        })
      );

      if (cancelled || generationIdRef.current !== genId) return;

      allResults.forEach(({ index, url }) => {
        urls[index] = url;
        if (url) successCount++;
      });

      if (successCount === 0) {
        // All ElevenLabs calls failed — silent fallback to browser TTS
        console.warn(
          "[BodhaWave] ElevenLabs TTS failed for all segments, silently using browser TTS."
        );
        setIsFallback(true);
        isFallbackRef.current = true;
      } else {
        setAudioUrls(urls);
        setIsFallback(false);
        isFallbackRef.current = false;
      }

      setGenPhase("ready");
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [podcast, language, stopAll]);

  // ==========================================================================
  // Shared playback controls
  // ==========================================================================

  const handlePlay = useCallback(() => {
    isStoppedRef.current = false;
    const idx = currentSegment >= 0 ? currentSegment : 0;
    if (!isFallbackRef.current) {
      setIsPlaying(true);
      playAudioSegment(idx);
    } else {
      speechSynthesis.cancel();
      setIsPlaying(true);
      speakSegment(idx);
    }
  }, [currentSegment, playAudioSegment, speakSegment]);

  const handlePause = useCallback(() => {
    if (!isFallbackRef.current) {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    } else {
      if (speechSynthesis.speaking && !speechSynthesis.paused) {
        speechSynthesis.pause();
        setIsPlaying(false);
      } else if (speechSynthesis.paused) {
        speechSynthesis.resume();
        setIsPlaying(true);
      }
    }
  }, []);

  const handleStop = useCallback(() => {
    isStoppedRef.current = true;
    if (!isFallbackRef.current && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = "";
    } else {
      speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setCurrentSegment(-1);
    currentSegmentRef.current = -1;
  }, []);

  const handleSkipBack = useCallback(() => {
    if (!isFallbackRef.current) {
      const audio = audioRef.current;
      if (audio) {
        const newTime = audio.currentTime - 5;
        if (newTime >= 0) {
          audio.currentTime = newTime;
        } else {
          const prev = Math.max(0, (currentSegment >= 0 ? currentSegment : 0) - 1);
          isStoppedRef.current = false;
          if (isPlaying) playAudioSegment(prev);
          else {
            setCurrentSegment(prev);
            currentSegmentRef.current = prev;
          }
        }
      }
    } else {
      const prev = Math.max(0, (currentSegment >= 0 ? currentSegment : 0) - 1);
      speechSynthesis.cancel();
      if (isPlaying) {
        isStoppedRef.current = false;
        speakSegment(prev);
      } else setCurrentSegment(prev);
    }
  }, [currentSegment, isPlaying, playAudioSegment, speakSegment]);

  const handleSkipForward = useCallback(() => {
    const totalSegs = activeSegmentsRef.current.length;
    if (!isFallbackRef.current) {
      const audio = audioRef.current;
      if (audio) {
        const newTime = audio.currentTime + 5;
        if (newTime < audio.duration) {
          audio.currentTime = newTime;
        } else {
          const next = Math.min(
            totalSegs - 1,
            (currentSegment >= 0 ? currentSegment : 0) + 1
          );
          isStoppedRef.current = false;
          if (isPlaying) playAudioSegment(next);
          else {
            setCurrentSegment(next);
            currentSegmentRef.current = next;
          }
        }
      }
    } else {
      const next = Math.min(
        totalSegs - 1,
        (currentSegment >= 0 ? currentSegment : 0) + 1
      );
      speechSynthesis.cancel();
      if (isPlaying) {
        isStoppedRef.current = false;
        speakSegment(next);
      } else setCurrentSegment(next);
    }
  }, [currentSegment, isPlaying, playAudioSegment, speakSegment]);

  const handleSpeedChange = useCallback(
    (s: number) => {
      // Update ref first (synchronous) so any in-flight or immediately-called
      // speakSegment / playAudioSegment reads the correct value right away.
      speedRef.current = s;
      setSpeed(s);
      if (!isFallbackRef.current && audioRef.current) {
        audioRef.current.playbackRate = s;
      } else if (isFallbackRef.current && isPlaying) {
        speechSynthesis.cancel();
        isStoppedRef.current = false;
        const idx = currentSegmentRef.current >= 0 ? currentSegmentRef.current : 0;
        setTimeout(() => speakSegment(idx), 0);
      }
    },
    [isPlaying, speakSegment]
  );

  const handleSegmentClick = useCallback(
    (i: number) => {
      if (!isFallbackRef.current) {
        isStoppedRef.current = false;
        if (isPlaying) playAudioSegment(i);
        else {
          setCurrentSegment(i);
          currentSegmentRef.current = i;
        }
      } else {
        speechSynthesis.cancel();
        if (isPlaying) {
          isStoppedRef.current = false;
          speakSegment(i);
        } else setCurrentSegment(i);
      }
    },
    [isPlaying, playAudioSegment, speakSegment]
  );

  // Switch language — useEffect handles re-generation automatically
  const switchLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
  }, []);

  // ==========================================================================
  // Progress bar seek
  // ==========================================================================

  /** Jump to a global progress ratio (0–1) across all segments. */
  const seekToRatio = useCallback(
    (ratio: number) => {
      const total = audioUrlsRef.current.length || activeSegmentsRef.current.length;
      if (total === 0) return;
      const targetFloat = ratio * total;
      const targetSeg = Math.max(0, Math.min(total - 1, Math.floor(targetFloat)));
      const segFrac = targetFloat - Math.floor(targetFloat);

      isStoppedRef.current = false;
      if (!isFallbackRef.current && audioUrlsRef.current.length > 0) {
        seekFractionRef.current = segFrac;
        setAudioCurrentTime(0);
        setAudioDuration(0);
        playAudioSegment(targetSeg);
        setIsPlaying(true);
      } else {
        speechSynthesis.cancel();
        speakSegment(targetSeg);
        setIsPlaying(true);
      }
    },
    [playAudioSegment, speakSegment]
  );

  /** Handles mousedown on the progress bar — supports both click and drag. */
  const handleProgressMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (genPhase !== "ready") return;
      e.preventDefault();

      const bar = progressBarRef.current;
      if (!bar) return;

      const getR = (clientX: number) => {
        const rect = bar.getBoundingClientRect();
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      };

      setIsDragging(true);
      setDragPercent(getR(e.clientX) * 100);

      const onMove = (ev: MouseEvent) => {
        setDragPercent(getR(ev.clientX) * 100);
      };

      const onUp = (ev: MouseEvent) => {
        setIsDragging(false);
        seekToRatio(getR(ev.clientX));
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [genPhase, seekToRatio]
  );

  // ==========================================================================
  // Download transcript
  // ==========================================================================

  const downloadTranscript = () => {
    const segs = activeSegments.length ? activeSegments : podcast.segments;
    const text = segs
      .map(
        (s) =>
          `${s.speaker === "HOST" ? "AARAV (HOST)" : "DR. MEERA IYER (GUEST)"}:\n${s.text}`
      )
      .join("\n\n");
    const full =
      `${podcast.title}\n${podcast.tagline}\n\n` +
      `${"=".repeat(60)}\n\n${text}\n\n` +
      `${"=".repeat(60)}\n\nKEY TAKEAWAYS:\n` +
      podcast.keyTakeaways.map((t, i) => `${i + 1}. ${t}`).join("\n");
    const blob = new Blob([full], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bodhawave-transcript.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================================================
  // Derived values
  // ==========================================================================

  const currentSpeaker =
    currentSegment >= 0 ? activeSegments[currentSegment]?.speaker : null;
  const totalSegments = activeSegments.length;
  const playerEnabled = genPhase === "ready";

  // Real-time progress: whole-segment count + intra-segment fraction
  const intraFrac = audioDuration > 0 ? audioCurrentTime / audioDuration : 0;
  const realtimeProgress =
    totalSegments > 0 && currentSegment >= 0
      ? ((currentSegment + intraFrac) / totalSegments) * 100
      : 0;
  // Fallback (browser TTS) uses segment-step progress only
  const segmentProgress =
    currentSegment >= 0 && totalSegments > 0
      ? ((currentSegment + 1) / totalSegments) * 100
      : 0;
  const displayProgress = isDragging
    ? dragPercent
    : isFallback
    ? segmentProgress
    : realtimeProgress;

  // ==========================================================================
  // Render
  // ==========================================================================

  return (
    <div className="space-y-4">
      {/* Hidden audio element for ElevenLabs playback */}
      <audio
        ref={audioRef}
        style={{ display: "none" }}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      {/* Episode header */}
      <div className="p-5 rounded-2xl glass-violet">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 border border-violet-500/30 font-medium">
                {perspective.charAt(0).toUpperCase() + perspective.slice(1)} Mode
              </span>
              <span className="text-xs text-gray-500">· {podcast.duration}</span>
            </div>
            <h3 className="text-lg font-bold text-white leading-tight">
              {podcast.title}
            </h3>
            <p className="text-sm text-gray-400 mt-1">{podcast.tagline}</p>
          </div>
          <button
            onClick={downloadTranscript}
            className="p-2 rounded-lg glass hover:bg-white/5 transition-all flex-shrink-0"
            title="Download transcript"
          >
            <Download className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Language selector */}
      <div className="p-4 rounded-2xl glass">
        <div className="flex items-center gap-3">
          <Languages className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-xs text-gray-500 w-16 flex-shrink-0">Language</span>
          <div className="flex gap-1.5 flex-wrap">
            {(["en", "hi", "te"] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => switchLanguage(lang)}
                disabled={!playerEnabled}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                  language === lang
                    ? "bg-violet-500/30 text-violet-300 border border-violet-500/40"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {LANGUAGE_LABELS[lang]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generation progress panel — shown while generating */}
      {!playerEnabled && (
        <div className="p-5 rounded-2xl glass">
          <div className="flex items-center gap-3 mb-3">
            <Loader2 className="w-4 h-4 text-violet-400 animate-spin flex-shrink-0" />
            <span className="text-sm text-gray-300">
              {genPhase === "translating"
                ? `Translating to ${LANGUAGE_LABELS[language]}…`
                : `Generating your podcast… ${genProgress}%`}
            </span>
          </div>
          {genPhase === "generating" && (
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full transition-all duration-500"
                style={{ width: `${genProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Speakers */}
      <div className="flex gap-3">
        <div className="flex-1">
          <SpeakerCard
            speaker="HOST"
            isActive={isPlaying && currentSpeaker === "HOST"}
          />
        </div>
        <div className="flex-1">
          <SpeakerCard
            speaker="GUEST"
            isActive={isPlaying && currentSpeaker === "GUEST"}
          />
        </div>
      </div>

      {/* Player controls */}
      <div
        className={`p-5 rounded-2xl glass transition-opacity duration-300 ${
          !playerEnabled ? "opacity-40 pointer-events-none" : ""
        }`}
      >
        {/* Progress bar — click or drag to seek */}
        <div className="mb-4">
          <div
            ref={progressBarRef}
            onMouseDown={handleProgressMouseDown}
            className={`relative h-2 bg-gray-800 rounded-full group ${
              playerEnabled ? "cursor-pointer" : "cursor-default"
            }`}
          >
            {/* Fill */}
            <div
              className="h-full bg-gradient-to-r from-violet-600 to-cyan-500 rounded-full"
              style={{ width: `${displayProgress}%` }}
            />
            {/* Scrub handle — visible on hover / while dragging */}
            <div
              className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md pointer-events-none transition-opacity ${
                isDragging ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              }`}
              style={{ left: `calc(${displayProgress}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-xs text-gray-600">
              {currentSegment >= 0
                ? `Seg ${currentSegment + 1} / ${totalSegments}`
                : "Ready"}
            </span>
            {!isFallback && audioDuration > 0 ? (
              <span className="text-xs text-gray-600">
                {formatTime(audioCurrentTime)} / {formatTime(audioDuration)}
              </span>
            ) : (
              <span className="text-xs text-gray-600">
                {totalSegments} segments
              </span>
            )}
          </div>
        </div>

        {/* Buttons: −5s | ⏮ | ⏸/▶ | ⏹ | ⏭ | +5s */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleSkipBack}
            className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-white/5 transition-all text-gray-400 hover:text-white"
            title="Skip back 5 seconds"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-[9px] leading-none">5s</span>
          </button>

          {/* Previous segment */}
          <button
            onClick={handleSkipBack}
            className="p-2 rounded-lg hover:bg-white/5 transition-all text-gray-400 hover:text-white"
            title="Previous segment"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>

          {/* Play / Pause */}
          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center hover:scale-105 transition-all shadow-lg glow-violet"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-white" />
            ) : (
              <Play className="w-6 h-6 text-white ml-0.5" />
            )}
          </button>

          {/* Stop */}
          <button
            onClick={handleStop}
            className="p-2 rounded-lg hover:bg-white/5 transition-all text-gray-400 hover:text-white"
          >
            <Square className="w-4 h-4" />
          </button>

          {/* Next segment */}
          <button
            onClick={handleSkipForward}
            className="p-2 rounded-lg hover:bg-white/5 transition-all text-gray-400 hover:text-white"
            title="Next segment"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm8.5-6v6h2V6h-2v6z" />
            </svg>
          </button>

          <button
            onClick={handleSkipForward}
            className="flex flex-col items-center gap-0.5 p-2 rounded-lg hover:bg-white/5 transition-all text-gray-400 hover:text-white"
            title="Skip forward 5 seconds"
          >
            <RotateCw className="w-4 h-4" />
            <span className="text-[9px] leading-none">5s</span>
          </button>
        </div>

        {/* Speed control */}
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <Gauge className="w-3.5 h-3.5" />
              <span>Speed</span>
            </div>
            <span className="text-xs font-semibold text-violet-400">{speed}x</span>
          </div>
          <div className="flex gap-1 justify-between">
            {SPEED_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`flex-1 text-xs py-1.5 rounded-lg transition-all font-medium ${
                  speed === s
                    ? "bg-violet-500/30 text-violet-300 border border-violet-500/40"
                    : "text-gray-600 hover:text-gray-300 hover:bg-white/5"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transcript */}
      <div className="rounded-2xl glass overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-800/60">
          <h4 className="text-sm font-semibold text-gray-300">Live Transcript</h4>
          <p className="text-xs text-gray-600 mt-0.5">
            Click any segment to jump to it
          </p>
        </div>
        <div
          ref={transcriptRef}
          className="p-4 space-y-3 max-h-96 overflow-y-auto"
        >
          {(activeSegments.length ? activeSegments : podcast.segments).map(
            (segment, i) => {
              const isHost = segment.speaker === "HOST";
              const isActive = currentSegment === i;
              return (
                <div
                  key={i}
                  id={`seg-${i}`}
                  onClick={() => playerEnabled && handleSegmentClick(i)}
                  className={`p-3 rounded-xl transition-all duration-200 ${
                    playerEnabled ? "cursor-pointer" : "cursor-default"
                  } ${
                    isActive
                      ? "bg-violet-500/15 border border-violet-500/30"
                      : playerEnabled
                      ? "hover:bg-white/3"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{isHost ? "🎙" : "👩‍🔬"}</span>
                    <span
                      className={`text-xs font-semibold ${
                        isHost ? "text-violet-400" : "text-cyan-400"
                      }`}
                    >
                      {isHost ? "Aarav" : "Dr. Meera Iyer"}
                    </span>
                    {segment.emotion && (
                      <span className="text-xs text-gray-600 ml-auto">
                        {EMOTIONS_EMOJI[segment.emotion] ?? ""}{" "}
                        <span className="italic">{segment.emotion}</span>
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-sm leading-relaxed ${
                      isActive ? "text-white" : "text-gray-400"
                    }`}
                  >
                    {segment.text}
                  </p>
                </div>
              );
            }
          )}
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="p-5 rounded-2xl glass">
        <h4 className="text-sm font-semibold text-gray-300 mb-4">
          ✨ Episode Takeaways
        </h4>
        <div className="space-y-2">
          {podcast.keyTakeaways.map((takeaway, i) => (
            <div key={i} className="flex gap-3 items-start">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{takeaway}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-gray-600 px-4">
        {playerEnabled && !isFallback
          ? "Audio powered by ElevenLabs — eleven_multilingual_v2 model."
          : playerEnabled && isFallback
          ? "Audio powered by BodhaWave AI."
          : ""}
      </div>
    </div>
  );
}
