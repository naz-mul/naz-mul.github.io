import { Page, Section, Shell, SpecList } from '@/components/Layout'
import { caseStudies } from '@/content/site'

const SECTION_INDEX = (i: number) => String(i + 1).padStart(2, '0')

/**
 * Case-study template.
 *
 * The visual problem here is that there is nothing to show — no screenshots, no
 * repos, no diagrams. So the page is built as a document: a spec block of hard
 * facts under the title, numbered sections anchored in the rail, and the
 * trade-offs section pulled out as the centrepiece, because that section is the
 * thing that distinguishes a case study from a job description.
 */
export function CaseStudyPage({ slug }: { slug: string }) {
  const study = caseStudies.find((s) => s.slug === slug)
  if (!study) throw new Error(`Unknown case study: ${slug}`)

  const others = caseStudies.filter((s) => s.slug !== slug)

  return (
    <Page back>
      <article>
        <header className="relative overflow-hidden border-b border-border">
          <div className="grid-field pointer-events-none absolute inset-0" aria-hidden="true" />
          <Shell>
            <div className="relative grid gap-x-10 gap-y-8 py-16 sm:py-20 lg:grid-cols-[10rem_1fr]">
              <p className="label lg:pt-4">Case study</p>
              <div>
                <h1
                  className="font-serif font-medium tracking-[-0.028em]"
                  style={{ fontSize: 'var(--text-title)', lineHeight: 1.02 }}
                >
                  {study.client}
                </h1>
                <p
                  className="mt-6 max-w-[54ch] text-muted-foreground"
                  style={{ fontSize: 'var(--text-lead)', lineHeight: 1.5 }}
                >
                  {study.summary}
                </p>
                <SpecList
                  className="mt-10 max-w-lg"
                  items={[
                    { key: 'Period', value: <span className="tabular">{study.period}</span> },
                    { key: 'Role', value: study.role },
                    { key: 'Stack', value: study.stack.join(' · ') },
                  ]}
                />
              </div>
            </div>
          </Shell>
        </header>

        {study.sections.map((section, i) => {
          const isTradeoffs = /trade-?offs/i.test(section.heading)
          return (
            <Section
              key={section.heading}
              index={SECTION_INDEX(i)}
              title={section.heading}
              className={isTradeoffs ? 'bg-surface-sunken' : undefined}
            >
              <div className="prose-editorial max-w-[62ch]">
                {section.body.map((paragraph, j) => (
                  <p key={j} className={j > 0 ? 'mt-4' : undefined}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </Section>
          )
        })}
      </article>

      <Section index="—" title="Other work">
        <ul>
          {others.map((other) => (
            <li key={other.slug}>
              <a
                href={other.href}
                className="group flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border py-5 transition-colors duration-300 hover:border-accent"
              >
                <span className="font-serif text-xl font-medium tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent">
                  {other.client}
                </span>
                <span className="label tabular whitespace-nowrap">{other.period}</span>
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  )
}
