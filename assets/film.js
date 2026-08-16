// Click-to-play facade: the YouTube iframe is only fetched once someone asks for it.
document.querySelectorAll('[data-film]').forEach((film) => {
  const id = film.dataset.videoId?.trim();
  const play = film.querySelector('[data-film-play]');
  const soon = film.querySelector('[data-film-soon]');
  const frame = film.querySelector('.film__frame');

  if (!id) return;

  play.hidden = false;
  soon.hidden = true;

  play.addEventListener('click', () => {
    const iframe = document.createElement('iframe');
    iframe.className = 'film__embed';
    iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = 'Luminaries Summit film';
    iframe.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';

    frame.replaceChildren(iframe);
    film.dataset.playing = 'true';
  });
});
