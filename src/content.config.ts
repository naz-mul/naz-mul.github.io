import { defineCollection } from 'astro:content'
import { glob } from 'astro/loaders'
import { publicationSchema } from './content/publication.ts'

const articles = defineCollection({
  // Only reviewed-public authoring inputs belong here. Private local drafting
  // lives outside this directory and must also be ignored by Git.
  loader: glob({ base: './src/content/articles', pattern: '**/*.{md,mdx}' }),
  schema: publicationSchema.superRefine((record, context) => {
    if (!['technical-note', 'article', 'research-note'].includes(record.kind)) {
      context.addIssue({ code: 'custom', message: 'Markdown/MDX entries are site-owned readings; curated external items are metadata only.' })
    }
  }),
})

export const collections = { articles }
