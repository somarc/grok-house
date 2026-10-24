/**
 * Dualform hero — paired silhouette cutouts + CSS mask superimposition.
 * Morphing soft hole reveals expression (B) through substrate (A).
 *
 * Desktop: pointer over stage.
 * Mobile: touch-drag on stage + scroll-linked drift while stage is in view
 * (Norris-like PE without hover).
 */

function classifyCopy(copy) {
  let sawHeading = false;
  [...copy.children].forEach((el) => {
    if (el.tagName === 'H1' || el.tagName === 'H2') {
      sawHeading = true;
      return;
    }
    if (el.tagName === 'P') {
      if (!sawHeading && !el.classList.contains('df-lede')) {
        el.classList.add('df-eyebrow');
      } else {
        el.classList.add('df-lede');
      }
    }
  });
}

function splitCopyAndArt(block) {
  const rows = [...block.children];
  if (!rows.length) return { copyCell: null, artCell: null };

  const firstRow = rows[0];
  const cols = [...firstRow.children];

  if (cols.length >= 2) {
    return { copyCell: cols[0], artCell: cols[1] };
  }

  if (rows.length >= 2) {
    const copyCell = rows[0].querySelector(':scope > div') || rows[0];
    const artCell = rows[1].querySelector(':scope > div') || rows[1];
    return { copyCell, artCell };
  }

  return { copyCell: cols[0] || firstRow, artCell: null };
}

function collectPictures(artCell) {
  if (!artCell) return [];
  const pictures = [...artCell.querySelectorAll('picture')];
  artCell.querySelectorAll('img').forEach((img) => {
    if (!img.closest('picture')) {
      const pic = document.createElement('picture');
      pic.append(img);
      pictures.push(pic);
    }
  });
  return pictures;
}

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function clamp(n, lo, hi) {
  return Math.min(hi, Math.max(lo, n));
}

function setHole(stage, {
  mx, my, rx, ry, soft, angle,
}) {
  stage.style.setProperty('--df-mx', `${(mx * 100).toFixed(2)}%`);
  stage.style.setProperty('--df-my', `${(my * 100).toFixed(2)}%`);
  stage.style.setProperty('--df-rx', `${rx.toFixed(2)}%`);
  stage.style.setProperty('--df-ry', `${ry.toFixed(2)}%`);
  stage.style.setProperty('--df-soft', soft.toFixed(3));
  stage.style.setProperty('--df-angle', `${angle.toFixed(1)}deg`);
}

function defaultHole(stage) {
  setHole(stage, {
    mx: 0.52,
    my: 0.48,
    rx: 52,
    ry: 44,
    soft: 0.58,
    angle: -12,
  });
}

/**
 * Drive morphing hole from client coordinates relative to stage.
 */
function applyPointer(stage, state, clientX, clientY, timeStamp) {
  const rect = stage.getBoundingClientRect();
  if (rect.width < 1 || rect.height < 1) return;

  const rawX = (clientX - rect.left) / rect.width;
  const rawY = (clientY - rect.top) / rect.height;
  const tx = clamp(rawX, -0.05, 1.05);
  const ty = clamp(rawY, -0.05, 1.05);

  let vx = 0;
  let vy = 0;
  if (state.prevX !== null && timeStamp > state.prevT) {
    const dt = Math.max(8, timeStamp - state.prevT);
    vx = ((clientX - state.prevX) / rect.width) / dt;
    vy = ((clientY - state.prevY) / rect.height) / dt;
  }
  state.prevX = clientX;
  state.prevY = clientY;
  state.prevT = timeStamp;

  const speed = Math.hypot(vx, vy) * 1000;
  const speedClamped = clamp(speed, 0, 2.5);
  const bloom = 1 + speedClamped * 0.35;
  const stretch = clamp(speedClamped * 0.55, 0, 0.85);
  const ang = Math.atan2(vy, vx) * (180 / Math.PI);
  const ax = Math.abs(vx);
  const ay = Math.abs(vy);
  const denom = ax + ay + 0.0001;
  const hx = ax / denom;
  const hy = ay / denom;

  const targetRx = clamp((44 + hx * stretch * 38) * bloom, 30, 82);
  const targetRy = clamp((38 + hy * stretch * 38) * bloom, 26, 76);
  const targetSoft = clamp(0.44 + speedClamped * 0.18, 0.4, 0.8);
  const targetAngle = Number.isFinite(ang) ? ang * 0.35 : state.sangle;

  const k = 0.28;
  state.smx += (tx - state.smx) * k;
  state.smy += (ty - state.smy) * k;
  state.srx += (targetRx - state.srx) * 0.22;
  state.sry += (targetRy - state.sry) * 0.22;
  state.ssoft += (targetSoft - state.ssoft) * 0.18;
  state.sangle += (targetAngle - state.sangle) * 0.14;

  setHole(stage, {
    mx: state.smx,
    my: state.smy,
    rx: state.srx,
    ry: state.sry,
    soft: state.ssoft,
    angle: state.sangle,
  });
}

