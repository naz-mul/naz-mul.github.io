import assert from 'node:assert/strict'
import test from 'node:test'
import { createPublicationProjection } from './publication.ts'
import { showcaseRecords } from './showcase.ts'

test('the user-confirmed work is published as three in-progress summaries', () => {
  const publication = createPublicationProjection(showcaseRecords)
  assert.deepEqual(publication.featuredWork.map(({ title }) => title), [
    'AI Voice Platform',
    'Developer Learning Platform',
    'Community Technology',
  ])
  assert.ok(publication.featuredWork.every((entry) => entry.workState === 'in-progress'))
  assert.ok(publication.featuredWork.every((entry) => entry.publicationState === 'published' && entry.reviewed))
})

test('missing project details and public LinkedIn URLs create no invented destinations', () => {
  const publication = createPublicationProjection(showcaseRecords)
  assert.deepEqual(publication.routes, [])
  assert.deepEqual(publication.writing, [])
  assert.ok(publication.featuredWork.every((entry) => entry.links.length === 0 && !entry.permalink))
})
