# Talmud Bavli — თალმუდ ბაბლი

React 19 / TanStack Start application with a classic Vilna PDF reader, Georgian and Hebrew study tools, exact reference navigation, verse commentary windows, and an IndexedDB offline library.

## Run locally

Install Bun and a current Node.js LTS, extract the **full project** ZIP, then run:

```sh
bun install
bun run dev --host 0.0.0.0 --port 8080
```

Open http://localhost:8080. The source-only ZIP omits `public/`; use the full project for PDF workers' support assets, fonts, icons and bundled prayer PDFs.

```sh
bun run test
bun run build
```

The build uses the project's TanStack/Cloudflare adapter. The code export is source, not a compiled APK or a prebuilt deployment.

## Services and portability

Sefaria supplies source texts and commentaries; network access is required for pages not yet cached. Browser translation and web fonts also require their respective providers. Saved study preferences, notes and offline pages remain in the browser; they are not included in these exports.

AI routes use `@lovable.dev/ai-gateway` in `src/server/talmudAi.ts`. Gateway credentials are provided by the Lovable environment and are intentionally **not exported**. On another host, configure supported Gateway credentials or replace this adapter; AI and voice features are not standalone offline functionality. Never put private credentials into client code.

## Review completed 2026-10-25

- Reader opens immediately; the optional 3D globe remains available from navigation.
- Reference destinations show their originating type and printed marker in a zoom-independent label.
- Shared reading chrome uses semantic theme tokens; settings fit the dynamic viewport and support keyboard dismissal.
- Saved currency, language, nikud and other settings survive reload; restricted storage does not break main persistence effects.
- Offline imports validate identities, versions and duplicates before writing; translated pack resumes do not skip untranslated pages.
- Page motion respects reduced-motion preferences; service-worker navigation handles missing offline shells and avoids caching app API answers.
- Nonexistent APK downloads removed; source and project downloads are actual archived files.

Validation: 64 regression tests; desktop and phone reader, reference navigation and settings checks. This review is not an exhaustive check of every source, external service, study tool, or deployed AI route. Remaining audit candidates include browser Back/Forward synchronization of in-app page changes and asynchronous return-position restoration under slow network conditions.

## Archive contents

Both archives exclude Git metadata, dependencies, generated output, local environment files and private workspace metadata. The complete project adds `public/` assets; nested export ZIPs are excluded to prevent recursive packaging.
