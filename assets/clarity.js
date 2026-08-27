const form = document.getElementById('clarity-form');

if (form) {
  const step1 = form.querySelector('[data-step="1"]');
  const step2 = form.querySelector('[data-step="2"]');
  const done = form.querySelector('[data-done]');
  const stepError = form.querySelector('[data-step-error]');
  const finalError = form.querySelector('[data-final-error]');
  const notes = form.querySelector('textarea[name="notes"]');
  const email = form.querySelector('input[name="email"]');

  const step1Fields = () => [...step1.querySelectorAll('input')];

  function markInvalid(el, invalid) {
    if (el.type === 'radio') return;
    el.classList.toggle('is-invalid', invalid);
  }

  form.querySelector('[data-continue]').addEventListener('click', () => {
    const invalid = step1Fields().filter((el) => !el.checkValidity());
    invalid.forEach((el) => markInvalid(el, true));
    step1Fields().filter((el) => el.checkValidity()).forEach((el) => markInvalid(el, false));

    if (invalid.length) {
      stepError.hidden = false;
      invalid[0].focus();
      return;
    }

    stepError.hidden = true;
    step1.hidden = true;
    step2.hidden = false;
    step2.querySelector('textarea').focus();
    form.scrollIntoView({ block: 'start' });
  });

  form.querySelector('[data-back]').addEventListener('click', () => {
    step2.hidden = true;
    step1.hidden = false;
    form.scrollIntoView({ block: 'start' });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!notes.checkValidity()) {
      finalError.hidden = false;
      markInvalid(notes, true);
      notes.focus();
      return;
    }

    // TODO: hand the payload to LeadConnector instead of resolving locally.
    finalError.hidden = true;
    step2.hidden = true;
    form.querySelector('[data-done-email]').textContent = email.value.trim();
    done.hidden = false;
    done.scrollIntoView({ block: 'center' });
  });

  form.addEventListener('input', (e) => {
    if (e.target.checkValidity()) markInvalid(e.target, false);
  });
}
