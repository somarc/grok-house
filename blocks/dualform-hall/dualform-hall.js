/**
 * Dualform hall — same silhouette, many liveries.
 * Norris helmet-hall analog: hover/focus remaps B over A.
 * Authoring: one row per livery. Copy cell, then art cell with A then B.
 */

function collectPictures(cell) {
  if (!cell) return [];
  const pictures = [...cell.querySelectorAll('picture')];
  cell.querySelectorAll('img').forEach((img) => {
    if (!img.closest('picture')) {
      const pic = document.createElement('picture');
      pic.append(img);
      pictures.push(pic);
    }
  });
  return pictures;
}

function classifyCopy(copy) {
  let sawHeading = false;
  [...copy.children].forEach((el) => {
    if (el.tagName === 'H2' || el.tagName === 'H3') {
      sawHeading = true;
      return;
    }
    if (el.tagName === 'P' && !sawHeading) {
      el.classList.add('dfh-label');
    }
  });
}

function decorateItem(row) {
  const cols = [...row.children];
  const copyCell = cols[0] || row;
  const artCell = cols[1] || null;
  const pictures = collectPictures(artCell);

  const item = document.createElement('article');
  item.className = 'dfh-item';

  const copy = document.createElement('div');
  copy.className = 'dfh-copy';
  copy.append(...copyCell.childNodes);
  classifyCopy(copy);

  const stage = document.createElement('div');
  stage.className = 'dfh-stage';
  stage.setAttribute('role', 'img');
  const alt = pictures[1]?.querySelector('img')?.alt
    || pictures[0]?.querySelector('img')?.alt
    || 'Same form, later livery';
  stage.setAttribute('aria-label', alt);

  pictures.slice(0, 2).forEach((pic, i) => {
    const layer = document.createElement('div');
    layer.className = `dfh-layer ${i === 0 ? 'dfh-a' : 'dfh-b'}`;
    const img = pic.querySelector('img');
    if (img) img.loading = 'lazy';
    layer.append(pic);
    stage.append(layer);
  });

  item.append(copy, stage);
  return item;
}

export default function decorate(block) {
  const list = document.createElement('div');
  list.className = 'dfh-list';
  [...block.children].forEach((row) => {
    list.append(decorateItem(row));
  });
  block.replaceChildren(list);
}
