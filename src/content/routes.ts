import { content, site } from './site.ts'
import { experiencePage, technicalNotes } from './routePages.ts'

export const siteOrigin = 'https://nalam.me' as const

type OpenGraphType = 'article' | 'profile' | 'website'

type RouteMetadata = {
  title: string
  description: string
  canonical: `${typeof siteOrigin}${string}`
  openGraph: {
    type: OpenGraphType
    title: string
    description: string
    url: `${typeof siteOrigin}${string}`
  }
}

type RouteDelivery = {
  prerender: true
  hydrate: true
  expectedText: string
}

type NavigationRegistration = {
  label: string
  order: number
}

export type RouteRenderIdentity =
  | { kind: 'home' }
  | { kind: 'experience' }
  | { kind: 'case-study'; slug: 'cisco' | 'fidelity' | 'hmh' | 'optum' }
  | {
      kind: 'technical-note'
      slug:
        | 'testing-real-time-voice-orchestration-under-interruption'
        | 'consistency-guarantees-for-deprovisioning'
    }
  | { kind: 'not-found' }

type RouteRegistration = {
  path: `/${string}`
  input: `${string}.html`
  entryScript: `/entries/${string}.tsx`
  render: RouteRenderIdentity
  metadata: RouteMetadata
  delivery: RouteDelivery
  navigation: NavigationRegistration | null
  indexable: boolean
}

const canonical = (path: RouteRegistration['path']) => `${siteOrigin}${path}` as const

