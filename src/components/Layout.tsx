import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { cn } from '@/lib/utils'
import { site } from '@/content/site'
import { navigationRoutes } from '@/content/routes'

/**
 * Layout primitives.
 *
 * The page is built on a two-column grid at >=1024px: a narrow left rail
 * carrying section numbers and mono labels, and the content column beside it.
 * That rail is what stops the page reading as one undifferentiated centred
 * column — it varies where things sit horizontally and gives every section a
 * fixed structural anchor. Below 1024px it collapses and the labels sit inline.
 */

export function Shell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-5xl px-5 sm:px-8">{children}</div>
}

export function Header({ back }: { back?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
      <Shell>
        <div className="flex h-14 items-center justify-between gap-4">
          <a
            href="/"
            className="group inline-flex items-baseline gap-2.5 text-sm font-medium tracking-tight"
          >
            {back && (
              <span
                aria-hidden="true"
                className="text-faint-foreground transition-transform duration-300 ease-[var(--ease-out-quart)] group-hover:-translate-x-0.5"
              >
                ←
              </span>
            )}
            <span className="transition-colors group-hover:text-accent">Nazmul Alam</span>
          </a>
          <ThemeToggle />
        </div>
      </Shell>
    </header>
  )
}

export function Footer() {
  const externalLinks = [
    { href: `mailto:${site.email}`, label: site.email },
    { href: site.github, label: 'GitHub' },
    { href: site.linkedin, label: 'LinkedIn' },
  ]
  return (
    <footer className="mt-24 border-t border-border">
      <Shell>
        <div className="grid gap-8 py-12 lg:grid-cols-[10rem_1fr]">
          <p className="label">Explore</p>
          <div>
            <nav aria-label="Site routes">
              <ul className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
                {navigationRoutes.map((route) => (
                  <li key={route.id}>
                    <a
                      href={route.path}
                      className="link-underline text-foreground/85 transition-colors hover:text-accent"
                    >
                      {route.navigation!.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <p className="label mb-3 mt-8">Elsewhere</p>
            <ul className="flex flex-wrap gap-x-7 gap-y-2 text-sm">
              {externalLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    rel="me noopener"
                    className="link-underline text-foreground/85 transition-colors hover:text-accent"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-faint-foreground">
              {site.location} · © {new Date().getFullYear()} {site.name}
            </p>
          </div>
        </div>
      </Shell>
    </footer>
  )
}

export function Page({ children, back }: { children: ReactNode; back?: boolean }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header back={back} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

/**
 * A numbered section. The index renders in the rail as a mono figure, giving
 * the page the feel of a structured document rather than a scroll of prose.
 */
export function Section({
  id,
  index,
  title,
  children,
  className,
  bleed,
}: {
  id?: string
  index?: string
  title?: string
  children: ReactNode
  className?: string
  bleed?: boolean
}) {
  return (
    <section
      id={id}
      className={cn('scroll-mt-20 border-t border-border first:border-t-0', className)}
    >
      <Shell>
        <div
          className={cn(
            'grid gap-x-10 gap-y-5 py-14 sm:py-16 lg:grid-cols-[10rem_1fr]',
            bleed && 'lg:grid-cols-1',
          )}
        >
          {(title || index) && (
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="label flex items-baseline gap-2">
                {index && <span className="text-accent">{index}</span>}
                {title}
              </p>
            </div>
          )}
          <div className={cn(!title && !index && 'lg:col-span-2')}>{children}</div>
        </div>
      </Shell>
    </section>
  )
}

/** Key/value metadata, set in mono — the "spec block" device. */
export function SpecList({
  items,
  className,
}: {
  items: readonly { key: string; value: ReactNode }[]
  className?: string
}) {
  return (
    <dl
      className={cn(
        'grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5 border-t border-border pt-4',
        className,
      )}
    >
      {items.map((item) => (
        <div key={item.key} className="contents">
          <dt className="label pt-px">{item.key}</dt>
          <dd className="text-sm text-foreground/90">{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
