import { createFileRoute } from "@tanstack/react-router";
import { askJson, jsonAiHandler, str } from "@/server/talmudAi";

export const Route = createFileRoute("/api/talmud/translate-professional")({
  server: {
    handlers: {
      POST: jsonAiHandler("balanced", async (b, ctx) => {
        const target = str(b.targetLang, 5) === "he" ? "Hebrew" : "Georgian";
        const out = await askJson(
          `Translate the Hebrew/Aramaic original (use the English hint only as help) into fluent, faithful ${target}. Expand abbreviations. Translation only, no commentary.`,
          `{"translation":"string"}`,
          {
            hebrewOriginal: str(b.hebrewOriginal, 6000),
            englishHint: str(b.text, 6000),
            sectionType: str(b.sectionType, 40),
            tractate: str(b.tractate, 100),
            daf: str(b.daf, 20),
          }, ctx);
        return { translation: typeof out["translation"] === "string" ? out["translation"] : "" };
      }),
    },
  },
});
