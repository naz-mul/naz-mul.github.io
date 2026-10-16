import { Page, Section, Shell } from '@/components/Layout'
import { getTechnicalNote, type TechnicalNoteSlug } from '@/content/routePages'

export function TechnicalNotePage({ slug }: { slug: TechnicalNoteSlug }) {
  const note = getTechnicalNote(slug)

  return (
    <Page back>
      <article>
        <header className="relative overflow-hidden border-b border-border">
          <div className="grid-field pointer-events-none absolute inset-0" aria-hidden="true" />
          <Shell>
            <div className="relative grid gap-x-10 gap-y-8 py-16 sm:py-20 lg:grid-cols-[10rem_1fr]">
              <p className="label lg:pt-4">Technical note</p>
              <div>
                <h1
                  className="max-w-[18ch] font-serif font-medium tracking-[-0.028em]"
                  style={{ fontSize: 'var(--text-title)', lineHeight: 1.02 }}
                >
                  {note.title}
                </h1>
                <div
                  className="mt-7 max-w-[62ch] text-muted-foreground"
                  style={{ fontSize: 'var(--text-lead)', lineHeight: 1.5 }}
                >
                  {note.introduction.map((paragraph) => (
                    <p key={paragraph} className="mt-4 first:mt-0">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </Shell>
        </header>

        {note.principles.map((principle, index) => (
          <Section
            key={principle.heading}
            index={String(index + 1).padStart(2, '0')}
            title={principle.heading}
          >
            <div className="prose-editorial max-w-[62ch]">
              {principle.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </Section>
        ))}

        <Section index="04" title={note.timeline.heading} className="bg-surface-sunken">
          <p className="max-w-[62ch] text-sm leading-6 text-muted-foreground">
            {note.timeline.introduction}
          </p>
          <ol className="mt-8 divide-y divide-border-strong border-y border-border-strong">
            {note.timeline.steps.map((step) => (
              <li key={step.phase} className="grid gap-4 py-6 sm:grid-cols-[8rem_1fr]">
                <p className="label text-accent">{step.phase}</p>
                <div>
                  <p className="font-serif text-xl font-medium tracking-[-0.015em]">{step.event}</p>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="label">Invariant</dt>
                      <dd className="mt-1.5 leading-6 text-foreground/90">{step.invariant}</dd>
                    </div>
                    <div>
                      <dt className="label">Observe</dt>
                      <dd className="mt-1.5 leading-6 text-foreground/90">{step.observe}</dd>
                    </div>
                  </dl>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section index="05" title={note.matrix.heading}>
          <p className="max-w-[62ch] text-sm leading-6 text-muted-foreground">
            {note.matrix.introduction}
          </p>
          <div className="mt-8 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
              <thead>
                <tr className="border-y border-border-strong">
                  {note.matrix.columns.map((column) => (
                    <th key={column} className="label px-3 py-4 first:pl-0 last:pr-0">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {note.matrix.rows.map((row) => (
                  <tr key={row.scenario} className="align-top">
                    <th className="px-3 py-5 pl-0 font-medium text-foreground">{row.scenario}</th>
                    <td className="px-3 py-5 leading-6 text-muted-foreground">{row.pressure}</td>
                    <td className="px-3 py-5 leading-6 text-muted-foreground">
                      {row.requiredBehaviour}
                    </td>
                    <td className="px-3 py-5 pr-0 leading-6 text-muted-foreground">
                      {row.evidence}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section index="06" title={note.sidebar.label}>
          <aside
            aria-labelledby={`${note.slug}-sidebar`}
            className="border-l-2 border-accent bg-accent-quiet px-6 py-7 sm:px-8"
          >
            <h2
              id={`${note.slug}-sidebar`}
              className="font-serif text-2xl font-medium tracking-[-0.02em]"
            >
              {note.sidebar.heading}
            </h2>
            <div className="mt-5 max-w-[62ch] space-y-4 text-sm leading-6 text-foreground/90">
              {note.sidebar.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </aside>
        </Section>

        {note.sources.length > 0 && (
          <Section index="07" title="Official public context">
            <ul className="divide-y divide-border border-y border-border">
              {note.sources.map((source) => (
                <li key={source.url} className="py-6">
                  <a
                    href={source.url}
                    className="link-underline font-medium transition-colors hover:text-accent"
                  >
                    {source.label} ↗
                  </a>
                  <p className="mt-2 max-w-[62ch] text-sm leading-6 text-muted-foreground">
                    {source.boundary}
                  </p>
                </li>
              ))}
            </ul>
          </Section>
        )}
      </article>
    </Page>
  )
}
