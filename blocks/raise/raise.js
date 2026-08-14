/**
 * Raise — one chassis, two worlds.
 * Starship (A) is the LCP still. Cube (B) rises through it on native
 * scroll. Not a Dualform hole. Not two heroes. The verb is the site.
 */

function collectPictures(root) {
  if (!root) return [];
  const pictures = [...root.querySelectorAll('picture')];
  root.querySelectorAll('img').forEach((img) => {
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
    if (el.tagName === 'H1' || el.tagName === 'H2') {
      sawHeading = true;
      return;
    }
    if (el.tagName === 'P' && !sawHeading) {
      el.classList.add('raise-eyebrow');
    } else if (el.tagName === 'P') {
      el.classList.add('raise-lede');
    }
  });
}

function copyFrom(cell) {
  const wrap = document.createElement('div');
  wrap.className = 'raise-voice';
  if (cell) wrap.append(...cell.childNodes);
  classifyCopy(wrap);
  return wrap;
}

export default function decorate(block) {
  const rows = [...block.children];
  const first = rows[0];
  const second = rows[1];

  const artCells = first ? [...first.children] : [];
  const copyCells = second ? [...second.children] : [];

  let pictures = collectPictures(first);
  if (pictures.length < 2 && artCells.length >= 2) {
    pictures = [
      ...collectPictures(artCells[0]),
      ...collectPictures(artCells[1]),
    ];
  }

  const stage = document.createElement('div');
  stage.className = 'raise-stage';
  const altB = pictures[1]?.querySelector('img')?.alt || '';
  const altA = pictures[0]?.querySelector('img')?.alt || 'Chassis';
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', altB ? `${altA} becomes ${altB}` : altA);

  pictures.slice(0, 2).forEach((pic, i) => {
    const layer = document.createElement('div');
    layer.className = i === 0 ? 'raise-layer raise-a' : 'raise-layer raise-b';
    const img = pic.querySelector('img');
    if (img && i === 0) {
      img.setAttribute('fetchpriority', 'high');
      img.loading = 'eager';
    } else if (img) {
      img.loading = 'lazy';
    }
    layer.append(pic);
    stage.append(layer);
  });

  const caption = document.createElement('div');
  caption.className = 'raise-caption';

  const fromCell = copyCells[0] || (!pictures.length ? artCells[0] : null);
  const toCell = copyCells[1] || null;

  const from = copyFrom(fromCell);
  from.classList.add('raise-from');
  caption.append(from);

  if (toCell) {
    const to = copyFrom(toCell);
    to.classList.add('raise-to');
    caption.append(to);
  }

  if (pictures.length < 2) {
    block.classList.add('raise-still');
  }

  block.replaceChildren(stage, caption);
}
