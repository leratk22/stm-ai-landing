/**
 * Путь с учётом base.
 *
 * На GitHub Pages сайт живёт в подпапке /stm-ai-landing, локально — в корне.
 * Любая внутренняя ссылка и любой файл из public/ в разметке должны идти
 * через эту функцию: абсолютный путь без base на Pages даёт 404.
 * (CSS-ссылки Vite переписывает сам, а разметку — нет.)
 */
const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function withBase(path: string): string {
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
