/**
 * Страницы кейсов. Один объект — одна страница /cases/<slug>/.
 *
 * Сейчас это шаблоны: тексты — плейсхолдеры, которые описывают, что
 * должно стоять в блоке, картинки — заглушки с нужными пропорциями.
 * Чтобы наполнить кейс, достаточно заменить поля здесь — разметку
 * трогать не нужно. Название, тип и год отсюда же подтягиваются
 * в карточки на главной.
 *
 * Каркас взят с atlasdesign.framer.ai/projects/*: липкая колонка
 * с метаданными слева, лента с обложкой, текстом и галереей справа.
 */

import type { ImageMetadata } from "astro";
import coffee from "../assets/case-coffee-mood.png";
import nova from "../assets/case-nova-landing.png";
import saas from "../assets/case-saas-dashboard.png";

export interface CaseMeta {
  label: string;
  value: string;
}

export interface CaseSection {
  title: string;
  paragraphs: string[];
}

export interface CaseMetric {
  value: string;
  label: string;
}

/**
 * Превью в карточке — на главной и в «Других проектах».
 * Картинка вписана в плашку 473×436 каждая по-своему, отсюда свой класс.
 */
export interface CasePreview {
  src: ImageMetadata;
  alt: string;
  class: string;
  widths: number[];
  sizes: string;
}

export interface CaseStudy {
  slug: string;
  preview: CasePreview;
  title: string;
  kind: string;
  year: string;
  meta: CaseMeta[];
  intro: string;
  sections: CaseSection[];
  /** Сколько картинок в галерее между разделами. */
  gallery: number;
  outcome: CaseSection;
  metrics: CaseMetric[];
}

// ── Общий каркас: одинаковые плейсхолдеры для всех шаблонов ────────────
const template = {
  meta: (year: string): CaseMeta[] => [
    { label: "Клиент", value: "Название компании" },
    { label: "Сфера", value: "Отрасль" },
    { label: "Срок", value: "0 недель" },
    { label: "Год", value: year },
  ],
  intro:
    "Вводный абзац: о чём проект и для кого. Одно-два предложения — читатель должен понять суть кейса, не листая дальше.",
  sections: [
    {
      title: "Задача",
      paragraphs: [
        "С чем пришёл клиент: исходная ситуация и что в ней не работало.",
        "Ограничения и критерии успеха: сроки, бюджет, что нужно было получить на выходе.",
      ],
    },
    {
      title: "Решение",
      paragraphs: [
        "Ключевая идея: какой подход выбрали и почему именно его.",
        "Как шла работа: основные этапы, от концепции до сборки.",
      ],
    },
  ] as CaseSection[],
  gallery: 3,
  outcome: {
    title: "Результат",
    paragraphs: [
      "Что получил клиент: запущенный продукт и изменения, которые он принёс.",
      "Что было дальше: развитие проекта, отзыв клиента, следующие шаги.",
    ],
  } as CaseSection,
  metrics: [
    { value: "00%", label: "Показатель" },
    { value: "00", label: "Показатель" },
    { value: "0×", label: "Показатель" },
  ] as CaseMetric[],
};

function fromTemplate(base: Pick<CaseStudy, "slug" | "title" | "kind" | "year" | "preview">): CaseStudy {
  return {
    ...base,
    meta: template.meta(base.year),
    intro: template.intro,
    sections: template.sections,
    gallery: template.gallery,
    outcome: template.outcome,
    metrics: template.metrics,
  };
}

// ── Кейсы ──────────────────────────────────────────────────────────────
// Порядок совпадает с карточками на главной.
export const caseStudies: CaseStudy[] = [
  fromTemplate({
    slug: "mobile-app",
    title: "Название проекта",
    kind: "Приложение",
    year: "2025",
    preview: {
      src: coffee,
      alt: "Кейс: мобильное приложение кофейни",
      // Телефон 293×600: прижат к верху на 20px, обрезан снизу
      class: "absolute left-1/2 top-5 h-[137.7%] w-[61.9%] -translate-x-1/2 object-cover object-top",
      widths: [300, 600],
      sizes: "(min-width: 1024px) 300px, 62vw",
    },
  }),
  fromTemplate({
    slug: "landing",
    title: "Название проекта",
    kind: "Лэндинг",
    year: "2025",
    preview: {
      src: nova,
      alt: "Кейс: лендинг студии Nova",
      // Ноутбук 634×422: шире карточки, обрезан по бокам, прижат к низу
      class: "absolute bottom-0 left-1/2 h-[96.8%] w-[134%] -translate-x-1/2 object-cover",
      widths: [640, 1280],
      sizes: "(min-width: 1024px) 640px, 134vw",
    },
  }),
  fromTemplate({
    slug: "saas",
    title: "Название проекта",
    kind: "SAAS",
    year: "2025",
    preview: {
      src: saas,
      alt: "Кейс: дашборд SaaS-продукта",
      // Дашборд 435×309: помещается целиком, по центру
      class:
        "absolute left-1/2 top-1/2 h-[70.9%] w-[91.8%] -translate-x-1/2 -translate-y-1/2 object-cover",
      widths: [440, 880],
      sizes: "(min-width: 1024px) 440px, 92vw",
    },
  }),
];

// ── Подписи интерфейса страницы кейса ──────────────────────────────────
export const caseUi = {
  relatedTitle: "Другие проекты",
  metricsTitle: "В цифрах",
};
