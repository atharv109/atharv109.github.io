import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://atharv109.github.io',
  output: 'static',
  trailingSlash: 'always',
  prefetch: { defaultStrategy: 'hover' },
  integrations: [sitemap()],
});
