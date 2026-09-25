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

export interface CaseStudy {
  slug: string;
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

function fromTemplate(base: Pick<CaseStudy, "slug" | "title" | "kind" | "year">): CaseStudy {
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
  fromTemplate({ slug: "mobile-app", title: "Название проекта", kind: "Приложение", year: "2025" }),
  fromTemplate({ slug: "landing", title: "Название проекта", kind: "Лэндинг", year: "2025" }),
  fromTemplate({ slug: "saas", title: "Название проекта", kind: "SAAS", year: "2025" }),
];

// ── Подписи интерфейса страницы кейса ──────────────────────────────────
export const caseUi = {
  relatedTitle: "Другие проекты",
  allProjects: "Все проекты",
  metricsTitle: "В цифрах",
};
