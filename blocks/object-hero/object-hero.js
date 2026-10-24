/**
 * Object hero — one still owns the viewport. Type captions.
 * Decorate only. Law lives in CSS.
 */

function classifyCopy(copy) {
  let sawHeading = false;
  [...copy.children].forEach((el) => {
    if (el.tagName === 'H1' || el.tagName === 'H2') {
      sawHeading = true;
      return;
    }
    if (el.tagName === 'P') {
      if (!sawHeading && !el.classList.contains('oh-lede')) {
        el.classList.add('oh-eyebrow');
      } else if (![...el.querySelectorAll('a')].length || el.textContent.trim().length > 48) {
        el.classList.add('oh-lede');
      }
    }
  });
}

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

export default function decorate(block) {
  const rows = [...block.children];
  const pictures = collectPictures(block);
  const copyBits = [];

  rows.forEach((row) => {
    [...row.children].forEach((cell) => {
      if (cell.querySelector('picture, img')) return;
      copyBits.push(...cell.childNodes);
    });
  });

  const stage = document.createElement('div');
  stage.className = 'oh-stage';

  const first = pictures[0];
  if (first) {
    const img = first.querySelector('img');
    if (img) {
      img.setAttribute('fetchpriority', 'high');
      img.loading = 'eager';
      if (!img.alt) {
        img.alt = '';
      }
    }
    stage.append(first);
    stage.setAttribute('role', 'img');
    stage.setAttribute('aria-label', first.querySelector('img')?.alt || 'Object');
  }

  const caption = document.createElement('div');
  caption.className = 'oh-caption';
  if (copyBits.length) {
    caption.append(...copyBits);
    classifyCopy(caption);
  }

  block.replaceChildren(stage, caption);
}
