// Sticky nav scroll state + right-side slide-in drawer with backdrop.
// ESC closes, click-on-backdrop closes, click-on-link closes, focus trapped.
export function initNav() {
  const nav = document.querySelector('.nav');
  const toggle = document.querySelector('.nav__toggle');
  const drawer = document.querySelector('.nav__drawer');
  const backdrop = document.querySelector('.nav__backdrop');
  const closeBtn = document.querySelector('.nav__drawer-close');
  if (!nav) return;

  // Scroll state — rAF throttled
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      nav.classList.toggle('is-scrolled', window.scrollY > 60);
      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (!toggle || !drawer || !backdrop) return;

  let lastFocused = null;

  const closeDrawer = () => {
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-open');
    backdrop.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus();
    }
  };

  const openDrawer = () => {
    lastFocused = document.activeElement;
    backdrop.hidden = false;
    // Next frame so transition runs from the hidden→visible state
    requestAnimationFrame(() => {
      drawer.classList.add('is-open');
      backdrop.classList.add('is-open');
    });
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const firstLink = drawer.querySelector('a, button');
    if (firstLink) firstLink.focus();
  };

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    if (open) closeDrawer(); else openDrawer();
  });

  backdrop.addEventListener('click', closeDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);

  drawer.addEventListener('click', (e) => {
    if (e.target instanceof HTMLAnchorElement) closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) {
      closeDrawer();
    }
    if (e.key === 'Tab' && drawer.classList.contains('is-open')) {
      trapFocus(e, drawer);
    }
  });

  // Close if viewport upgrades to desktop while drawer is open
  const mql = window.matchMedia('(min-width: 980px)');
  mql.addEventListener?.('change', (ev) => { if (ev.matches) closeDrawer(); });
}

function trapFocus(e, container) {
  const focusable = container.querySelectorAll(
    'a, button, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault(); last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault(); first.focus();
  }
}
