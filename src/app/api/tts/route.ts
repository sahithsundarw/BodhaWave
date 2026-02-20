import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

/**
 * ElevenLabs voice IDs
 * HOST  → Josh  : warm, engaging, podcast-host energy
 * GUEST → Rachel: calm, authoritative, clear — ideal for an expert
 */
const VOICE_IDS = {
  HOST:  process.env.ELEVENLABS_VOICE_HOST  ?? "TxGEqnHWrfWFTfGW9XjX", // Josh
  GUEST: process.env.ELEVENLABS_VOICE_GUEST ?? "21m00Tcm4TlvDq8ikWAM", // Rachel
} as const;

/**
 * English voice settings — energetic, expressive podcast delivery.
 *
 * Aarav (HOST): lively, slightly faster, high style for energy.
 * Dr. Meera (GUEST): calm, authoritative, measured pace.
 */
const VOICE_SETTINGS_EN = {
  HOST: {
    stability: 0.35,
    similarity_boost: 0.80,
    style: 0.40,
    use_speaker_boost: true,
    speed: 1.1,
  },
  GUEST: {
    stability: 0.60,
    similarity_boost: 0.75,
    style: 0.10,
    use_speaker_boost: true,
    speed: 0.92,
  },
} as const;

/**
 * Non-English (Hindi/Telugu code-switch) voice settings.
 *
 * style: 0 — removes style exaggeration which causes heavy accent artefacts.
 * stability: higher — more consistent, neutral delivery across scripts.
 * speed: slightly lower — gives the model time to articulate mixed-script text clearly.
 */
const VOICE_SETTINGS_MULTILINGUAL = {
  HOST: {
    stability: 0.55,
    similarity_boost: 0.75,
    style: 0.0,
    use_speaker_boost: true,
    speed: 1.0,
  },
  GUEST: {
    stability: 0.65,
    similarity_boost: 0.70,
    style: 0.0,
    use_speaker_boost: true,
    speed: 0.90,
  },
} as const;

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    const { text, speaker, language } = (await req.json()) as {
      text: string;
      speaker: "HOST" | "GUEST";
      language?: string;
    };

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ELEVENLABS_API_KEY is not set. Add it to .env.local and restart the server." },
        { status: 500 }
      );
    }

    const voiceId = VOICE_IDS[speaker] ?? VOICE_IDS.HOST;
    const isNonEnglish = language && language !== "en";
    const settingsMap = isNonEnglish ? VOICE_SETTINGS_MULTILINGUAL : VOICE_SETTINGS_EN;
    const settings = settingsMap[speaker] ?? settingsMap.HOST;
    const { speed, ...voiceSettings } = settings;

    let lastError = "Unknown error";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAY_MS * attempt); // 1.5s, then 3s
      }

      const elRes = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: voiceSettings,
            speed,
          }),
        }
      );

      if (elRes.ok) {
        const audioBuffer = await elRes.arrayBuffer();
        return new NextResponse(audioBuffer, {
          headers: {
            "Content-Type": "audio/mpeg",
            "Cache-Control": "no-store",
          },
        });
      }

      const errText = await elRes.text();
      lastError = `ElevenLabs error ${elRes.status}: ${errText}`;

      if (![429, 500, 503].includes(elRes.status)) break;
    }

    return NextResponse.json({ error: lastError }, { status: 502 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
