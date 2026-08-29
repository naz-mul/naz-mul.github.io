import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Page, Section } from '@/components/Layout'
import '@/styles/globals.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page>
      <Section>
        <p className="label">Error 404</p>
        <h1
          className="mt-4 font-serif font-medium tracking-[-0.028em]"
          style={{ fontSize: 'var(--text-title)', lineHeight: 1.05 }}
        >
          Not found
        </h1>
        <p className="mt-6 max-w-[46ch] text-muted-foreground">
          That page does not exist.{' '}
          <a href="/" className="link-underline text-accent">
            Back to the start
          </a>
          .
        </p>
      </Section>
    </Page>
  </StrictMode>,
)
