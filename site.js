// StandOff: Enchanted: small enhancements. Everything works as plain links without this file.

// Click tracking, ready for a cookie-free counter and silent without one. track() hands an event to whichever of
// GoatCounter, Plausible or Umami the page loads (none does yet: Cloudflare Web Analytics, which counts visits, has
// no events). Events: a Google Play button pressed (play/<where>: header, hero, gameplay, final), the gameplay video
// played with sound, a trailer opened (trailer/<YouTube id>), and the gameplay and final sections reached once a visit.
function track(name, label) {
  const path = label ? `${name}/${label}` : name;
  try {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path, title: path, event: true });
    else if (window.plausible) window.plausible(name, label ? { props: { where: label } } : undefined);
    else if (window.umami && window.umami.track) window.umami.track(name, label ? { where: label } : undefined);
  } catch (error) { /* a blocked or missing counter never breaks the page */ }
}
document.querySelectorAll('[data-cta]').forEach((link) => link.addEventListener('click', () => track('play', link.dataset.cta)));
document.querySelectorAll('a[data-video]').forEach((link) => link.addEventListener('click', () => track('trailer', link.dataset.video)));
if ('IntersectionObserver' in window) {
  [['#gameplay', 'reached-gameplay'], ['#join', 'reached-final']].forEach(([selector, name]) => {
    const section = document.querySelector(selector);
    if (!section) return;
    const seen = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) { track(name); seen.disconnect(); }
    }, { rootMargin: '0px 0px -50% 0px' });   // its top has passed the middle of the screen (it can be taller than one)
    seen.observe(section);
  });
}

