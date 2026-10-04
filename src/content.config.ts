import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const entry = z.object({
  title: z.string(),
  tagline: z.string(),
  stack: z.array(z.string()),
  metrics: z.array(z.object({ label: z.string(), value: z.string() })),
  links: z.array(z.object({ label: z.string(), url: z.string(), color: z.string().optional() })),
  order: z.number(),
  draft: z.boolean().optional(),
});

export const collections = {
  projects: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/projects' }),
    schema: entry,
  }),
  archive: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/archive' }),
    schema: entry,
  }),
  pages: defineCollection({
    loader: glob({ pattern: '*.md', base: './src/content/pages' }),
    schema: entry,
  }),
};
