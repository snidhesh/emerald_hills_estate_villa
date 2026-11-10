import { initReveal }   from './reveal.js';
import { initNav }      from './nav.js';
import { initGallery }  from './gallery.js';
import { initPlans }    from './plans.js';
import { initLeadForm } from './lead-form.js';

function init() {
  initNav();
  initReveal();
  initGallery();
  initPlans();
  initLeadForm();
  injectYear();
  document.documentElement.classList.add('js-ready');
}

function injectYear() {
  const y = String(new Date().getFullYear());
  document.querySelectorAll('[data-current-year]').forEach((el) => { el.textContent = y; });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
