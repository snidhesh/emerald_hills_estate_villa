// Floor-plan level switcher. Tabs (role="tab") toggle every [data-level] panel
// in the section (plan drawing on the paper side + info panel on the navy side).
// Arrow keys move between levels when a tab is focused.
export function initPlans() {
  const root = document.getElementById('s4');
  if (!root) return;
  const tabs = Array.from(root.querySelectorAll('.fp-tab'));
  const panels = Array.from(root.querySelectorAll('[data-level]'));
  if (!tabs.length || !panels.length) return;

  const select = (i) => {
    tabs.forEach((t, idx) => {
      const on = idx === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
    });
    panels.forEach((p) => p.classList.toggle('is-active', Number(p.dataset.level) === i));
  };

  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(i));
    t.addEventListener('keydown', (e) => {
      let n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = (i + 1) % tabs.length;
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
      if (n === null) return;
      e.preventDefault();
      select(n);
      tabs[n].focus();
    });
  });

  const initial = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
  select(initial < 0 ? 0 : initial);
}
