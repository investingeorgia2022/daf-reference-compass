// Routes a task to the user's own Gemini model by tier, falling back to the Flash alias on any failure.
export type AiTier = 'lite' | 'balanced' | 'deep' | 'complex';

export interface UserGemini {
  key: string;
  mode: 'auto' | 'fixed';
  fixedModel: string;
  complexModel: string;
}

export const FALLBACK_MODEL = 'gemini-flash-latest';

const TIER_MODEL: Record<AiTier, string> = {
  lite: 'gemini-flash-lite-latest',
  balanced: 'gemini-flash-latest',
  deep: 'gemini-pro-latest',
  complex: 'gemini-pro-latest',
};

const MODEL_RE = /^[a-zA-Z0-9._-]{3,80}$/;

export function readUserGemini(request: Request): UserGemini | null {
  const key = (request.headers.get('x-gemini-key') || '').trim();
  if (!key || key.length > 200) return null;
  const fixed = (request.headers.get('x-gemini-model') || '').trim();
  const complex = (request.headers.get('x-gemini-complex') || '').trim();
  return {
    key,
    mode: request.headers.get('x-gemini-mode') === 'fixed' ? 'fixed' : 'auto',
    fixedModel: MODEL_RE.test(fixed) ? fixed : FALLBACK_MODEL,
    complexModel: MODEL_RE.test(complex) ? complex : '',
  };
}

/** Ordered, de-duplicated list of models to try for a tier; always ends with the Flash fallback. */
export function modelChain(user: Pick<UserGemini, 'mode' | 'fixedModel' | 'complexModel'>, tier: AiTier): string[] {
  const first =
    user.mode === 'fixed'
      ? user.fixedModel
      : tier === 'complex' && user.complexModel
        ? user.complexModel
        : TIER_MODEL[tier];
  return Array.from(new Set([first, FALLBACK_MODEL, 'gemini-flash-lite-latest']));
}

export class GeminiKeyError extends Error {}
/** Every model was rate-limited or overloaded (Gemini 429/503). */
export class GeminiBusyError extends Error {
  constructor(public status: 429 | 503) { super(`gemini_busy_${status}`); }
}

export async function geminiGenerateJson(user: UserGemini, tier: AiTier, system: string, prompt: string, alreadyRetried = false): Promise<string> {
  let lastErr: unknown = null;
  let retried503 = alreadyRetried;
  let busy: 429 | 503 | null = null;
  for (const model of modelChain(user, tier)) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-goog-api-key': user.key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: 'application/json' },
          }),
        },
      );
      if (res.status === 400 || res.status === 401 || res.status === 403) {
        const t = await res.text();
        if (/API_KEY|api key|PERMISSION_DENIED/i.test(t)) throw new GeminiKeyError('invalid_key');
        lastErr = new Error(`gemini ${res.status}`);
        continue;
      }
      if (res.status === 503 && !retried503) {
        // Overloaded: wait briefly and retry this model once.
        retried503 = true;
        await new Promise((r) => setTimeout(r, 1200));
        const again = await geminiGenerateJson(user, tier, system, prompt, true).catch((e) => e);
        if (typeof again === 'string') return again;
        throw again;
      }
      if (!res.ok) {
        if (res.status === 429 || res.status === 503) busy = res.status;
        lastErr = new Error(`gemini ${res.status}`);
        continue;
      }
      const j = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const text = (j.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
      if (text) return text;
      lastErr = new Error('empty');
    } catch (e) {
      if (e instanceof GeminiKeyError || e instanceof GeminiBusyError) throw e;
      lastErr = e;
    }
  }
  if (busy) throw new GeminiBusyError(busy);
  throw lastErr ?? new Error('gemini_failed');
}

/** Gemini TTS with a male voice; returns a WAV file. */
export async function geminiSpeak(key: string, text: string, voice = 'Iapetus'): Promise<Uint8Array> {
  let lastErr = 'tts_failed';
  for (const model of TTS_MODELS) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text }] }],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
        },
      }),
    },
  );
  if (!res.ok) { lastErr = `tts ${res.status}`; continue; }
  const j = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ inlineData?: { data?: string } }> } }> };
  const b64 = j.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!b64) { lastErr = 'tts_empty'; continue; }
  const pcm = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return pcmToWav(pcm, 24000);
  }
  throw new Error(lastErr);
}

const TTS_MODELS = ['gemini-2.5-flash-preview-tts', 'gemini-2.5-pro-preview-tts'];

function pcmToWav(pcm: Uint8Array, rate: number): Uint8Array {
  const out = new Uint8Array(44 + pcm.length);
  const v = new DataView(out.buffer);
  const w = (o: number, s: string) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); w(8, 'WAVE'); w(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, 'data'); v.setUint32(40, pcm.length, true); out.set(pcm, 44);
  return out;
}
