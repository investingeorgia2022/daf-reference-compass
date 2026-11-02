import { createFileRoute } from "@tanstack/react-router";
import { askJson, jsonAiHandler, str } from "@/server/talmudAi";

export const Route = createFileRoute("/api/talmud/chavruta")({
  server: {
    handlers: {
      POST: jsonAiHandler("balanced", async (b, ctx) => {
        const lang = str(b.language, 5) === "he" ? "Hebrew" : "Georgian";
        const out = await askJson(
          `Act as a warm, knowledgeable chavruta (study partner). Answer the question about this daf in ${lang}, grounded in the excerpt.`,
          `{"reply":"string"}`,
          {
            question: str(b.question, 1000),
            tractate: `${str(b.tractateHebrew, 100)} / ${str(b.tractateGeorgian, 100)}`,
            daf: str(b.daf, 20),
            dafExcerpt: str(b.dafExcerpt, 5000),
          }, ctx);
        return { reply: typeof out["reply"] === "string" ? out["reply"] : "" };
      }),
    },
  },
});