export const routeManifest = {
  home: {
    path: '/',
    input: 'index.html',
    entryScript: '/entries/home.tsx',
    render: { kind: 'home' },
    metadata: {
      title: 'Nazmul Alam — Senior Software Engineer',
      description: site.description,
      canonical: canonical('/'),
      openGraph: {
        type: 'profile',
        title: 'Nazmul Alam — Senior Software Engineer',
        description: site.description,
        url: canonical('/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: content.positioning.thesis,
    },
    navigation: { label: 'Home', order: 0 },
    indexable: true,
  },
  hmh: {
    path: '/work/hmh/',
    input: 'work/hmh/index.html',
    entryScript: '/entries/hmh.tsx',
    render: { kind: 'case-study', slug: 'hmh' },
    metadata: {
      title: 'Houghton Mifflin Harcourt — Nazmul Alam',
      description: content.flagships[0].summary,
      canonical: canonical('/work/hmh/'),
      openGraph: {
        type: 'article',
        title: 'Houghton Mifflin Harcourt — Nazmul Alam',
        description: content.flagships[0].summary,
        url: canonical('/work/hmh/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: content.flagships[0].proof.exactOwnership.copy,
    },
    navigation: { label: 'HMH case study', order: 10 },
    indexable: true,
  },
  optum: {
    path: '/work/optum/',
    input: 'work/optum/index.html',
    entryScript: '/entries/optum.tsx',
    render: { kind: 'case-study', slug: 'optum' },
    metadata: {
      title: 'Optum — Nazmul Alam',
      description: content.flagships[1].summary,
      canonical: canonical('/work/optum/'),
      openGraph: {
        type: 'article',
        title: 'Optum — Nazmul Alam',
        description: content.flagships[1].summary,
        url: canonical('/work/optum/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: content.flagships[1].proof.exactOwnership.copy,
    },
    navigation: { label: 'Optum case study', order: 20 },
    indexable: true,
  },
  fidelity: {
    path: '/work/fidelity/',
    input: 'work/fidelity/index.html',
    entryScript: '/entries/fidelity.tsx',
    render: { kind: 'case-study', slug: 'fidelity' },
    metadata: {
      title: 'Fidelity Investments — Nazmul Alam',
      description: content.supportingProof.summary,
      canonical: canonical('/work/fidelity/'),
      openGraph: {
        type: 'article',
        title: 'Fidelity Investments — Nazmul Alam',
        description: content.supportingProof.summary,
        url: canonical('/work/fidelity/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: content.supportingProof.contribution.copy,
    },
    navigation: { label: 'Fidelity case study', order: 30 },
    indexable: true,
  },
  cisco: {
    path: '/work/cisco/',
    input: 'work/cisco/index.html',
    entryScript: '/entries/cisco.tsx',
    render: { kind: 'case-study', slug: 'cisco' },
    metadata: {
      title: 'Cisco — Nazmul Alam',
      description: content.currentWork.summary,
      canonical: canonical('/work/cisco/'),
      openGraph: {
        type: 'article',
        title: 'Cisco — Nazmul Alam',
        description: content.currentWork.summary,
        url: canonical('/work/cisco/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: content.currentWork.contribution.copy,
    },
    navigation: { label: 'Cisco current work', order: 40 },
    indexable: true,
  },
  voiceInterruptionNote: {
    path: '/notes/testing-real-time-voice-orchestration-under-interruption/',
    input: 'notes/testing-real-time-voice-orchestration-under-interruption/index.html',
    entryScript: '/entries/voice-note.tsx',
    render: {
      kind: 'technical-note',
      slug: 'testing-real-time-voice-orchestration-under-interruption',
    },
    metadata: {
      title: `${technicalNotes[0].title} — Nazmul Alam`,
      description: technicalNotes[0].description,
      canonical: canonical('/notes/testing-real-time-voice-orchestration-under-interruption/'),
      openGraph: {
        type: 'article',
        title: `${technicalNotes[0].title} — Nazmul Alam`,
        description: technicalNotes[0].description,
        url: canonical('/notes/testing-real-time-voice-orchestration-under-interruption/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: technicalNotes[0].introduction[0],
    },
    navigation: { label: 'Voice orchestration note', order: 50 },
    indexable: true,
  },
  deprovisioningConsistencyNote: {
    path: '/notes/consistency-guarantees-for-deprovisioning/',
    input: 'notes/consistency-guarantees-for-deprovisioning/index.html',
    entryScript: '/entries/identity-note.tsx',
    render: {
      kind: 'technical-note',
      slug: 'consistency-guarantees-for-deprovisioning',
    },
    metadata: {
      title: `${technicalNotes[1].title} — Nazmul Alam`,
      description: technicalNotes[1].description,
      canonical: canonical('/notes/consistency-guarantees-for-deprovisioning/'),
      openGraph: {
        type: 'article',
        title: `${technicalNotes[1].title} — Nazmul Alam`,
        description: technicalNotes[1].description,
        url: canonical('/notes/consistency-guarantees-for-deprovisioning/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: technicalNotes[1].introduction[0],
    },
    navigation: { label: 'Deprovisioning consistency note', order: 60 },
    indexable: true,
  },
  experience: {
    path: '/experience/',
    input: 'experience/index.html',
    entryScript: '/entries/experience.tsx',
    render: { kind: 'experience' },
    metadata: {
      title: 'Experience — Nazmul Alam',
      description: experiencePage.introduction,
      canonical: canonical('/experience/'),
      openGraph: {
        type: 'profile',
        title: 'Experience — Nazmul Alam',
        description: experiencePage.introduction,
        url: canonical('/experience/'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: experiencePage.title,
    },
    navigation: { label: 'Experience', order: 70 },
    indexable: true,
  },
  notFound: {
    path: '/404.html',
    input: '404.html',
    entryScript: '/entries/not-found.tsx',
    render: { kind: 'not-found' },
    metadata: {
      title: 'Not found — Nazmul Alam',
      description: 'That page does not exist.',
      canonical: canonical('/404.html'),
      openGraph: {
        type: 'website',
        title: 'Not found — Nazmul Alam',
        description: 'That page does not exist.',
        url: canonical('/404.html'),
      },
    },
    delivery: {
      prerender: true,
      hydrate: true,
      expectedText: 'That page does not exist.',
    },
    navigation: null,
    indexable: false,
  },
} as const satisfies Record<string, RouteRegistration>

export type RouteId = keyof typeof routeManifest
export type Route = (typeof routeManifest)[RouteId]

export const routes = Object.entries(routeManifest).map(([id, route]) => ({
  id: id as RouteId,
  ...route,
}))

export type RegisteredRoute = (typeof routes)[number]

export const navigationRoutes = routes
  .filter((route) => route.navigation !== null)
  .sort((left, right) => left.navigation!.order - right.navigation!.order)

export const sitemapRoutes = routes.filter((route) => route.indexable)
