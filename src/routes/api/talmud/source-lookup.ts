import { createFileRoute } from "@tanstack/react-router";
import { askJson, jsonAiHandler, str } from "@/server/talmudAi";

export const Route = createFileRoute("/api/talmud/source-lookup")({
  server: {
    handlers: {
      POST: jsonAiHandler("deep", (b, ctx) =>
        askJson(
          "The selected word/phrase is a quotation or reference (e.g. a verse). Identify its exact original source and explain how the Talmud uses it.",
          `{"sourceCategoryHe":"","sourceCategoryKa":"","citationHe":"","citationKa":"","fullOriginalTextHe":"","fullTextTranslationHe":"","fullTextTranslationKa":"","contextAndDerashaKa":"","contextAndDerashaHe":"","parallelRefs":["string"]}`,
          { word: str(b.word, 200), sentence: str(b.sentence), tractate: str(b.tractate, 100), daf: str(b.daf, 20) }, ctx),
      ),
    },
  },
});
