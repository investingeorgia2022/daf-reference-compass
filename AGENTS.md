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
- PDF marker navigation owns vertical scrolling through scrollToTarget after zoom settles; focus events marked scrollHandled only change zoom/pan to prevent competing scrolls.
- Use PDF.js legacy browser build with its matching worker; it supplies missing browser primitives needed to render scans on older mobile browsers.
- Vilna PDF margin vs main-text zones are found per scan by vilnaColumnGutters (blank gutters), not fixed percentages; scans are printed at different scales.
