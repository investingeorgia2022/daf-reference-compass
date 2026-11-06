import { createFileRoute } from "@tanstack/react-router";

// App tractate id -> shas.org daf-pdf API slug (per https://www.shas.org/daf-pdf/api/api-documentation.html)
const SHAS_SLUG: Record<string, string> = {
  Berakhot: "berachos", Shabbat: "shabbos", Eruvin: "eruvin", Pesachim: "pesachim",
  Shekalim: "shekalim", Yoma: "yoma", Sukkah: "sukkah", Beitzah: "beitzah",
  Rosh_Hashanah: "rosh-hashanah", Taanit: "taanis", Megillah: "megillah",
  Moed_Katan: "moed-katan", Chagigah: "chagigah", Yevamot: "yevamos", Ketubot: "kesubos",
  Nedarim: "nedarim", Nazir: "nazir", Sotah: "sotah", Gittin: "gittin",
  Kiddushin: "kiddushin", Bava_Kamma: "bava-kamma", Bava_Metzia: "bava-metzia",
  Bava_Batra: "bava-basra", Sanhedrin: "sanhedrin", Makkot: "makkos", Shevuot: "shevuos",
  Avodah_Zarah: "avodah-zarah", Horayot: "horayos", Zevachim: "zevachim",
  Menachot: "menachos", Chullin: "chullin", Bekhorot: "bechoros", Arakhin: "arachin",
  Temurah: "temurah", Keritot: "kereisos", Meilah: "meilah", Tamid: "tamid",
  Niddah: "niddah",
};

export function shasPdfUrl(tractate: string, daf: string): string | null {
  const key = Object.keys(SHAS_SLUG).find((k) => k.toLowerCase() === tractate.trim().toLowerCase());
  const slug = key ? SHAS_SLUG[key] : undefined;
  const m = /^(\d{1,3})([ab])$/i.exec(daf.trim());
  if (!slug || !m) return null;
  return `https://www.shas.org/daf-pdf/api/?masechta=${slug}&daf=${parseInt(m[1] ?? "2", 10)}&amud=${(m[2] ?? "a").toLowerCase()}`;
}

export const Route = createFileRoute("/api/talmud/vilna-pdf")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const tractate = url.searchParams.get("tractate") || "";
        const daf = url.searchParams.get("daf") || "";
        const upstreamUrl = shasPdfUrl(tractate, daf);
        if (!upstreamUrl) return new Response("Unknown tractate or daf", { status: 400 });

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        try {
          const upstream = await fetch(upstreamUrl, {
            signal: controller.signal,
            headers: { Accept: "application/pdf" },
          });
          if (!upstream.ok) return new Response("PDF not found", { status: 404 });
          const buf = await upstream.arrayBuffer();
          const h = new Uint8Array(buf.slice(0, 4));
          if (!(h[0] === 0x25 && h[1] === 0x50 && h[2] === 0x44 && h[3] === 0x46)) {
            return new Response("Invalid PDF", { status: 502 });
          }
          const name = `Vilna-${tractate}-${daf}.pdf`;
          return new Response(buf, {
            headers: {
              "Content-Type": "application/pdf",
              "Cache-Control": "public, max-age=86400, s-maxage=2592000",
              "Content-Disposition": `${url.searchParams.get("download") === "1" ? "attachment" : "inline"}; filename="${name}"`,
              // Source attribution required by the HebrewBooks.org license
              "X-Scan-Source": "shas.org / hebrewbooks.org / Moznaim",
            },
          });
        } catch {
          return new Response("Upstream unavailable", { status: 504 });
        } finally {
          clearTimeout(timer);
        }
      },
    },
  },
});
