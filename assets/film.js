// Click-to-play facade: media is only fetched once someone asks for it.
document.querySelectorAll('[data-film]').forEach((film) => {
  const youtubeId = film.dataset.videoId?.trim();
  const src = film.dataset.videoSrc?.trim();
  const instagram = film.dataset.instagram?.trim();
  const play = film.querySelector('[data-film-play]');
  const soon = film.querySelector('[data-film-soon]');
  const igLink = film.parentElement?.querySelector('[data-film-ig]');
  const frame = film.querySelector('.film__frame');

  if (instagram && igLink) {
    igLink.href = instagram;
    igLink.hidden = false;
  }

  if (!youtubeId && !src) return;

  play.hidden = false;
  soon.hidden = true;

  play.addEventListener('click', () => {
    let media;

    if (src) {
      media = document.createElement('video');
      media.src = src;
      media.controls = true;
      media.autoplay = true;
      media.playsInline = true;
      media.preload = 'auto';
    } else {
      media = document.createElement('iframe');
      media.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(youtubeId)}?autoplay=1&rel=0&modestbranding=1`;
      media.title = 'Luminaries Summit film';
      media.allow = 'accelerometer; autoplay; encrypted-media; picture-in-picture';
      media.allowFullscreen = true;
      media.referrerPolicy = 'strict-origin-when-cross-origin';
    }

    media.className = 'film__embed';
    frame.replaceChildren(media);
    film.dataset.playing = 'true';
  });
});
