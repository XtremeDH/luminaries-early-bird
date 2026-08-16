// Early Bird pass, VAT included. 20% off the regular EUR 1,110 rate, unlocked by email.
const PASS_PRICE = 888;
const PASS_REGULAR = 1110;
const CHILD_PRICE = 650;
const UNLOCK_KEY = 'lum-earlybird-email';

const eur = (n) =>
  '€' + n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ------------------------------------------------- email unlock ------- */

const unlockForm = document.querySelector('[data-unlock-form]');
const unlockDone = document.querySelector('[data-unlock-done]');
const lockCard = document.querySelector('[data-lock]');
const unlockError = document.querySelector('[data-unlock-error]');

let unlockedEmail = null;
try {
  unlockedEmail = localStorage.getItem(UNLOCK_KEY);
} catch (e) {
  unlockedEmail = null;
}

const isUnlocked = () => Boolean(unlockedEmail);
const passRate = () => (isUnlocked() ? PASS_PRICE : PASS_REGULAR);

function paintLockState() {
  const open = isUnlocked();

  document.body.dataset.earlyBird = open ? 'unlocked' : 'locked';
  if (lockCard) lockCard.toggleAttribute('data-locked', !open);
  if (unlockForm) unlockForm.hidden = open;
  if (unlockDone) unlockDone.hidden = !open;

  document.querySelectorAll('[data-unlock-email]').forEach((el) => {
    el.textContent = unlockedEmail || '';
  });
  document.querySelectorAll('[data-lockable]').forEach((el) => {
    el.setAttribute('aria-hidden', String(!open));
  });
}

if (unlockForm) {
  unlockForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = unlockForm.querySelector('input[type="email"]');
    const value = input.value.trim();

    if (!value || !input.checkValidity()) {
      unlockError.hidden = false;
      input.classList.add('is-invalid');
      input.focus();
      return;
    }

    unlockError.hidden = true;
    input.classList.remove('is-invalid');
    unlockedEmail = value;
    try {
      localStorage.setItem(UNLOCK_KEY, value);
    } catch (err) {
      /* storage unavailable, discount still applies for this visit */
    }

    paintLockState();
    document.dispatchEvent(new CustomEvent('earlybird:unlocked'));
  });
}

paintLockState();

/* ------------------------------------------------- booking builder ---- */

const form = document.getElementById('checkout-form');
if (form) {
  const accomToggle = document.getElementById('accom-toggle');
  const terms = document.getElementById('terms');
  const gated = form.querySelector('[data-gated]');
  const passOnly = form.querySelector('[data-passonly]');
  const passCount = document.getElementById('pass-count');
  const guestFields = form.querySelector('[data-guest-fields]');
  const buyerEmail = document.getElementById('buyer-email');
  const emailError = form.querySelector('[data-email-error]');
  const linesEl = form.querySelector('[data-lines]');
  const totalEl = form.querySelector('[data-total]');
  const savingEl = form.querySelector('[data-saving]');
  const confirmBtn = form.querySelector('[data-confirm]');
  const confirmHint = form.querySelector('[data-confirm-hint]');
  const passNote = form.querySelector('[data-pass-note]');
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
      const rate = passRate();
      total = rate * state.passes;
      saved = (PASS_REGULAR - rate) * state.passes;

      lines.push(
        line(
          `${isUnlocked() ? 'Early Bird' : 'Regular'} summit pass × ${state.passes}`,
          isUnlocked() ? `20% off ${eur(PASS_REGULAR)} each` : `${eur(rate)} each · unlock 20% off above`,
          eur(total)
        )
      );
      lines.push(line('Accommodation', 'Removed from this booking', 'Not included', true));
    }

    linesEl.innerHTML = lines.join('');
    totalEl.textContent = eur(total);
    if (stickyTotal) stickyTotal.textContent = eur(total);

    if (passNote) {
      passNote.textContent = isUnlocked()
        ? `Early Bird pass at ${eur(PASS_PRICE)} each, VAT included. Accommodation not included.`
        : `Regular pass at ${eur(PASS_REGULAR)} each. Unlock the 20% Early Bird discount above to pay ${eur(PASS_PRICE)}.`;
    }

    savingEl.hidden = saved <= 0;
    if (saved > 0) savingEl.textContent = `You save ${eur(saved)}`;

    renderGuestFields(adults);

    const emailOk = buyerEmail.value.trim() !== '' && buyerEmail.checkValidity();
    const ready = terms.checked && emailOk;
    confirmBtn.setAttribute('aria-disabled', String(!ready));
    confirmBtn.classList.toggle('is-disabled', !ready);
    confirmHint.hidden = ready;
    confirmHint.textContent = !emailOk
      ? 'Add your email address to continue.'
      : 'Accept the terms to continue.';
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

  document.addEventListener('earlybird:unlocked', () => {
    if (!buyerEmail.value.trim() && unlockedEmail) buyerEmail.value = unlockedEmail;
    render();
  });

  if (unlockedEmail && !buyerEmail.value.trim()) buyerEmail.value = unlockedEmail;

  buyerEmail.addEventListener('input', render);
  buyerEmail.addEventListener('blur', () => {
    const invalid = buyerEmail.value.trim() !== '' && !buyerEmail.checkValidity();
    emailError.hidden = !invalid;
    buyerEmail.classList.toggle('is-invalid', invalid);
  });

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
      const target = buyerEmail.checkValidity() && buyerEmail.value.trim() ? terms : buyerEmail;
      target.focus();
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
