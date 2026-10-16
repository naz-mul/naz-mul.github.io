import type { ReactNode } from 'react'
import { CaseStudyPage } from '@/components/CaseStudyPage'
import { ExperiencePage } from '@/components/ExperiencePage'
import { Home } from '@/components/Home'
import { NotFoundPage } from '@/components/NotFoundPage'
import { TechnicalNotePage } from '@/components/TechnicalNotePage'
import { routeManifest, type RouteId } from '@/content/routes'

type RouteRenderer = () => ReactNode

export const routeRenderers = {
  home: () => <Home />,
  hmh: () => <CaseStudyPage slug="hmh" />,
  optum: () => <CaseStudyPage slug="optum" />,
  fidelity: () => <CaseStudyPage slug="fidelity" />,
  cisco: () => <CaseStudyPage slug="cisco" />,
  voiceInterruptionNote: () => (
    <TechnicalNotePage slug="testing-real-time-voice-orchestration-under-interruption" />
  ),
  deprovisioningConsistencyNote: () => (
    <TechnicalNotePage slug="consistency-guarantees-for-deprovisioning" />
  ),
  experience: () => <ExperiencePage />,
  notFound: () => <NotFoundPage />,
} satisfies Record<RouteId, RouteRenderer>

export function renderRoute(id: RouteId): ReactNode {
  if (!(id in routeManifest)) throw new Error(`Unknown route: ${id}`)
  return routeRenderers[id]()
}
