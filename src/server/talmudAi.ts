import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { geminiGenerateJson, GeminiKeyError, GeminiBusyError, readUserGemini, type AiTier, type UserGemini } from "./geminiRouter";

export interface AiCtx { user: UserGemini | null; tier: AiTier }

const BASE_SYSTEM =
  "You are an expert Talmud scholar fluent in Hebrew, Aramaic and Georgian. " +
  "Answer accurately, cite real sources (Tractate + daf, Rambam, Shulchan Aruch, Tanakh) and never invent citations. " +
  "Georgian text must be natural literary Georgian using standard Jewish terminology (თალმუდი, გემარა, მიშნა, რაში, თოსაფოთი, ჰალახა).";

function extractText(res: unknown): string {
  const r = res as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  const parts: string[] = [];
  for (const item of r.output ?? []) {
    for (const c of item.content ?? []) {
      if (c.type === "output_text" && typeof c.text === "string") parts.push(c.text);
    }
  }
  return parts.join("");
}

/** Ask the model for a JSON object described by `shape`. Returns parsed object. */
export async function askJson(task: string, shape: string, payload: unknown, ctx?: AiCtx): Promise<Record<string, unknown>> {
  const prompt = `${task}\n\nReturn JSON only, with exactly this shape:\n${shape}\n\nInput:\n${JSON.stringify(payload)}`;
  if (ctx?.user) {
    // Gemini occasionally returns broken JSON (e.g. {"translation":}); retry once before giving up.
    for (let attempt = 0; attempt < 2; attempt++) {
      const out = parseJson(await geminiGenerateJson(ctx.user, ctx.tier, BASE_SYSTEM, prompt));
      if (Object.keys(out).length > 0) return out;
    }
    return {};
  }
  const res = await generateResponse({
    model: "openai/gpt-6-astra",
    instructions: BASE_SYSTEM,
    text: { format: { type: "json_object" } },
    input: [
      {
        role: "user",
        content: `${task}\n\nReturn JSON only, with exactly this shape:\n${shape}\n\nInput:\n${JSON.stringify(payload)}`,
      },
    ],
  });
  return parseJson(extractText(res));
}

function parseJson(text: string): Record<string, unknown> {
  const raw = text.trim();
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]) as Record<string, unknown>;
      } catch {
        // fall through: malformed model output must never crash the route
      }
    }
    return {};
  }
}

export interface TalmudBody {
  question?: unknown; scope?: unknown; query?: unknown; word?: unknown; sentence?: unknown;
  sourceType?: unknown; tractate?: unknown; daf?: unknown; text?: unknown; hebrewOriginal?: unknown;
  sectionType?: unknown; targetLang?: unknown; tractateHebrew?: unknown; tractateGeorgian?: unknown;
  dafExcerpt?: unknown; language?: unknown; audioBase64?: unknown; mimeType?: unknown; lang?: unknown;
}

export async function readJsonBody(request: Request): Promise<TalmudBody> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? (b as TalmudBody) : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");

export function errorResponse(e: unknown): Response {
  if (e instanceof GeminiKeyError) return Response.json({ error: "invalid_gemini_key" }, { status: 401 });
  if (e instanceof GeminiBusyError) return Response.json({ error: "gemini_busy" }, { status: e.status });
  if (e instanceof GatewayError) {
    const status = e.httpStatus === 429 || e.httpStatus === 402 ? e.httpStatus : 502;
    return Response.json({ error: "ai_unavailable", code: e.code }, { status });
  }
  console.error("talmud ai error", e);
  return Response.json({ error: "server_error" }, { status: 500 });
}

/** Wraps a JSON AI handler with body parsing and error handling. */
export function jsonAiHandler(tier: AiTier, fn: (body: TalmudBody, ctx: AiCtx) => Promise<unknown>) {
  return async ({ request }: { request: Request }) => {
    const body = await readJsonBody(request);
    const ctx: AiCtx = { user: readUserGemini(request), tier };
    try {
      return Response.json(await fn(body, ctx));
    } catch (e) {
      return errorResponse(e);
    }
  };
}
