import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// The Talmud app uses browser-only APIs (pdf.js, canvas, localStorage) at import time,
// so it is loaded only in the browser.
const TalmudApp = lazy(() => import("@/talmud/TalmudEntry"));

const TITLE = "Talmud Bavli 3D — თალმუდ ბაბლი";
const DESC =
  "ინტერაქტიული თალმუდ ბაბლი კლასიკური ვილნის გვერდის სტრუქტურით (צורת הדף), ქართულ-ებრაული თარგმანით, რაშისა და თოსაფოთის კომენტარებით.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background text-foreground" role="status">
      <Loader2 className="size-6 animate-spin motion-reduce:animate-none text-primary" aria-hidden="true" />
      <span className="text-sm">იტვირთება… טוען</span>
    </div>
  );
}

function Index() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <TalmudApp />
      </Suspense>
    </ClientOnly>
  );
}
