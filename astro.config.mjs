// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

// GitHub Pages отдаёт проектный сайт из подпапки /stm-ai-landing,
// поэтому в сборке для Pages нужен base. Локально он не нужен —
// иначе dev-сервер тоже уедет в подпапку. Флаг ставит workflow.
const forPages = process.env.GITHUB_PAGES === 'true';

// https://astro.build/config
export default defineConfig({
  site: 'https://leratk22.github.io',
  base: forPages ? '/stm-ai-landing' : undefined,
  vite: {
    plugins: [tailwindcss()]
  }
});