/**
 * Mobile / no-hover: drift the hole as the stage scrolls through the viewport
 * so dual-state is not static without a finger on the art.
 */
function applyScrollDrift(stage, state) {
  const rect = stage.getBoundingClientRect();
  const vh = window.innerHeight || 1;
  // 0 = stage below fold, 1 = stage above fold
  const center = (rect.top + rect.height * 0.5) / vh;
  const progress = clamp(1 - center, 0, 1);

  const tx = 0.32 + progress * 0.4;
  const ty = 0.28 + progress * 0.42;
  const targetRx = 46 + progress * 22;
  const targetRy = 40 + progress * 18;
  const targetSoft = 0.5 + progress * 0.12;

  const k = 0.12;
  state.smx += (tx - state.smx) * k;
  state.smy += (ty - state.smy) * k;
  state.srx += (targetRx - state.srx) * k;
  state.sry += (targetRy - state.sry) * k;
  state.ssoft += (targetSoft - state.ssoft) * k;

  setHole(stage, {
    mx: state.smx,
    my: state.smy,
    rx: state.srx,
    ry: state.sry,
    soft: state.ssoft,
    angle: state.sangle,
  });
}

function setupMorphingHole(stage) {
  defaultHole(stage);

  if (prefersReducedMotion()) {
    stage.classList.add('df-static-mask');
    return;
  }

  stage.classList.add('df-pointer-mask');
  stage.style.touchAction = 'pan-y';
  stage.style.cursor = 'crosshair';

  const state = {
    prevX: null,
    prevY: null,
    prevT: 0,
    smx: 0.52,
    smy: 0.48,
    srx: 52,
    sry: 44,
    ssoft: 0.58,
    sangle: -12,
    activePointer: false,
    pointerId: null,
  };

  let raf = 0;
  let pending = null;
  let scrollQueued = false;

  const flushPointer = () => {
    raf = 0;
    if (!pending) return;
    const t = pending.timeStamp || performance.now();
    applyPointer(stage, state, pending.clientX, pending.clientY, t);
    pending = null;
  };

  const onPointerMove = (e) => {
    // When capturing on stage, or any move while active; else desktop hover over stage
    if (state.activePointer && state.pointerId !== null && e.pointerId !== state.pointerId) {
      return;
    }
    if (!state.activePointer) {
      // Hover path (fine pointer): only when over stage
      const rect = stage.getBoundingClientRect();
      const over = e.clientX >= rect.left && e.clientX <= rect.right
        && e.clientY >= rect.top && e.clientY <= rect.bottom;
      if (!over) return;
    }
    pending = e;
    if (!raf) raf = window.requestAnimationFrame(flushPointer);
  };

  const onPointerDown = (e) => {
    state.activePointer = true;
    state.pointerId = e.pointerId;
    state.prevX = null;
    try {
      stage.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    pending = e;
    if (!raf) raf = window.requestAnimationFrame(flushPointer);
  };

  const onPointerUp = (e) => {
    if (state.pointerId !== null && e.pointerId !== state.pointerId) return;
    state.activePointer = false;
    state.pointerId = null;
    state.prevX = null;
    try {
      stage.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  stage.addEventListener('pointerdown', onPointerDown, { passive: true });
  stage.addEventListener('pointermove', onPointerMove, { passive: true });
  stage.addEventListener('pointerup', onPointerUp, { passive: true });
  stage.addEventListener('pointercancel', onPointerUp, { passive: true });
  // Desktop hover without press
  window.addEventListener('pointermove', onPointerMove, { passive: true });

  // Scroll-linked drift when not actively dragging (mobile + desktop)
  const onScroll = () => {
    if (state.activePointer) return;
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      scrollQueued = false;
      applyScrollDrift(stage, state);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  // Initial drift for load position
  applyScrollDrift(stage, state);
}

export default function decorate(block) {
  const { copyCell, artCell } = splitCopyAndArt(block);
  const pictures = collectPictures(artCell);

  const inner = document.createElement('div');
  inner.className = 'df-inner';

  const copy = document.createElement('div');
  copy.className = 'df-copy';
  if (copyCell) {
    copy.append(...copyCell.childNodes);
    classifyCopy(copy);
  }

  const stage = document.createElement('div');
  stage.className = 'df-stage';
  stage.setAttribute('role', 'img');
  stage.setAttribute(
    'aria-label',
    pictures[1]?.querySelector('img')?.alt
      || pictures[0]?.querySelector('img')?.alt
      || 'Dual-state form composite',
  );

  pictures.slice(0, 2).forEach((pic, i) => {
    const layer = document.createElement('div');
    layer.className = `df-layer ${i === 0 ? 'df-a' : 'df-b'}`;
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

  inner.append(copy, stage);
  block.replaceChildren(inner);

  if (!block.classList.contains('static')) {
    setupMorphingHole(stage);
  } else {
    stage.classList.add('df-static-mask');
    defaultHole(stage);
  }
}
