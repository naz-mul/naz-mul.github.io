import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Home } from '@/components/Home'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Home />
  </StrictMode>,
)
