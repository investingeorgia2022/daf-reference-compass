import { createFileRoute } from "@tanstack/react-router";
import { askJson, jsonAiHandler, str } from "@/server/talmudAi";

export const Route = createFileRoute("/api/talmud/ai-navigate")({
  server: {
    handlers: {
      POST: jsonAiHandler("lite", (b, ctx) =>
        askJson(
          "The user (often in Georgian) describes a place in Jewish sacred texts. Find the single best exact location.",
          `{"realmId":"talmud|tanakh|mishnah|rambam|shulchan-aruch|tur","tractateId":"Sefaria id e.g. Berakhot","dafId":"e.g. 2a","bookId":"Sefaria book id for non-talmud","chapter":1,"section":"daf-section-gemara|daf-section-mishnah|daf-section-rashi|daf-section-tosafot","sectionLabelKa":"string","titleHe":"string","titleKa":"string","explanationKa":"string","quotedSnippetHe":"string","relatedLocations":[]}`,
          { query: str(b.query, 1000), scope: str(b.scope, 40) }, ctx),
      ),
    },
  },
});
