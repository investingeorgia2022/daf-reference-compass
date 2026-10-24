import { describe, expect, it } from 'vitest';
import { getVerseSources } from '../talmud/utils/biblicalStudy';

describe('explanations around the selected biblical verse', () => {
  it('connects only Exodus 34:25 sources, not another verse or chapter-wide commentary', () => {
    const links = [
      { ref: 'Rashi on Exodus 34:25:1', anchorRef: 'Exodus 34:25', category: 'Commentary', he: '<b>ולא ילין</b>' },
      { ref: 'Rashi on Exodus 34:24:1', anchorRef: 'Exodus 34:24', he: 'אחר' },
      { ref: 'Chapter discussion', anchorRef: 'Exodus 34', he: 'אחר' },
    ];
    expect(getVerseSources(links, 'Exodus 34:25').map(s => s.ref)).toEqual(['Rashi on Exodus 34:25:1']);
  });
  it('includes linked explanations and Talmud sources whose expanded anchors contain that verse', () => {
    const links = [{ ref: 'Berakhot 2a:8', anchorRef: 'Exodus 34:24-25', anchorRefExpanded: ['Exodus 34:24','Exodus 34:25'], category: 'Talmud', he: ['ולא ילין','עד הבוקר'] }];
    expect(getVerseSources(links, 'Exodus 34:25')).toMatchObject([{ ref: 'Berakhot 2a:8', category: 'Talmud', hebrew: 'ולא ילין\nעד הבוקר' }]);
  });
});