import { it } from 'vitest';
import fs from 'fs';
import { extractHotspotsFromTextContent } from '../talmud/components/VilnaPdfInteractiveViewer';
import { decodeLegacyHebrewItems } from '../talmud/utils/legacyHebrewFont';
import { buildDibburHamatchilLinks } from '../talmud/utils/dibburHamatchilMatcher';
it('probe', async () => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  for (const [f, t, d] of [['/tmp/dh/b.pdf','Bekhorot','36a'],['/tmp/dh/a.pdf','Berakhot','2a']]) {
    const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(f)) }).promise;
    const page = await doc.getPage(1); const vp = page.getViewport({ scale: 1 });
    const tc = await page.getTextContent();
    const hs = extractHotspotsFromTextContent(decodeLegacyHebrewItems(tc.items as any), vp, false, [], [], [], [], { tractateId: t, dafId: d } as any);
    const { links } = buildDibburHamatchilLinks(hs);
    const byId = new Map(hs.map((h) => [h.id, h]));
    console.log(f, 'links', links.length);
    for (const l of links) console.log(l.commentator, l.dhIds.map(i=>byId.get(i)!.word).join(' '), '=>', l.mainIds.map(i=>byId.get(i)!.word).join(' '));
  }
}, 60000);
