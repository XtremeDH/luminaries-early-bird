// Early Bird pass, VAT included. 20% off the regular EUR 1,110 rate.
const PASS_PRICE = 888;
const PASS_REGULAR = 1110;
const CHILD_PRICE = 650;

const eur = (n) =>
  '€' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const form = document.getElementById('checkout-form');
if (form) {
  const accomToggle = document.getElementById('accom-toggle');
  const terms = document.getElementById('terms');
  const gated = form.querySelector('[data-gated]');
  const passOnly = form.querySelector('[data-passonly]');
  const passCount = document.getElementById('pass-count');
  const guestFields = form.querySelector('[data-guest-fields]');
  const linesEl = form.querySelector('[data-lines]');
  const totalEl = form.querySelector('[data-total]');
  const savingEl = form.querySelector('[data-saving]');
  const confirmBtn = form.querySelector('[data-confirm]');
  const confirmHint = form.querySelector('[data-confirm-hint]');
  const stickyTotal = document.querySelector('[data-sticky-total]');

  const state = {
    passes: 1,
    addons: { 'sea-view': false, 'single-use': false },
    qty: { infants: 0, children: 0 },
  };

  const selectedRoom = () => form.querySelector('input[name="room"]:checked');
  const selectedStay = () => form.querySelector('input[name="stay-type"]:checked');

  function line(label, note, value, muted) {
    return `<div class="summary__line${muted ? ' is-muted' : ''}">
        <dt><span class="summary__lineLabel">${label}</span><span class="summary__lineNote">${note}</span></dt>
        <dd>${value}</dd>
      </div>`;
  }

  // Name inputs are rebuilt on every change, so carry over whatever was already typed.
  function renderGuestFields(adults) {
    const kept = [...guestFields.querySelectorAll('input')].map((i) => i.value);
    const rows = [];
    let n = 0;

    for (let i = 1; i <= adults; i += 1) {
      rows.push(`<label class="guests__row"><span>Guest #${i}</span>
        <input type="text" name="guest-${i}" autocomplete="name" placeholder="Full name" value="${kept[n++] || ''}" /></label>`);
    }
    for (let i = 1; i <= state.qty.children + state.qty.infants; i += 1) {
      rows.push(`<label class="guests__row"><span>Child #${i}</span>
        <input type="text" name="child-${i}" autocomplete="name" placeholder="Full name" value="${kept[n++] || ''}" /></label>`);
    }
    guestFields.innerHTML = rows.join('');
  }

  function render() {
    const withAccom = accomToggle.checked;
    const stay = selectedStay().value;
    const lines = [];
    let total = 0;
    let saved = 0;
    let adults = state.passes;

    form.querySelectorAll('[data-room-img]').forEach((img) => {
      const next = img.dataset[stay === 'bungalow' ? 'bungalow' : 'tinyHome'];
      if (next && img.getAttribute('src') !== next) img.setAttribute('src', next);
    });

    if (withAccom) {
      const room = selectedRoom();
      const price = Number(room.dataset.price);
      const was = room.dataset.was ? Number(room.dataset.was) : null;
      const stayLabel = stay === 'bungalow' ? 'Bungalow' : 'Tiny Home';
      const roomLabel = room.closest('.choice').querySelector('.choice__title').textContent;

      adults = Number(room.dataset.guests);
      total = price;
      if (was) saved = was - price;

      lines.push(
        line(
          `${stayLabel} · ${roomLabel}`,
          `6 nights${was ? ` · ${room.dataset.off}% off ${eur(was)}` : ''}`,
          eur(price)
        )
      );
      lines.push(line(`Summit pass × ${adults}`, 'Already included in the package', 'Included', true));

      form.querySelectorAll('[data-addon]').forEach((btn) => {
        if (!state.addons[btn.dataset.addon]) return;
        const extra = Number(btn.dataset.price);
        total += extra;
        lines.push(line(btn.closest('.addon').querySelector('.addon__title').textContent, 'Upgrade', eur(extra)));
      });

      if (state.qty.children) {
        const sub = CHILD_PRICE * state.qty.children;
        total += sub;
        lines.push(line(`Children 2 to 16 × ${state.qty.children}`, `${eur(CHILD_PRICE)} each`, eur(sub)));
      }
      if (state.qty.infants) {
        lines.push(line(`Children under 2 × ${state.qty.infants}`, 'No extra cost', 'Free', true));
      }
    } else {
      total = PASS_PRICE * state.passes;
      saved = (PASS_REGULAR - PASS_PRICE) * state.passes;

      lines.push(
        line(`Early Bird summit pass × ${state.passes}`, `20% off ${eur(PASS_REGULAR)} each`, eur(total))
      );
      lines.push(line('Accommodation', 'Removed from this booking', 'Not included', true));
    }

    linesEl.innerHTML = lines.join('');
    totalEl.textContent = eur(total);
    if (stickyTotal) stickyTotal.textContent = eur(total);

    savingEl.hidden = saved <= 0;
    if (saved > 0) savingEl.textContent = `You save ${eur(saved)}`;

    renderGuestFields(adults);

    const ready = terms.checked;
    confirmBtn.setAttribute('aria-disabled', String(!ready));
    confirmBtn.classList.toggle('is-disabled', !ready);
    confirmHint.hidden = ready;
  }

  function setAccomVisibility() {
    gated.hidden = !accomToggle.checked;
    passOnly.hidden = accomToggle.checked;
  }

  accomToggle.addEventListener('change', () => {
    setAccomVisibility();
    render();
  });

  terms.addEventListener('change', render);

  form.addEventListener('change', (e) => {
    if (e.target.name === 'room' || e.target.name === 'stay-type') render();
  });

  form.querySelectorAll('[data-step]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.passes = Math.min(8, Math.max(1, state.passes + Number(btn.dataset.step)));
      passCount.textContent = String(state.passes);
      render();
    });
  });

  form.querySelectorAll('[data-addon]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.addon;
      state.addons[key] = !state.addons[key];
      btn.setAttribute('aria-pressed', String(state.addons[key]));
      btn.textContent = state.addons[key] ? 'Added' : 'Add';
      btn.classList.toggle('btn--solid', state.addons[key]);
      btn.classList.toggle('btn--ghost', !state.addons[key]);
      render();
    });
  });

  form.querySelectorAll('[data-qty]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.qty;
      state.qty[key] = Math.min(4, Math.max(0, state.qty[key] + Number(btn.dataset.delta)));
      form.querySelector(`[data-qty-val="${key}"]`).textContent = String(state.qty[key]);
      render();
    });
  });

  confirmBtn.addEventListener('click', (e) => {
    if (confirmBtn.getAttribute('aria-disabled') === 'true') {
      e.preventDefault();
      terms.focus();
    }
  });

  // Accommodation cards jump straight to the configurator with the type preselected.
  document.querySelectorAll('[data-pick-stay]').forEach((link) => {
    link.addEventListener('click', () => {
      accomToggle.checked = true;
      setAccomVisibility();
      const input = form.querySelector(`input[name="stay-type"][value="${link.dataset.pickStay}"]`);
      if (input) input.checked = true;
      render();
    });
  });

  render();
}
