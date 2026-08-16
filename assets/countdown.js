// Early Bird deadline: 30 August 2026, 23:59 CEST (UTC+2).
const DEADLINE = new Date('2026-08-30T23:59:59+02:00');

function renderCountdown() {
  const diff = DEADLINE.getTime() - Date.now();
  const fallback = document.querySelector('[data-cd="fallback"]');

  if (diff <= 0) {
    document.querySelectorAll('[data-cd="days"], [data-cd="hours"], [data-cd="minutes"]')
      .forEach((el) => { el.textContent = '00'; });
    if (fallback) fallback.textContent = 'Early Bird pricing has closed';
    return false;
  }

  const minutes = Math.floor(diff / 60000);
  const values = {
    days: Math.floor(minutes / 1440),
    hours: Math.floor((minutes % 1440) / 60),
    minutes: minutes % 60,
  };

  for (const [unit, value] of Object.entries(values)) {
    const el = document.querySelector(`[data-cd="${unit}"]`);
    if (el) el.textContent = String(value).padStart(2, '0');
  }
  return true;
}

if (renderCountdown()) {
  setInterval(renderCountdown, 30000);
}

// Anchored CTA appears once the hero price block is behind the fold.
const stickybar = document.querySelector('[data-sticky]');
const priceBlock = document.getElementById('price');
const finalCta = document.getElementById('reserve');

if (stickybar && priceBlock && finalCta && 'IntersectionObserver' in window) {
  stickybar.hidden = false;

  let pastPrice = false;
  let atFinal = false;

  const sync = () => {
    stickybar.toggleAttribute('data-visible', pastPrice && !atFinal);
  };

  new IntersectionObserver(([entry]) => {
    pastPrice = entry.boundingClientRect.top < 0 && !entry.isIntersecting;
    sync();
  }, { threshold: 0 }).observe(priceBlock);

  new IntersectionObserver(([entry]) => {
    atFinal = entry.isIntersecting;
    sync();
  }, { threshold: 0.15 }).observe(finalCta);
}
