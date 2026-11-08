document.querySelectorAll('[data-video] button').forEach(button => {
  button.addEventListener('click', () => {
    const container = button.parentElement;
    const frame = document.createElement('iframe');
    frame.src = `https://www.youtube-nocookie.com/embed/${container.dataset.video}?autoplay=1`;
    frame.title = button.getAttribute('aria-label');
    frame.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
    frame.allowFullscreen = true;
    frame.referrerPolicy = 'strict-origin-when-cross-origin';
    container.replaceChildren(frame);
  });
});
