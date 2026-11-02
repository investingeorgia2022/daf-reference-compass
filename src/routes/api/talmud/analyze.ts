import { createFileRoute } from "@tanstack/react-router";
import { askJson, jsonAiHandler, str } from "@/server/talmudAi";

export const Route = createFileRoute("/api/talmud/analyze")({
  server: {
    handlers: {
      POST: jsonAiHandler("lite", (b, ctx) =>
        askJson(
          "Analyze the selected word inside its Talmud sentence. Translate precisely, explain grammar and its role in the sugya.",
          `{"wordTranslationHebrew":"","wordTranslationGeorgian":"","wordTransliterationGeorgian":"","wordRootAndGrammar":"","wordExplanationGeorgian":"","wordExplanationHebrew":"","sentenceTranslationHebrew":"","sentenceTranslationGeorgian":"","sentenceExplanationGeorgian":"","sentenceExplanationHebrew":"","sugyaRole":""}`,
          {
            word: str(b.word, 200),
            sentence: str(b.sentence),
            sourceType: str(b.sourceType, 40),
            tractate: str(b.tractate, 100),
            daf: str(b.daf, 20),
          }, ctx),
      ),
    },
  },
});
