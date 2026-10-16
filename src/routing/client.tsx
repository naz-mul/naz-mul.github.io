import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { routeManifest, type RouteId } from '@/content/routes'
import { renderRoute } from '@/routing/render'
import '@/styles/globals.css'

export function mountRoute(id: RouteId) {
  const root = document.getElementById('root')
  if (!root) throw new Error(`Missing #root for route "${id}"`)

  const route = routeManifest[id]
  const tree = <StrictMode>{renderRoute(id)}</StrictMode>

  if (route.delivery.hydrate && root.hasChildNodes()) {
    hydrateRoot(root, tree)
    return
  }

  createRoot(root).render(tree)
}
