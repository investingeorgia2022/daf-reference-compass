import { createFileRoute } from "@tanstack/react-router";
import { askJson, jsonAiHandler, str } from "@/server/talmudAi";

const SOURCE = `{"realmId":"talmud|tanakh|mishnah|rambam|shulchan-aruch","bookId":"Sefaria-style book id for non-talmud, e.g. Genesis","chapter":1,"tractateId":"Sefaria tractate id e.g. Berakhot","dafId":"e.g. 2a","section":"daf-section-gemara","labelKa":"Georgian label","labelHe":"Hebrew label","quoteHe":"short Hebrew quote","explanationKa":"Georgian explanation"}`;

export const Route = createFileRoute("/api/talmud/ask-gemini")({
  server: {
    handlers: {
      POST: jsonAiHandler("complex", (b, ctx) =>
        askJson(
          "Answer the user's Jewish-law / Talmud question in Georgian, with real cited sources (max 5).",
          `{"answerKa":"string","summaryHe":"string","keyPointsKa":["string"],"halachaTakeawayKa":"string","sources":[${SOURCE}]}`,
          { question: str(b.question, 1000), scope: str(b.scope, 40) }, ctx),
      ),
    },
  },
});
