/**
 * Cinematic full-bleed hero.
 * Authoring: optional video link row, optional poster img row, then copy.
 */
export default function decorate(block) {
  const rows = [...block.children];

  let videoSrc = null;
  let posterImg = null;

  rows.forEach((row) => {
    if (!videoSrc) {
      const a = row.querySelector('a[href]');
      if (a && /\.(mp4|webm|ogg)(\?|#|$)/i.test(a.href)) {
        videoSrc = a.href;
        row.remove();
        return;
      }
    }

    if (!posterImg) {
      const img = row.querySelector('img');
      const onlyMedia = img && !row.querySelector('h1, h2, h3, h4, h5, h6, a.button');
      if (onlyMedia) {
        posterImg = img;
        row.remove();
      }
    }
  });

  const content = document.createElement('div');
  content.className = 'video-hero-content';
  [...block.children].forEach((row) => {
    [...row.children].forEach((cell) => {
      while (cell.firstChild) content.appendChild(cell.firstChild);
    });
  });

  block.innerHTML = '';

  if (posterImg) {
    const poster = document.createElement('div');
    poster.className = 'video-hero-poster';
    poster.setAttribute('aria-hidden', 'true');
    posterImg.removeAttribute('loading');
    posterImg.fetchPriority = 'high';
    posterImg.decoding = 'async';
    posterImg.alt = posterImg.alt || '';
    poster.appendChild(posterImg);
    block.appendChild(poster);
    block.classList.add('has-poster');
  }

  if (videoSrc) {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('playsinline', '');
    if (posterImg?.src) video.poster = posterImg.src;
    const source = document.createElement('source');
    source.src = videoSrc;
    source.type = videoSrc.includes('.webm') ? 'video/webm' : 'video/mp4';
    video.appendChild(source);
    block.appendChild(video);
    block.classList.add('has-video');
  }

  block.appendChild(content);
  block.classList.add('is-cinematic');
}
