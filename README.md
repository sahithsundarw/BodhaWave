<<<<<<< HEAD
# 🎙️ Research Reimagined – The AI Research Co-Host

Transform any academic paper into an engaging, interactive, multi-perspective podcast experience powered by Claude AI.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **🎙️ Podcast Generation** | Two-voice AI conversation (Host + Expert Guest) |
| **🎓 5 Perspective Modes** | Student, Researcher, Investor, Journalist, Beginner |
| **🧠 Deep Paper Analysis** | Domain, methodology, contributions, limitations, novelty |
| **💬 Interactive Q&A** | Chat with an AI that has read your paper |
| **📈 Impact Analyzer** | Startups, industry impact, ethical considerations, 2026 relevance |
| **⚔️ Paper Battle Mode** | Compare two papers in a debate-style podcast |
| **🔊 Browser TTS** | Two distinct voices playback in your browser |

## 🚀 Quick Start

### Prerequisites

1. **Install Node.js** (v18 or later): https://nodejs.org/en/download

2. **Get an Anthropic API Key**: https://console.anthropic.com/

### Setup

```bash
# Navigate to the project
cd research-reimagined

# Install dependencies
npm install

# Create environment file
cp .env.local.example .env.local
```

Edit `.env.local` and add your API key:
```
ANTHROPIC_API_KEY=sk-ant-...your-key-here...
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

```
research-reimagined/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Main app with phase state machine
│   │   ├── layout.tsx            # Root layout
│   │   ├── globals.css           # Dark theme styles
│   │   └── api/
│   │       ├── analyze/          # Paper analysis endpoint
│   │       ├── podcast/          # Podcast generation endpoint
│   │       ├── qa/               # Q&A chat endpoint
│   │       ├── impact/           # Impact analysis endpoint
│   │       └── battle/           # Paper battle endpoint
│   ├── components/
│   │   ├── PaperUpload.tsx       # Drag-and-drop PDF upload
│   │   ├── PerspectiveSelector.tsx # Choose your lens
│   │   ├── LoadingState.tsx      # Animated progress
│   │   ├── PaperInsights.tsx     # Full paper analysis view
│   │   ├── PodcastPlayer.tsx     # TTS player with transcript
│   │   ├── QASection.tsx         # Interactive chat
│   │   ├── ImpactAnalyzer.tsx    # Forward-looking analysis
│   │   └── PaperBattle.tsx       # Two-paper comparison
│   ├── lib/
│   │   ├── anthropic.ts          # Claude API utilities
│   │   └── prompts.ts            # AI prompt engineering
│   └── types/
│       └── index.ts              # TypeScript types
```

## 🎯 How It Works

1. **Upload** a research paper PDF (up to 20MB)
2. **Choose** your perspective mode (Student/Researcher/Investor/Journalist/Beginner)
3. **AI analyzes** the full paper using Claude's native PDF understanding
4. **Listen** to a natural two-person podcast about the paper
5. **Explore** the deep insights, ask follow-up questions, analyze impact
6. **Battle** by uploading a second paper for head-to-head comparison

## 🔧 Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **AI Engine**: Anthropic Claude claude-sonnet-4-6 (native PDF understanding)
- **Audio**: Web Speech API (browser-native TTS, two voices)
- **Animations**: Framer Motion + custom CSS

## 💡 Key Differentiators

1. **Native PDF Understanding**: Uses Claude's document API — no PDF parsing libraries
2. **Perspective-Aware Generation**: The same paper produces genuinely different conversations
3. **Interactive Companion**: Full contextual Q&A grounded in the actual paper
4. **Paper Battle**: Analytical debate between two papers with scored comparisons
5. **Forward-Looking**: Impact analysis includes startups, ethics, 2026 relevance

## 🎙️ Audio Notes

The TTS uses your browser's built-in Web Speech API:
- **Best voices**: Use Chrome or Edge with Google voices
- **Host voice**: Female (enthusiastic, curious)
- **Guest voice**: Male (authoritative, analytical)
- Voice availability varies by operating system

## 🌐 Deployment

Deploy to Vercel (recommended):

```bash
npm install -g vercel
vercel --env ANTHROPIC_API_KEY=your_key_here
```

---

Built with ❤️ for the AI hackathon. *Research should be accessible, engaging, and alive.*
=======
# Pettu
>>>>>>> 39fe2af7d8b4135ac699aac5e5890bf4beebd3fd
