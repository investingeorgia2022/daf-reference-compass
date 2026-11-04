import { it } from 'vitest';
import fs from 'fs';
import { extractHotspotsFromTextContent } from '../talmud/components/VilnaPdfInteractiveViewer';
import { decodeLegacyHebrewItems } from '../talmud/utils/legacyHebrewFont';
import { buildDibburHamatchilLinks } from '../talmud/utils/dibburHamatchilMatcher';
it('probe', async () => {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  for (const [f, t, d] of [['/tmp/dh/b.pdf','Bekhorot','36a'],['/tmp/dh/a.pdf','Berakhot','2a']]) {
    const tc = JSON.parse(fs.readFileSync(f.replace('.pdf','.json'),'utf8'));
    const vp = new (pdfjs as any).PageViewport({ viewBox: tc.vb, scale: 1, rotation: 0 });
    const hs = extractHotspotsFromTextContent(decodeLegacyHebrewItems(tc.items as any), vp, false, [], [], [], [], { tractateId: t, dafId: d } as any);
    const { links } = buildDibburHamatchilLinks(hs);
    const byId = new Map(hs.map((h) => [h.id, h]));
    console.log(f, 'links', links.length);
    for (const l of links) console.log(l.commentator, l.dhIds.map(i=>byId.get(i)!.word).join(' '), '=>', l.mainIds.map(i=>byId.get(i)!.word).join(' '));
  }
}, 60000);
