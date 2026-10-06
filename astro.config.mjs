import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import remarkEditorRhythm from './src/plugins/remark-editor.mjs';

export default defineConfig({
  site: 'https://atharv109.github.io',
  output: 'static',
  trailingSlash: 'always',
  prefetch: { defaultStrategy: 'hover' },
  markdown: {
    remarkPlugins: [remarkEditorRhythm],
  },
  integrations: [sitemap()],
});
