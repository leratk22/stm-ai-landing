/**
 * Появление блоков при скролле: opacity + translateY со стаггером.
 * Лёгкая замена Framer Motion с референса — один observer на страницу.
 */
export function initReveal(): void {
  const items = document.querySelectorAll<HTMLElement>(".reveal");
  if (!items.length) return;

  // Без анимации — сразу показываем, чтобы контент не остался невидимым
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.1 },
  );

  items.forEach((el) => observer.observe(el));
}
