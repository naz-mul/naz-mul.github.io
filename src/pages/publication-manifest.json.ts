import type { APIRoute } from 'astro'
import { createPublicManifest } from '../content/publication.ts'
import { getPublication } from '../content/publicationData.ts'

// Build-only contract for validation/export. Publication tooling must exclude
// publication-manifest.json from dist/public; it is not a visitor-facing
// discovery document. Astro ignores page filenames beginning with an underscore.
export const prerender = true

export const GET: APIRoute = async () => new Response(
  JSON.stringify(createPublicManifest(await getPublication())),
  { headers: { 'Content-Type': 'application/json; charset=utf-8' } },
)
