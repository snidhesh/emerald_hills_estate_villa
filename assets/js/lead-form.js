// Lead form. Validates client-side, renders status via textContent only,
// and posts JSON to the same-origin proxy at /api/leads which forwards the
// lead to the BlackOak Studio CRM. No secrets live in the browser.

const CRM_ENDPOINT = '/api/leads';

const LIMITS = { name: 100, email: 254, phone: 24, message: 1500 };
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_PHONE = /^[\d+\-\s().]{6,24}$/;
const COOLDOWN_MS = 30000;

export function initLeadForm() {
  const form = document.querySelector('#lead-form');
  if (!form) return;

  const statusEl = form.querySelector('.form__status');
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn.textContent;
  let cooldownUntil = 0;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setStatus('', '');

    if (Date.now() < cooldownUntil) {
      setStatus('Please wait a moment before submitting again.', 'error');
      return;
    }

    const fd = new FormData(form);
    const payload = {
      name:        truncate(fd.get('name'),       LIMITS.name),
      email:       truncate(fd.get('email'),      LIMITS.email),
      phone:       truncate(fd.get('phone'),      LIMITS.phone),
      visit_date:  truncate(fd.get('visit_date'), 20),
      visit_time:  truncate(fd.get('visit_time'), 10),
      message:     truncate(fd.get('message'),    LIMITS.message),
      _gotcha:     fd.get('_gotcha') || '',
      page:        location.href.slice(0, 300),
    };

    const err = validate(payload);
    if (err) { setStatus(err, 'error'); return; }

    // Honeypot filled — pretend success, drop silently
    if (payload._gotcha) {
      setStatus('Thank you — we will be in touch shortly.', 'success');
      form.reset();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';
    cooldownUntil = Date.now() + COOLDOWN_MS;

    try {
      const res = await fetch(CRM_ENDPOINT, {
        method: 'POST',
        credentials: 'omit',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Bad response ' + res.status);
      setStatus(
        'Thank you, ' + payload.name + '. Our team will reach out within 24 hours to confirm your private viewing.',
        'success'
      );
      form.reset();
    } catch (err) {
      console.error('[lead-form]', err);
      setStatus(
        'We could not submit your request. Please email riad@blackoak-re.com or call +971 55 956 1231.',
        'error'
      );
    } finally {
      setTimeout(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = submitLabel;
      }, 1500);
    }
  });

  function setStatus(message, state) {
    statusEl.textContent = message;
    statusEl.dataset.state = state || '';
    if (state === 'error') statusEl.setAttribute('role', 'alert');
    else statusEl.removeAttribute('role');
  }
}

function truncate(v, max) {
  if (v == null) return '';
  const s = String(v).trim();
  return s.length > max ? s.slice(0, max) : s;
}

function validate(p) {
  if (!p.name)                 return 'Please enter your name.';
  if (!p.email)                return 'Please enter your email.';
  if (!RE_EMAIL.test(p.email)) return 'Please enter a valid email address.';
  if (!p.phone)                return 'Please enter your phone or WhatsApp number.';
  if (!RE_PHONE.test(p.phone)) return 'Phone number contains invalid characters.';
  return null;
}
