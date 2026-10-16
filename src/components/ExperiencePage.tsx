import { Page, Section, Shell } from '@/components/Layout'
import { background, content } from '@/content/site'
import { experiencePage } from '@/content/routePages'

export function ExperiencePage() {
  return (
    <Page back>
      <article>
        <header className="relative overflow-hidden border-b border-border">
          <div className="grid-field pointer-events-none absolute inset-0" aria-hidden="true" />
          <Shell>
            <div className="relative grid gap-x-10 gap-y-8 py-16 sm:py-20 lg:grid-cols-[10rem_1fr]">
              <p className="label lg:pt-4">{experiencePage.eyebrow}</p>
              <div>
                <h1
                  className="max-w-[12ch] font-serif font-medium tracking-[-0.028em]"
                  style={{ fontSize: 'var(--text-title)', lineHeight: 1.02 }}
                >
                  {experiencePage.title}
                </h1>
                <p
                  className="mt-6 max-w-[58ch] text-muted-foreground"
                  style={{ fontSize: 'var(--text-lead)', lineHeight: 1.5 }}
                >
                  {experiencePage.introduction}
                </p>
              </div>
            </div>
          </Shell>
        </header>

        <Section index="01" title="Chronology">
          <ol className="divide-y divide-border border-y border-border">
            {content.experience.map((job) => (
              <li key={`${job.company}-${job.period}`} className="grid gap-3 py-7 sm:grid-cols-[1fr_auto]">
                <div>
                  <h2 className="font-serif text-2xl font-medium tracking-[-0.02em]">
                    {'href' in job && job.href ? (
                      <a className="link-underline transition-colors hover:text-accent" href={job.href}>
                        {job.company}
                      </a>
                    ) : (
                      job.company
                    )}
                  </h2>
                  <p className="mt-1 text-sm text-foreground/90">{job.role}</p>
                  {job.note && (
                    <p className="mt-3 max-w-[62ch] text-sm leading-6 text-muted-foreground">
                      {job.note}
                    </p>
                  )}
                </div>
                <div className="sm:text-right">
                  <p className="label tabular text-foreground/80">{job.period}</p>
                  <p className="mt-1 text-sm text-faint-foreground">{job.location}</p>
                </div>
              </li>
            ))}
          </ol>
        </Section>

        <Section index="02" title="Education">
          <div className="max-w-[62ch] border-y border-border py-7">
            <h2 className="font-serif text-2xl font-medium tracking-[-0.02em]">
              {background.education.degree}
            </h2>
            <p className="mt-2 text-sm text-foreground/90">{background.education.school}</p>
            <p className="label mt-3">{background.education.detail}</p>
          </div>
        </Section>

        <Section index="03" title="Certifications">
          <ul className="divide-y divide-border border-y border-border">
            {background.certifications.map((certification) => (
              <li key={certification} className="py-5 text-sm text-foreground/90">
                {certification}
              </li>
            ))}
          </ul>
        </Section>

        <Section index="04" title="Beyond work">
          <div className="prose-editorial max-w-[62ch]">
            <p>{background.volunteering}</p>
            <p>{background.personal}</p>
          </div>
        </Section>
      </article>
    </Page>
  )
}
