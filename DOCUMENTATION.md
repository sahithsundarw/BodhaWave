# BodhaWave — Full Project Documentation

> **From Paper to Podcast** — An AI-powered platform that transforms academic research papers into engaging, interactive, multi-perspective podcast conversations.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Setup & Running](#4-setup--running)
5. [Environment Variables](#5-environment-variables)
6. [App Architecture](#6-app-architecture)
7. [API Routes](#7-api-routes)
8. [Components](#8-components)
9. [AI Backend (lib/)](#9-ai-backend-lib)
10. [Prompt Engineering](#10-prompt-engineering)
11. [Types](#11-types)
12. [Styling System](#12-styling-system)
13. [Features In Detail](#13-features-in-detail)
14. [Audio System](#14-audio-system)
15. [Multilingual Support](#15-multilingual-support)
16. [Configuration Files](#16-configuration-files)
17. [Known Limitations](#17-known-limitations)

---

## 1. Project Overview

BodhaWave lets users upload any academic PDF and instantly get:

| Feature | Description |
|---|---|
| **Paper Insights** | Deep structured analysis — methodology, contributions, scores, equations |
| **AI Podcast** | A two-host podcast dialogue tailored to a chosen perspective |
| **Q&A Companion** | Contextual chat that answers questions about the paper |
| **Impact Analysis** | Real-world implications, startup opportunities, ethical considerations |
| **Paper Battle** | Upload two papers and get a head-to-head AI debate |

All AI inference is done server-side via **Google Gemini 2.5 Flash**. Audio is synthesized via **ElevenLabs** (with silent browser TTS fallback).

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Animation | Framer Motion 11 |
| Icons | Lucide React |
| AI (text) | Google Gemini 2.5 Flash via `@google/generative-ai` |
| AI (audio) | ElevenLabs REST API (`eleven_multilingual_v2`) |
| Fallback TTS | Browser Web Speech API |
| File upload | react-dropzone |
| Utilities | clsx |

---

## 3. Project Structure

```
research-reimagined/
│
├── public/                     # Static assets (served at /)
│   ├── logo.jpeg               # Full BodhaWave logo (navbar)
│   └── logo1.jpeg              # Icon logo (navbar icon box)
│
├── src/
│   ├── app/
│   │   ├── api/                # Next.js API Route Handlers
│   │   │   ├── analyze/        # Paper analysis endpoint
│   │   │   ├── battle/         # Paper vs paper comparison
│   │   │   ├── impact/         # Real-world impact analysis
│   │   │   ├── podcast/        # Podcast script generation
│   │   │   ├── qa/             # Interactive Q&A
│   │   │   ├── translate/      # Hindi / Telugu translation
│   │   │   └── tts/            # ElevenLabs TTS proxy
│   │   ├── globals.css         # Global styles + custom CSS utilities
│   │   ├── layout.tsx          # Root HTML layout, metadata, fonts
│   │   └── page.tsx            # Main page — state machine + tab UI
│   │
│   ├── components/
│   │   ├── Header.tsx          # Fixed navbar with logo + nav links
│   │   ├── ImpactAnalyzer.tsx  # Impact analysis display
│   │   ├── LoadingState.tsx    # Animated loading screen
│   │   ├── PaperBattle.tsx     # Paper battle upload + results
│   │   ├── PaperInsights.tsx   # Paper analysis display
│   │   ├── PaperUpload.tsx     # PDF drag-and-drop uploader
│   │   ├── PerspectiveSelector.tsx  # 5-perspective picker
│   │   ├── PodcastPlayer.tsx   # Full audio player (TTS + controls)
│   │   └── QASection.tsx       # Chat-based Q&A interface
│   │
│   ├── lib/
│   │   ├── anthropic.ts        # Gemini API wrapper (analyzeWithPDF, chatWithContext, parseJSONResponse)
│   │   └── prompts.ts          # All AI prompts + PERSPECTIVE_CONFIG
│   │
│   └── types/
│       └── index.ts            # All shared TypeScript interfaces
│
├── .env.local                  # API keys (gitignored)
├── .env.local.example          # Template for env setup
├── next.config.js              # Next.js config (30MB body limit)
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Setup & Running

### Prerequisites
- Node.js v18+ (v24 confirmed working)
- Google AI API key (free at https://aistudio.google.com/app/apikey)
- ElevenLabs API key (for voice synthesis — optional, falls back to browser TTS)

### Steps

```bash
# 1. Navigate to project
cd research-reimagined

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.local.example .env.local
# Edit .env.local with your keys

# 4. Start dev server
npm run dev

# 5. Open in browser
# http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run start
```

---

## 5. Environment Variables

File: `.env.local`

| Variable | Required | Description |
|---|---|---|
| `GOOGLE_AI_API_KEY` | Yes | Google Gemini API key — used for all text AI features |
| `ELEVENLABS_API_KEY` | Optional | ElevenLabs key — needed for high-quality voice synthesis |
| `ELEVENLABS_VOICE_HOST` | Optional | Custom voice ID for the HOST speaker (default: Josh) |
| `ELEVENLABS_VOICE_GUEST` | Optional | Custom voice ID for the GUEST speaker (default: Rachel) |

If `ELEVENLABS_API_KEY` is missing, TTS silently falls back to browser Web Speech API.

---

## 6. App Architecture

### State Machine (page.tsx)

The entire app is a single-page state machine with these phases:

```
upload  →  perspective  →  loading  →  results
                                          ↑
                                       (tabs: Podcast | Insights | Q&A | Impact)

upload  →  battle-upload  →  (battle results embedded in upload page)
```

| Phase | What the user sees |
|---|---|
| `upload` | Landing page with PDF dropzone + feature showcase |
| `perspective` | 5 perspective cards to choose from |
| `loading` | Animated loading screen, runs analyze + podcast in parallel |
| `results` | Tabbed results: Podcast Player, Paper Insights, Q&A, Impact |
| `battle-upload` | Dual PDF upload for Paper Battle mode |

### Data Flow

```
User uploads PDF
       ↓
PDF → base64 string (stored in state)
       ↓
User selects perspective
       ↓
Promise.allSettled([
  POST /api/analyze   → PaperAnalysis
  POST /api/podcast   → PodcastScript
])
       ↓
Results page renders with analysis + podcast data
       ↓
Impact: POST /api/impact  (lazy — only when Impact tab clicked)
Q&A:    POST /api/qa      (per question)
TTS:    POST /api/tts     (parallel — all podcast segments at once)
```

---

## 7. API Routes

All routes use **Next.js Route Handlers** (App Router). All accept `POST` with JSON body.

---

### `POST /api/analyze`

Analyzes a single PDF and returns a structured `PaperAnalysis` object.

**Request body:**
```json
{ "pdfBase64": "<base64-encoded PDF>" }
```

**Response:**
```json
{ "analysis": { ...PaperAnalysis } }
```

**maxDuration:** 120s
**Gemini tokens:** 8192 output

---

### `POST /api/podcast`

Generates a two-host podcast script tailored to the selected perspective.

**Request body:**
```json
{
  "pdfBase64": "<base64 PDF>",
  "perspective": "student" | "researcher" | "investor" | "journalist" | "beginner"
}
```

**Response:**
```json
{ "podcast": { ...PodcastScript } }
```

**maxDuration:** 120s
**Gemini tokens:** 8192 output

---

### `POST /api/qa`

Answers a user question about the paper using the selected perspective as context.

**Request body:**
```json
{
  "question": "What is the main contribution?",
  "paperContext": { ...PaperAnalysis },
  "perspective": "researcher",
  "chatHistory": [{ "role": "user", "content": "..." }, ...]
}
```

**Response:**
```json
{ "answer": "The main contribution is..." }
```

**maxDuration:** 60s
**Gemini tokens:** 1500 output

---

### `POST /api/impact`

Generates a strategic real-world impact analysis from the PDF.

**Request body:**
```json
{ "pdfBase64": "<base64 PDF>" }
```

**Response:**
```json
{ "impact": { ...ImpactAnalysis } }
```

**maxDuration:** 120s
**Gemini tokens:** 6000 output

---

### `POST /api/battle`

Compares two PDFs head-to-head across 5 dimensions and generates a debate podcast.

**Request body:**
```json
{
  "pdf1Base64": "<base64 PDF>",
  "pdf2Base64": "<base64 PDF>"
}
```

**Response:**
```json
{ "battle": { ...PaperBattleResult } }
```

**maxDuration:** 180s
**Gemini tokens:** 8192 output

---

### `POST /api/translate`

Translates podcast segments from English to Hinglish or Tenglish (Roman script).

**Request body:**
```json
{
  "segments": [ { "speaker": "HOST", "text": "..." }, ... ],
  "targetLanguage": "hi" | "te"
}
```

**Response:**
```json
{ "segments": [ { "speaker": "HOST", "text": "translated text..." }, ... ] }
```

**Notes:**
- Output is always Roman script (Hinglish = Hindi-English mix in Latin letters; Tenglish = Telugu-English mix in Latin letters)
- Technical terms are kept in English

---

### `POST /api/tts`

Proxies a single text segment to ElevenLabs and returns raw audio bytes.

**Request body:**
```json
{
  "text": "Hello, welcome to BodhaWave!",
  "speaker": "HOST" | "GUEST",
  "language": "en"
}
```

**Response:** `audio/mpeg` binary stream (or JSON error)

**Retry logic:** Up to 2 retries with 1.5s / 3s backoff on HTTP 429, 500, 503.

**Voice configuration:**

| Speaker | Voice | Stability | Style | Speed |
|---|---|---|---|---|
| HOST (Aarav) | Josh (ElevenLabs) | 0.35 | 0.40 | 1.1× |
| GUEST (Dr. Meera) | Rachel (ElevenLabs) | 0.60 | 0.10 | 0.92× |

---

## 8. Components

### `Header.tsx`
Fixed top navbar with:
- Logo icon (logo1.jpeg in violet rounded box) + "BodhaWave" gradient text
- Navigation links (Features, How it works, About) — scroll to sections
- "New Paper" reset button (shown only when in results view)
- "AI Ready" pulsing green indicator

---

### `PaperUpload.tsx`
Landing page upload zone with:
- Drag-and-drop or click-to-browse for PDF files
- File validation (PDF only, max 30MB)
- Feature cards showcasing the 4 main capabilities
- "Paper Battle Mode" entry button
- Animated background grid

---

### `PerspectiveSelector.tsx`
Shows 5 perspective cards in a 2-column grid (beginner spans full width):

| Perspective | Focus |
|---|---|
| Student | Learning-oriented, exam prep angle |
| Researcher | Technical depth, methodology, reproducibility |
| Investor | ROI, market opportunity, commercialization |
| Journalist | Newsworthy angle, societal impact, plain language |
| Beginner | Maximum accessibility, no jargon |

Badges ("Most detailed", "Most accessible") appear inline below each card's description.

---

### `LoadingState.tsx`
Animated loading screen showing real-time step progress:
1. Parsing PDF structure
2. Understanding methodology
3. Building perspective lens
4. Crafting podcast narrative
5. Generating insights
6. Finalizing experience

Features orbiting dot animation and shimmer placeholders.

---

### `PaperInsights.tsx`
Displays the full `PaperAnalysis` result:
- Header: title, authors, year, domain, one-liner, executive summary
- Score bars: Impact, Accessibility, Technical Depth
- Novelty badge: Breakthrough / Significant Advancement / Incremental
- Top insights, key contributions, methodology
- Key equations (rendered with explanation)
- Limitations, real-world applications, related work
- Tag pills for authors and domain

---

### `PodcastPlayer.tsx`
The most complex component (~1100 lines). Features:

**Generation:**
- Auto-generates on mount when podcast data + language are set
- Translates segments via `/api/translate` if non-English
- Fires all TTS requests in parallel via `Promise.all`
- Progress bar fills as each segment completes (updated per-request)
- Silent fallback to browser Web Speech API if all ElevenLabs requests fail

**Playback:**
- Play/Pause, Skip ±5s
- Playback speed: 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2× (via `speedRef` pattern to avoid stale closures)
- Real-time progress bar with click-to-seek and drag-to-scrub
- Current/total time display
- Speaker indicator (HOST / GUEST) with active pulse animation
- Animated waveform bars during playback

**Language switching:**
- English / Hindi (Hinglish) / Telugu (Tenglish)
- Switching triggers re-translation + re-generation
- `generationIdRef` cancels stale runs when language changes mid-generation

**Transcript:**
- Expandable transcript panel
- Highlights current speaker's line during playback

---

### `QASection.tsx`
Chat interface for asking questions about the paper:
- 4 suggested quick-questions based on perspective
- Scrollable message history
- Sends full chat history with each request for multi-turn context
- Perspective-aware answers (researcher gets technical depth, beginner gets simplified)

---

### `ImpactAnalyzer.tsx`
Strategic impact display:
- "Why it matters" summary
- Who benefits (beneficiary chips)
- Industry impact cards (industry + specific impact)
- Startup opportunity cards (name, description, market size — truncated chip to prevent overflow)
- Future research directions
- Ethical considerations
- Timeline to impact + competitive landscape

---

### `PaperBattle.tsx`
Two-paper comparison mode:
- Dual PDF upload with drag-and-drop
- Loads both papers, sends to `/api/battle`
- Shows paper summaries side by side
- Comparison table across 5 dimensions (winner highlighted per row)
- Overall winner declaration with explanation
- Debate podcast (same PodcastPlayer, without language switching)

---

## 9. AI Backend (lib/)

### `src/lib/anthropic.ts`

All Gemini interactions are in this file. Function signatures were preserved from the original Claude SDK to avoid rewriting API routes.

**Current model:** `gemini-2.5-flash`

#### `analyzeWithPDF(pdfBase64, prompt, maxTokens)`
Sends a PDF (as inline base64 data) + text prompt to Gemini. Returns the raw text response. Used by analyze, podcast, impact routes.

#### `analyzeWithTwoPDFs(pdf1Base64, pdf2Base64, prompt, maxTokens)`
Same as above but with two PDFs. Used by the battle route.

#### `chatWithContext(systemPrompt, messages, maxTokens)`
Multi-turn chat with a system instruction. Converts message history to Gemini's `Content[]` format. Used by the Q&A route.

#### `parseJSONResponse(text)`
Robust JSON extractor:
1. Strips markdown code fences
2. Uses brace-depth walking to find the true JSON object boundaries
3. If response was truncated (token limit), attempts repair by closing open brackets/braces
4. Two-pass parsing: raw first, then with trailing-comma stripping (Gemini quirk)

---

## 10. Prompt Engineering

### `src/lib/prompts.ts`

#### `PERSPECTIVE_CONFIG`
Defines metadata for each perspective — used both server-side (in prompts) and client-side (in UI cards):

```typescript
{
  student:    { label, icon, color, description, focus, tone, depth },
  researcher: { ... },
  investor:   { ... },
  journalist: { ... },
  beginner:   { ... },
}
```

#### `buildAnalysisPrompt()`
Returns a prompt asking Gemini to return a full `PaperAnalysis` JSON object. Covers title, authors, methodology, contributions, limitations, equations, scores, etc.

#### `buildPodcastPrompt(perspective)`
Returns a perspective-specific prompt generating a 15–20 turn two-host podcast script. Each perspective changes:
- The hosts' personas and expertise
- The tone (formal / conversational / investor-speak / journalistic / friendly)
- Which aspects of the paper to emphasize
- The complexity of the language used

**Hosts:**
- `HOST` — Aarav: the enthusiastic podcast host, asks questions, provides context
- `GUEST` — Dr. Meera: the domain expert, gives detailed explanations

#### `buildQAPrompt(perspective, paperContext)`
System prompt for the Q&A chat. Includes the full paper analysis as context and instructs Gemini to answer from the given perspective's lens.

#### `buildImpactPrompt()`
Generates strategic impact analysis — beneficiaries, industries, startup ideas, ethics, timeline.

#### `buildBattlePrompt()`
Generates a structured comparison of two papers including a debate podcast where each paper is "defended".

---

## 11. Types

### `src/types/index.ts`

#### `PaperAnalysis`
Full structured analysis of a research paper:
- Bibliographic: `title`, `authors`, `year`, `domain`, `subField`
- Content: `coreProblem`, `methodology`, `keyContributions`, `limitations`, `realWorldApplications`
- Scores (0–10): `accessibilityScore`, `impactScore`, `technicalDepth`
- Extras: `keyEquations[]`, `relatedWork[]`, `noveltyAssessment`, `executiveSummary`, `oneLiner`

#### `PodcastScript`
- `title`, `tagline`, `duration`
- `segments: PodcastSegment[]` — array of HOST/GUEST turns with text and optional emotion
- `keyTakeaways: string[]`

#### `PodcastSegment`
```typescript
{ speaker: "HOST" | "GUEST"; text: string; emotion?: string }
```

#### `ImpactAnalysis`
- `whyItMatters`, `beneficiaries[]`, `timelineToImpact`, `competitiveLandscape`
- `industryImpact[]`: `{ industry, impact }`
- `potentialStartups[]`: `{ name, description, marketSize }`
- `futureResearch[]`, `ethicalConsiderations[]`

#### `PaperBattleResult`
- `paper1Title`, `paper2Title`, `paper1Summary`, `paper2Summary`
- `comparisons[]`: `{ aspect, paper1, paper2, winner: "1"|"2"|"tie" }`
- `overallWinner: "1"|"2"|"contextual"`, `winnerExplanation`
- `debateSegments: PodcastSegment[]`

#### `Perspective`
```typescript
"student" | "researcher" | "investor" | "journalist" | "beginner"
```

#### `AppPhase`
```typescript
"upload" | "perspective" | "loading" | "results" | "battle-upload"
```

---

## 12. Styling System

### `globals.css` — Custom CSS utilities

| Class | Purpose |
|---|---|
| `.glass` | White/transparent frosted glass card |
| `.glass-violet` | Violet-tinted frosted glass card |
| `.gradient-text` | Purple → blue → green gradient text |
| `.gradient-text-violet` | Purple → indigo gradient text |
| `.grid-bg` | Subtle violet grid background pattern |
| `.glow-violet` | Violet box-shadow glow |
| `.glow-cyan` | Cyan box-shadow glow |
| `.waveform-bar` | Animated audio waveform bar |
| `.shimmer` | Loading skeleton shimmer animation |
| `.score-bar` | CSS variable–driven width grow animation |
| `.pulse-ring` | Scale-up fade-out ring pulse |
| `.speaker-active` | Box-shadow pulse for active speaker |
| `.tab-active` | Gradient underline for active tab |
| `.navbar-bg` | Semi-transparent frosted navbar background |
| `.btn-gradient` | Animated violet-blue gradient button with shine sweep |
| `.upload-active` | Drag-active upload zone state |
| `.insight-card` | Hover lift effect for insight cards |
| `.tag-pill` | Violet tag chip |

### Tailwind Config Extensions

| Addition | Values |
|---|---|
| Custom color | `violet-950: #1a0533` |
| Animations | `pulse-slow`, `bounce-slow`, `spin-slow`, `wave`, `wave-delay`, `wave-delay-2/3/4`, `float` |
| Keyframes | `wave` (scaleY pulse), `float` (translateY sine) |

### CSS Variables

```css
--bg-primary:   #050511   /* near-black deep space */
--bg-secondary: #0d0d1f   /* slightly lighter panels */
--border-subtle: rgba(139, 92, 246, 0.15)  /* faint violet border */
```

---

## 13. Features In Detail

### Perspective Modes

Each perspective transforms the same paper into a different experience:

| Perspective | Hosts' Lens | Language Level | Emphasis |
|---|---|---|---|
| Student | Learning, exam focus | Accessible, clear | Key concepts, how to understand it |
| Researcher | Technical rigor | Expert, precise | Methodology, reproducibility, limitations |
| Investor | Commercial viability | Business-oriented | ROI, market size, timing |
| Journalist | News angle | Plain, engaging | Societal impact, surprising findings |
| Beginner | Explain like I'm 5 | Very simple | Core idea only, zero jargon |

### Paper Battle Mode

1. User uploads two PDFs simultaneously
2. Both are sent in a single Gemini call with `analyzeWithTwoPDFs`
3. Comparison covers: Innovation, Methodology, Real-world Impact, Reproducibility, Clarity
4. Each dimension has a winner (Paper 1 / Paper 2 / Tie)
5. An overall winner is declared with explanation
6. A debate podcast is generated where each paper is "argued for"

### Real-time Progress Bar (PodcastPlayer)

- During playback: updates every animation frame from `audio.ontimeupdate`
- While dragging: shows `dragPercent` (mouse position)
- For browser TTS fallback: updates per segment (segment-level granularity)
- `intraFrac = audioCurrentTime / audioDuration` gives sub-segment precision
- Click or drag anywhere on the bar to seek

---

## 14. Audio System

### ElevenLabs (Primary)

- **Model:** `eleven_multilingual_v2`
- **HOST voice:** Josh (`TxGEqnHWrfWFTfGW9XjX`) — energetic, faster (1.1×), high style
- **GUEST voice:** Rachel (`21m00Tcm4TlvDq8ikWAM`) — calm, authoritative, measured (0.92×)
- All requests sent as `language: "en"` — Hinglish/Tenglish are Roman script so English phonetics are correct
- Retry: up to 2 retries on 429/500/503, with 1.5s / 3s exponential backoff

### Parallel Generation

All podcast segments are generated simultaneously via `Promise.all`. The progress bar increments as each request completes. Typical generation time for a 15-segment podcast: 3–8 seconds.

### Browser TTS Fallback

- Activates silently if ALL ElevenLabs requests fail
- HOST: first available female voice (`voiceURI.includes("female")`)
- GUEST: first available male voice (`voiceURI.includes("male")`)
- Pitch and rate adjusted per speaker
- No UI indication shown to user (seamless fallback)

### Speed Control

Uses a `speedRef` pattern to avoid stale closure bugs:
- `speedRef = useRef(1.0)` always holds the current speed
- When speed changes: `speedRef.current` is updated synchronously, then `setSpeed(s)` is called
- All callbacks read `speedRef.current` — never the captured `speed` state

---

## 15. Multilingual Support

### Languages Available

| Label shown | Code | Script | How it works |
|---|---|---|---|
| English | `en` | Latin | No translation needed — original Gemini output |
| Hindi | `hi` | Latin (Roman) | Translated to Hinglish — Roman-script Hindi-English mix |
| Telugu | `te` | Latin (Roman) | Translated to Tenglish — Roman-script Telugu-English mix |

### Hinglish Style (via translate API)

- Natural code-switching between Hindi and English
- Short sentences (max 2–3 per turn)
- Technical terms kept in English
- Example: *"Yaar, yeh research bahut badi baat hai. Basically iska matlab hai..."*

### Tenglish Style

- Code-switching between Telugu and English
- Conversational, informal register
- Example: *"Ee research chala important, chuso. Brain ni mana..."*

### Why Roman script?

ElevenLabs pronounces Roman-script Hinglish/Tenglish cleanly because it treats it as English phonetics. Native script (Devanagari/Telugu) triggered the multilingual accent model which introduced artefacts.

---

## 16. Configuration Files

### `next.config.js`
```javascript
experimental: {
  serverActions: {
    bodySizeLimit: "30mb"
  }
}
```
Raises the default 4MB body limit so large PDF base64 payloads (~10–25MB encoded) can be sent to API routes.

### `tailwind.config.ts`
Scans `src/` for class usage. Adds custom animations (`wave`, `float`), keyframes, and a single extra color (`violet-950`).

### `tsconfig.json`
- Strict mode enabled
- Path alias: `@/*` → `./src/*`
- Bundler module resolution (Next.js 14 default)

---

## 17. Known Limitations

| Limitation | Detail |
|---|---|
| PDF size | Practical limit ~15MB — larger files may exceed Gemini's context window |
| Gemini JSON output | Occasionally adds trailing commas (handled by parser) or truncates (handled by repair logic) |
| ElevenLabs free tier | Rate-limited — may get 429 on large podcasts; retry logic handles this |
| Battle mode | Uses one large Gemini call for both PDFs — may be slower than single-paper modes |
| Browser TTS | Voice quality varies significantly by OS and browser; accent/naturalness may differ |
| No persistence | No database — all state is in-memory; refreshing loses all results |
| Mobile layout | Designed primarily for desktop; some panels may be cramped on small screens |

---

*Built with Next.js 14 · Powered by Google Gemini 2.5 Flash · Voice by ElevenLabs*
