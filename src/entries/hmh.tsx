import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CaseStudyPage } from '@/components/CaseStudyPage'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CaseStudyPage slug="hmh" />
  </StrictMode>,
)
