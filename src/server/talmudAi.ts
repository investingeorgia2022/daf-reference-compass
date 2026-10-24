import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";

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
export async function askJson(task: string, shape: string, payload: unknown): Promise<Record<string, unknown>> {
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
  const raw = extractText(res).trim();
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    return m ? (JSON.parse(m[0]) as Record<string, unknown>) : {};
  }
}

export async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const b = await request.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export const str = (v: unknown, max = 4000) => (typeof v === "string" ? v.slice(0, max) : "");

export function errorResponse(e: unknown): Response {
  if (e instanceof GatewayError) {
    const status = e.httpStatus === 429 || e.httpStatus === 402 ? e.httpStatus : 502;
    return Response.json({ error: "ai_unavailable", code: e.code }, { status });
  }
  console.error("talmud ai error", e);
  return Response.json({ error: "server_error" }, { status: 500 });
}

/** Wraps a JSON AI handler with body parsing and error handling. */
export function jsonAiHandler(fn: (body: Record<string, unknown>) => Promise<unknown>) {
  return async ({ request }: { request: Request }) => {
    const body = await readJsonBody(request);
    try {
      return Response.json(await fn(body));
    } catch (e) {
      return errorResponse(e);
    }
  };
}
