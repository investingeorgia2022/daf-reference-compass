import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#1A130D", color: "#E8D9B5", fontFamily: "'Noto Sans Georgian', sans-serif" }}>
      იტვირთება… טוען
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
