<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The imported Talmud app lives in src/talmud and is loaded browser-only from src/routes/index.tsx (it uses browser APIs at import time); its files carry @ts-nocheck because they predate this strict tsconfig.

- Talmud AI features are server routes under src/routes/api/talmud/* sharing src/server/talmudAi.ts (Lovable AI Gateway SDK); keeps prompts and keys server-side and matches the URLs the imported app already calls.

- Vilna marker classification belongs in referenceMarkerDetector; canvas and PDF extraction share it to avoid divergent recognition rules.
- PDF bare-letter recognition requires baseline evidence; preserve separate adjacent indices and mirrored Torah Or entry numbers to avoid false positives and incorrect quotation targets.
- Torah Or destinations use torahOrNavigation's verified type/key/side lookup and printed ordinal, never heading or synthetic fallbacks; this makes exact quotation navigation independently testable.
- Study-center tools use one searchable selector and one shared window-control scope; dedication dialogs sit above reading controls to avoid mobile overlap.
- PDF marker navigation owns vertical scrolling through scrollToTarget after zoom settles; focus events marked scrollHandled only change zoom/pan to prevent competing scrolls.
- Use PDF.js legacy browser build with its matching worker; it supplies missing browser primitives needed to render scans on older mobile browsers.
- Vilna PDF margin vs main-text zones are found per scan by vilnaColumnGutters (blank gutters), not fixed percentages; scans are printed at different scales.
- PDF marker touch boxes are partitioned by printed glyph boundaries; Gilyon notes resolve by source section, so adjacent links and distinct notes stay independent.
- Biblical PDF citations use a separate verse window and chapter/verse parser; chapter-only citations resolve by unique quotation evidence, never a guessed verse.
- Biblical study sources are filtered by verified verse anchors in biblicalStudy; the verse window reuses the existing translator and keeps source texts separate from generated translations.
- PDF reference-origin labels follow measured target coordinates in a body portal so zoom never shrinks labels or hides them in a clipped margin.
- App preferences hydrate through appPreferences and offline backup imports validate the entire payload before a transaction, preserving saved choices and valid cached pages.
- Shared reading chrome uses global semantic study tokens; MotionConfig and page flips respect reduced-motion preferences.
- Source archives exclude dependencies, build output, private configuration and nested export archives; complete project archives add public assets only.
- Rashi/Tosafot dibbur-hamatchil openings are detected in dibburHamatchilMatcher: punctuation alone bounds them (stream start or after ":" until "."/וכו׳, across line breaks); the commentator comes from vilnaCommentaryStreams, never from page side, column or territory; one-word openings link; an opening without its closing "." is dropped and the quotation must start at its first word. Abbreviations align on either side (ר'↔רבי, אדר"מ↔אדר' מאיר) using quoteAfter from separate quote runs. Canvas ink tint and taps share its roles so colours and navigation never diverge.
- A user-supplied Gemini key (device-local, sent as x-gemini-* headers by a fetch patch) routes /api/talmud/* AI through src/server/geminiRouter tiers with Flash fallback; without it the Lovable AI Gateway is used, so users can avoid project credits.
- Row bucketing never moves runs between Rashi, Tosafot and main text; at the page top the columns touch, and absorbing them mixes texts and breaks matching.
- Mac-Hebrew lost-נ repair (legacyHebrewFont) is per font: control-code נ fonts keep spaces as gaps; space-healing never glues after a final letter or beside a quote mark.
- Gemara↔commentary linking is word-level: Rashi links first, then Tosafot; each commentator claims main words independently (never reusing its own claims, so repeated phrases bind to the next free occurrence), Tosafot וכו׳ starting at a Rashi start extends to Rashi's span, words never match by substituting letters (distinct words collided), and any reference marker inside a quotation is transparent.
- Gilyon HaShas markers resolve chronologically (n-th marker → n-th ":"-terminated note); Torah Or entries span from their printed number to the next number so verse and source highlight together.
- Gemara/Rashi/Tosafot identity is decided by vilnaCommentaryStreams from the scan's content-stream order: Gemara by its body type size; the commentary stream splits once, at Tosafot's enlarged initial (or the stream's restart at the page top before it); page position or column never assigns a commentator.
- Zoomed PDF views re-render only the visible page area into PdfSharpZoomTile at screen resolution; mobile canvases cannot hold a whole page at 10x.
- Scan text repair lives in legacyHebrewFont: control-code נ is restored in every Hebrew run, and fonts whose items include standalone nikud glyphs are decoded as the Latin-encoded vowelled verse font; otherwise Torah Or verses and Mishnah words vanish from matching.
- Daf search (dafSearch + DafSearchPanel) reuses the DH matcher's wordsMatch/abbreviationSpan and the DH glow/scroll path, so search, links and abbreviations follow one set of rules.
- PDF focus/search ink masks use PdfInkHighlight and pdfInkMask over base or visible sharp-tile pixels; small transparent glyph canvases preserve paper, navigation, and mobile memory limits.
- PDF runs whose glyphs touch with letters on both sides are one word (splitWordRuns); split fragments otherwise break tinting and selection.
- The bottom dock never auto-hides; it only folds to the search globe by swipe, so the daf keeps a fixed bottom buffer.
- Gemara→commentary DH jumps snapshot zoom/pan/scroll via talmud-view-snapshot; the matching return jump restores it via talmud-view-restore.
