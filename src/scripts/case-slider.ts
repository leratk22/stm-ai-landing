/**
 * Слайдер кейсов в герое.
 *
 * Таймер автопрокрутки — это сама анимация полосы прогресса (Web Animations
 * API): полоса дорастает до конца → слайд перелистывается. Поэтому полоса
 * и реальный отсчёт не могут разойтись, а пауза — это просто пауза анимации.
 *
 * Автопрокрутка встаёт на паузу, когда:
 * - курсор над слайдером или фокус внутри — человек смотрит или листает сам;
 * - вкладка скрыта или слайдер ушёл с экрана — листать некому.
 * При prefers-reduced-motion автопрокрутки нет совсем, переключение без сдвига.
 */

const INTERVAL = 6000;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const SHIFT = 16; // px, насколько слайд смещается при смене
const SWIPE = 40; // px, порог свайпа

export function initCaseSlider(root: HTMLElement): void {
  const slides = [...root.querySelectorAll<HTMLElement>("[data-slide]")];
  if (slides.length < 2) return;

  const bar = root.querySelector<HTMLElement>("[data-slider-progress]");
  const status = root.querySelector<HTMLElement>("[data-slider-status]");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let index = 0;
  let timer: Animation | null = null;
  const pauses = new Set<string>();

  // Без автопрокрутки полосе нечего показывать — прячем пустую дорожку
  if (reduced) root.querySelector<HTMLElement>("[data-slider-track]")?.setAttribute("hidden", "");

  function restartTimer() {
    timer?.cancel();
    timer = null;
    if (reduced || !bar) return;

    timer = bar.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], {
      duration: INTERVAL,
      easing: "linear",
      fill: "forwards",
    });
    timer.onfinish = () => go(index + 1, 1, false);
    if (pauses.size) timer.pause();
  }

  function setPause(reason: string, on: boolean) {
    if (on) pauses.add(reason);
    else pauses.delete(reason);
    if (!timer) return;
    if (pauses.size) timer.pause();
    else timer.play();
  }

  function go(to: number, dir: 1 | -1, announce: boolean) {
    const target = (to + slides.length) % slides.length;
    if (target === index) return;

    const from = slides[index];
    const next = slides[target];

    // Быстрые клики: доводим незаконченную смену, чтобы не смешивать кадры
    [from, next].forEach((s) => s.getAnimations().forEach((a) => a.finish()));

    from.classList.remove("is-active");
    from.setAttribute("aria-hidden", "true");
    from.inert = true;
    next.classList.add("is-active");
    next.removeAttribute("aria-hidden");
    next.inert = false;

    if (!reduced) {
      const opts = { duration: 600, easing: EASE };
      from.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: `translateX(${-dir * SHIFT}px)` },
        ],
        opts,
      );
      next.animate(
        [
          { opacity: 0, transform: `translateX(${dir * SHIFT}px)` },
          { opacity: 1, transform: "none" },
        ],
        opts,
      );
    }

    index = target;
    // Озвучиваем только ручное листание: автопрокрутка каждые 6 секунд
    // превратила бы скринридер в поток объявлений
    if (announce && status) status.textContent = next.getAttribute("aria-label") ?? "";
    restartTimer();
  }

  root.querySelector("[data-case-prev]")?.addEventListener("click", () => go(index - 1, -1, true));
  root.querySelector("[data-case-next]")?.addEventListener("click", () => go(index + 1, 1, true));

  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") go(index - 1, -1, true);
    if (e.key === "ArrowRight") go(index + 1, 1, true);
  });

  // Пауза: курсор, фокус, скрытая вкладка, слайдер вне экрана
  root.addEventListener("mouseenter", () => setPause("hover", true));
  root.addEventListener("mouseleave", () => setPause("hover", false));
  root.addEventListener("focusin", () => setPause("focus", true));
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget as Node | null)) setPause("focus", false);
  });
  document.addEventListener("visibilitychange", () => setPause("hidden", document.hidden));
  new IntersectionObserver(([entry]) => setPause("offscreen", !entry.isIntersecting)).observe(root);

  // Свайп на тач-экранах. После свайпа гасим клик, иначе откроется кейс
  let startX = 0;
  let startY = 0;
  let swiped = false;
  root.addEventListener("pointerdown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    swiped = false;
  });
  root.addEventListener("pointerup", (e) => {
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > SWIPE && Math.abs(dx) > Math.abs(dy)) {
      swiped = true;
      if (dx < 0) go(index + 1, 1, true);
      else go(index - 1, -1, true);
    }
  });
  root.addEventListener(
    "click",
    (e) => {
      if (!swiped) return;
      e.preventDefault();
      swiped = false;
    },
    true,
  );

  restartTimer();
}
