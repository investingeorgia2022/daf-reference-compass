import { createFileRoute } from "@tanstack/react-router";
import { askJson, jsonAiHandler, str } from "@/server/talmudAi";

export const Route = createFileRoute("/api/talmud/mishnah-guide")({
  server: {
    handlers: {
      POST: jsonAiHandler("complex", async (b, ctx) => {
        const raw = (b as { mishnayot?: unknown }).mishnayot;
        const list = Array.isArray(raw) ? raw.slice(0, 30).map((x) => str(x, 3000)) : [];
        if (!list.length) return { items: [] };
        const out = await askJson(
          "For each Mishnah (Hebrew original, in order) give: a faithful fluent Georgian translation; the names of the Tannaim/sages mentioned in Hebrew (or the group, e.g. חכמים, כהנים); a concise but deep Georgian halakhic and conceptual explanation (3-6 sentences). Never invent sources.",
          `{"items":[{"translationKa":"string","sagesHe":"string","explanationKa":"string"}]}`,
          { tractate: str(b.tractate, 100), chapter: str(b.daf, 20), mishnayot: list }, ctx);
        const items = Array.isArray(out["items"]) ? out["items"] : [];
        return { items };
      }),
    },
  },
});
