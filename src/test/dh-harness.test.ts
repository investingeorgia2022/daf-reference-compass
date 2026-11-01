import { it } from 'vitest';
import fs from 'node:fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { extractHotspotsFromTextContent } from '../talmud/components/VilnaPdfInteractiveViewer';
import { buildDibburHamatchilLinks } from '../talmud/utils/dibburHamatchilMatcher';
it('dump', async () => {
  const file = process.env.DH_PDF || 'public/vilna-pdf/Berakhot-2a.pdf';
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(fs.readFileSync(file)) }).promise;
  const page = await doc.getPage(1);
  const vp = page.getViewport({ scale: 1 });
  const tc = await page.getTextContent();
  const hs = extractHotspotsFromTextContent(tc.items as any, vp as any, file.includes('b.pdf'), [], [], [], [], { tractateId: 'Berakhot', dafId: '2a' } as any);
  const { links } = buildDibburHamatchilLinks(hs as any);
  const byId = new Map(hs.map((h) => [h.id, h]));
  const out = links.map((l) => `${l.commentator}: [${l.dhIds.map((i) => byId.get(i)!.word).join(' ')}] -> [${l.mainIds.map((i) => byId.get(i)!.word).join(' ')}]`);
  const big = hs.filter((h: any) => /מאימתי/.test(h.word)).map((h: any) => `${h.word} ${h.section} ${h.pdfFont||''} L${h.leftPct.toFixed(1)} T${h.topPct.toFixed(1)}`);
  fs.writeFileSync('/tmp/dh/out.txt', [...big, '---', ...out].join('\n'));
}, 60000);
