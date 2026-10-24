import { createFileRoute } from "@tanstack/react-router";
import { transcribeAudio } from "@lovable.dev/ai-gateway";
import { errorResponse, readJsonBody, str } from "@/server/talmudAi";

const MAX_B64 = 14_000_000; // ~10 MB audio

export const Route = createFileRoute("/api/talmud/voice-transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const b = await readJsonBody(request);
        const b64 = str(b.audioBase64, MAX_B64 + 1);
        if (!b64 || b64.length > MAX_B64) return Response.json({ error: "bad_audio" }, { status: 400 });
        const mime = str(b.mimeType, 60) || "audio/webm";
        const lang = str(b.lang, 10).slice(0, 2);
        try {
          const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
          const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : mime.includes("wav") ? "wav" : "webm";
          const file = new File([bytes], `speech.${ext}`, { type: mime });
          const res = await transcribeAudio({
            model: "openai/gpt-transcribe",
            file,
            ...(lang === "ka" || lang === "he" || lang === "en" || lang === "ru" ? { language: lang } : {}),
            prompt: "Talmud, Gemara, Mishnah, tractate names, daf numbers, Hebrew and Georgian terms.",
          });
          const transcript = typeof res === "string" ? res : (res as { text?: string }).text ?? "";
          return Response.json({ transcript });
        } catch (e) {
          return errorResponse(e);
        }
      },
    },
  },
});
