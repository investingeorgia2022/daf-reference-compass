import { createFileRoute } from "@tanstack/react-router";
import { geminiSpeak, readUserGemini } from "@/server/geminiRouter";
import { readJsonBody, str } from "@/server/talmudAi";

// Male-voice speech using the caller's own Gemini key only (never project credits).
export const Route = createFileRoute("/api/talmud/tts")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = readUserGemini(request);
        if (!user) return Response.json({ error: "no_key" }, { status: 400 });
        const b = await readJsonBody(request);
        const text = str(b.text, 1200).trim();
        if (!text) return Response.json({ error: "no_text" }, { status: 400 });
        try {
          const wav = await geminiSpeak(user.key, text);
          return new Response(wav.buffer as ArrayBuffer, { headers: { "content-type": "audio/wav", "cache-control": "no-store" } });
        } catch (e) {
          // Expected when the user's key lacks TTS access or quota; the app falls back to the device voice.
          console.warn("[tts] Gemini speech unavailable:", e instanceof Error ? e.message : e);
          return Response.json({ error: "tts_unavailable" }, { status: 424 });
        }
      },
    },
  },
});
