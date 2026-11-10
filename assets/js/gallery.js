// Horizontal drag-scroll gallery with prev/next + leading-edge counter.
// Pointer events (mouse + touch + pen), arrow-key nav,
// IntersectionObserver-driven counter for accurate sync.

export function initGallery() {
  const track = document.getElementById('gTrack');
  const counter = document.getElementById('gCount');
  const prevBtn = document.getElementById('gPrev');
  const nextBtn = document.getElementById('gNext');
  if (!track || !counter) return;

  const slides = Array.from(track.querySelectorAll('.g-slide'));
  if (!slides.length) return;

  let cur = 0;
  const setCounter = (i) => {
    cur = Math.max(0, Math.min(i, slides.length - 1));
    counter.textContent = String(cur + 1).padStart(2, '0');
  };
  setCounter(0);

  const scrollTo = (i) => {
    cur = Math.max(0, Math.min(i, slides.length - 1));
    slides[cur].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setCounter(cur);
  };

  // Arrow buttons
  if (prevBtn) prevBtn.addEventListener('click', () => scrollTo(cur - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => scrollTo(cur + 1));

  // Keyboard nav (only when gallery is in viewport)
  let inView = false;
  const galleryEl = track.closest('.screen') || track;
  const galleryObserver = new IntersectionObserver(
    (entries) => { inView = entries[0].isIntersecting; },
    { threshold: 0.4 }
  );
  galleryObserver.observe(galleryEl);

  document.addEventListener('keydown', (e) => {
    if (!inView) return;
    if (e.target.matches('input, textarea, button, select')) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); scrollTo(cur + 1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); scrollTo(cur - 1); }
  });

  // Pointer drag (mouse + touch + pen via one path)
  let dragging = false;
  let startX = 0;
  let startScroll = 0;

  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    startX = e.clientX;
    startScroll = track.scrollLeft;
    track.setPointerCapture?.(e.pointerId);
    track.style.scrollBehavior = 'auto';
  });
  track.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    track.scrollLeft = startScroll - (e.clientX - startX);
  });
  const endDrag = (e) => {
    if (!dragging) return;
    dragging = false;
    track.style.scrollBehavior = '';
    if (e && e.pointerId !== undefined) track.releasePointerCapture?.(e.pointerId);
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);
  track.addEventListener('pointerleave', endDrag);

  // IntersectionObserver-driven counter — fires when a slide's leading edge
  // becomes the most-visible item in the track viewport.
  const counterObserver = new IntersectionObserver(
    (entries) => {
      // Pick the entry with the largest intersection ratio above 0.5
      let best = null;
      for (const entry of entries) {
        if (entry.intersectionRatio < 0.5) continue;
        if (!best || entry.intersectionRatio > best.intersectionRatio) best = entry;
      }
      if (!best) return;
      const idx = slides.indexOf(best.target);
      if (idx >= 0) setCounter(idx);
    },
    {
      root: track,
      threshold: [0.5, 0.75, 1.0],
    }
  );
  slides.forEach((s) => counterObserver.observe(s));
}
