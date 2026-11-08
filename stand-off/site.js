// Stand Off: Enchanted — small enhancements. Everything works as plain links without this file.

// Trailers: each preview is a link to YouTube. With JavaScript, pressing it swaps the preview for the
// privacy-enhanced player instead, so nothing loads from YouTube until a visitor asks for it.
document.querySelectorAll('a[data-video]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) return; // new tab: let it open
    event.preventDefault();
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${link.dataset.video}?autoplay=1&rel=0`;
    frame.title = link.dataset.title || 'Trailer';
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    // The link becomes a plain frame holding the player, so focus and screen readers land on the video.
    const holder = document.createElement('div');
    holder.className = 'trailer-frame';
    holder.appendChild(frame);
    link.replaceWith(holder);
    frame.focus();
  });
});

// Screenshots: each thumbnail links to the full-size image. With <dialog> support it opens in a viewer
// on the page; Escape, the close button or a click outside closes it, and focus returns to the thumbnail.
const viewer = document.querySelector('.viewer');
if (viewer && typeof viewer.showModal === 'function') {
  const image = viewer.querySelector('img');
  let opener = null;
  document.querySelectorAll('.gallery a').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) return;
      event.preventDefault();
      opener = link;
      const thumb = link.querySelector('img');
      image.src = link.href;
      image.alt = thumb ? thumb.alt : '';
      viewer.showModal();
    });
  });
  viewer.querySelector('.viewer-close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('click', (event) => { if (event.target === viewer) viewer.close(); });
  viewer.addEventListener('close', () => {
    image.removeAttribute('src');
    if (opener) opener.focus();
  });
}