// Trailers: each preview is a link to YouTube. With JavaScript, pressing it opens the privacy-enhanced player
// large, in a viewer over the page (Escape, the close button or a click outside closes it and stops the video);
// without <dialog> support the preview is swapped for the player in place. Nothing loads from YouTube until a
// visitor asks for it.
const player = document.querySelector('.video-viewer');
const playerFrame = (link) => {
  const frame = document.createElement('iframe');
  frame.src = `https://www.youtube-nocookie.com/embed/${link.dataset.video}?autoplay=1&rel=0`;
  frame.title = link.dataset.title || 'Trailer';
  frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  frame.allowFullscreen = true;
  frame.referrerPolicy = 'strict-origin-when-cross-origin';
  return frame;
};
if (player && typeof player.showModal === 'function') {
  const box = player.querySelector('.video-box');
  let opener = null;
  player.querySelector('.viewer-close').addEventListener('click', () => player.close());
  player.addEventListener('click', (event) => { if (event.target === player) player.close(); });
  player.addEventListener('close', () => {
    box.replaceChildren();          // stops the video
    if (opener) opener.focus();
  });
  document.querySelectorAll('a[data-video]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.button === 1) return; // new tab: let it open
      event.preventDefault();
      opener = link;
      player.setAttribute('aria-label', link.dataset.title || 'Video');
      const frame = playerFrame(link);
      box.replaceChildren(frame);
      player.showModal();
      // Focus on the close button, not inside the player: a key pressed inside YouTube's frame never reaches the
      // page, so Escape could not close the viewer.
      player.querySelector('.viewer-close').focus();
    });
  });
} else document.querySelectorAll('a[data-video]').forEach((link) => {
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

// Duelists: each emblem is a still picture (light to load). Hovering, focusing or tapping a card swaps in its
// animated version, as the emblem moves in the game; leaving puts the still back. Never under reduced motion.
const calm = window.matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('.duelist').forEach((card) => {
  const image = card.querySelector('img[data-motion]');
  if (!image) return;
  const still = image.getAttribute('src');
  const play = () => { if (!calm.matches) { image.src = image.dataset.motion; card.classList.add('playing'); } };
  const stop = () => { image.src = still; card.classList.remove('playing'); };
  // A mouse hovers; a finger taps to start and taps again to stop; the keyboard focuses.
  card.addEventListener('pointerenter', (event) => { if (event.pointerType === 'mouse') play(); });
  card.addEventListener('pointerleave', (event) => { if (event.pointerType === 'mouse') stop(); });
  card.addEventListener('pointerup', (event) => {
    if (event.pointerType !== 'mouse') (card.classList.contains('playing') ? stop() : play());
  });
  card.addEventListener('focus', () => { if (card.matches(':focus-visible')) play(); });
  card.addEventListener('blur', stop);
});

// The gameplay video in the hero (self-hosted, 28.8 s, a loop). Without JavaScript it is a plain video with controls
// that loads nothing until played. With it: on a wide screen, unless the visitor prefers reduced motion or saves data,
// it plays muted and looping while in view (the 720p file, about 5 MB), with a Sound on button; on a phone it waits for
// a tap and then plays with sound (the 480p file, about 2.6 MB, or the upright cut below). "Watch gameplay" plays it with sound from the start.
const heroVideo = document.querySelector('video.gameplay');
if (heroVideo) {
  const frame = heroVideo.closest('.video-frame');
  const start = frame.querySelector('.video-start');
  const sound = frame.querySelector('.video-sound');
  const saveData = navigator.connection && navigator.connection.saveData;
  const wide = window.matchMedia('(min-width: 981px)');
  const ambient = wide.matches && !calmMotion() && !saveData;
  // A phone held upright gets the upright cut of the loop (540 x 960, about 3.5 MB), framed 9:16.
  const upright = window.matchMedia('(max-width: 700px) and (orientation: portrait)').matches && heroVideo.dataset.srcPortrait;
  heroVideo.controls = false;
  if (upright) {
    frame.classList.add('portrait');
    heroVideo.poster = heroVideo.dataset.posterPortrait;
    heroVideo.src = heroVideo.dataset.srcPortrait;
  } else heroVideo.src = ambient ? heroVideo.dataset.srcLarge : heroVideo.dataset.srcSmall;
  // The Sound button belongs to the silent preview; once the player's own controls are up, they carry the volume.
  const showSound = () => {
    sound.hidden = heroVideo.controls;
    sound.setAttribute('aria-pressed', String(!heroVideo.muted));
    sound.textContent = heroVideo.muted ? 'Sound on' : 'Sound off';
  };
  let soundCounted = false;
  const playWithSound = () => {
    if (!soundCounted) { soundCounted = true; track('gameplay-video'); }
    start.hidden = true;
    heroVideo.muted = false;
    heroVideo.controls = true;
    heroVideo.play().catch(() => {});
    showSound();
  };
  start.addEventListener('click', playWithSound);
  sound.addEventListener('click', () => {
    heroVideo.muted = !heroVideo.muted;
    heroVideo.controls = true;
    showSound();
  });
  if (ambient) {
    heroVideo.muted = true;
    heroVideo.preload = 'auto';
    showSound();
    // Plays only while on screen, so it never runs (or downloads more) unseen.
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) heroVideo.play().catch(() => { start.hidden = false; });
        else heroVideo.pause();
      });
    }, { threshold: 0.25 }).observe(heroVideo);
  } else start.hidden = false;
  document.querySelectorAll('[data-watch]').forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    frame.scrollIntoView({ behavior: calmMotion() ? 'auto' : 'smooth', block: 'center' });
    heroVideo.currentTime = 0;
    playWithSound();
  }));
}
function calmMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }

// The logo's emblem comes alive once the page has loaded (so it never slows the first paint): an animated copy of
// just the hexagon is laid over it, its first frame identical to the logo. Never under reduced motion.
const logoEmblem = document.querySelector('.logo-emblem');
if (logoEmblem && !calm.matches) {
  window.addEventListener('load', () => {
    logoEmblem.addEventListener('load', () => { logoEmblem.hidden = false; }, { once: true });
    logoEmblem.src = logoEmblem.dataset.motion;
  });
}
