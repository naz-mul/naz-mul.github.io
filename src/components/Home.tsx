import { Page, Section, Shell, SpecList } from '@/components/Layout'
import {
  background,
  caseStudies,
  experience,
  heroLine,
  nowText,
  site,
} from '@/content/site'

/**
 * The hero has to do the job a product screenshot would do elsewhere: none of
 * this work is publicly showable. It does it with scale and a spec block —
 * the name set very large against a hairline grid field, then hard facts in
 * mono. Structure standing in for imagery.
 */
function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="grid-field pointer-events-none absolute inset-0" aria-hidden="true" />
      <Shell>
        <div className="relative grid gap-x-10 gap-y-10 py-20 sm:py-28 lg:grid-cols-[10rem_1fr]">
          <div className="lg:pt-2">
            {/*
              Portrait crop rather than a square, and colour rather than grayscale —
              a desaturated square reads dated, and the page needed the warmth.
              The hairline frame is offset behind the image so it reads as a printed
              plate rather than a bordered box, matching the rules used elsewhere.
            */}
            <div className="group relative w-36">
              <div
                aria-hidden="true"
                className="absolute inset-0 translate-x-1.5 translate-y-1.5 border border-border-strong transition-transform duration-500 ease-[var(--ease-out-quart)] group-hover:translate-x-1 group-hover:translate-y-1"
              />
              <img
                src="/img/profile.jpg"
                /* Decorative: the <h1> beside it already announces the name. */
                alt=""
                width={144}
                height={180}
                fetchPriority="high"
                className="relative aspect-[4/5] w-36 object-cover object-top saturate-[0.92] transition-[filter,transform] duration-500 ease-[var(--ease-out-quart)] group-hover:saturate-100"
              />
            </div>
          </div>

          <div>
            <h1
              className="font-serif font-medium tracking-[-0.03em]"
              style={{ fontSize: 'var(--text-display)', lineHeight: 0.94 }}
            >
              Nazmul Alam
            </h1>

            <p
              className="mt-7 max-w-2xl text-muted-foreground"
              style={{ fontSize: 'var(--text-lead)', lineHeight: 1.5 }}
            >
              {heroLine}
            </p>

            <SpecList
              className="mt-10 max-w-lg"
              items={[
                { key: 'Role', value: site.title },
                { key: 'Based', value: site.location },
                { key: 'Focus', value: 'Real-time voice AI · distributed backends' },
                { key: 'Since', value: <span className="tabular">2016</span> },
              ]}
            />
          </div>
        </div>
      </Shell>
    </section>
  )
}

function Now() {
  return (
    <Section id="now" index="01" title="Now">
      <div className="prose-editorial max-w-[62ch]">
        {nowText.map((paragraph, i) => (
          <p key={i} className={i > 0 ? 'mt-4' : undefined}>
            {i === 0 ? (
              <>
                <span className="newthought">At Cisco</span>
                {paragraph.replace(/^\s*At Cisco/, '')}
              </>
            ) : (
              paragraph
            )}
          </p>
        ))}
      </div>
    </Section>
  )
}

/**
 * Case-study cards have no thumbnails to lean on, so they are built from type
 * and rules instead: a large serif client name, the summary, and the stack as
 * mono tags. The whole row is the hit target and the rule brightens on hover.
 */
function SelectedWork() {
  return (
    <Section id="work" index="02" title="Selected work">
      <ul className="-mt-2">
        {caseStudies.map((study, i) => (
          <li key={study.slug}>
            <a
              href={study.href}
              className="group block border-b border-border py-7 transition-colors duration-300 hover:border-accent"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                <h3 className="font-serif text-2xl font-medium tracking-[-0.02em] transition-colors duration-300 group-hover:text-accent sm:text-[1.75rem]">
                  {study.client}
                </h3>
                <span className="label tabular whitespace-nowrap">{study.period}</span>
              </div>

              <p className="mt-2.5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                {study.summary}
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                {study.stack.map((item) => (
                  <span
                    key={item}
                    className="label border border-border px-1.5 py-0.5 text-[0.625rem] tracking-[0.1em]"
                  >
                    {item}
                  </span>
                ))}
                <span
                  aria-hidden="true"
                  className="label ml-auto text-accent opacity-0 transition-all duration-300 ease-[var(--ease-out-quart)] group-hover:translate-x-0.5 group-hover:opacity-100"
                >
                  Read →
                </span>
              </div>
              <span className="sr-only">Read the {study.client} case study</span>
              {i === -1 && null}
            </a>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function Experience() {
  return (
    <Section id="experience" index="03" title="Experience">
      <ol className="space-y-0">
        {experience.map((job) => (
          <li
            key={`${job.company}-${job.period}`}
            className="grid gap-x-8 gap-y-1 border-b border-border py-5 last:border-b-0 sm:grid-cols-[10.5rem_1fr]"
          >
            <p className="label tabular whitespace-nowrap pt-1">{job.period}</p>
            <div>
              <h3 className="font-medium tracking-tight">
                {job.role} <span className="text-faint-foreground">·</span> {job.company}
              </h3>
              {job.note && (
                <p className="mt-1.5 max-w-[58ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                  {job.note}{' '}
                  {job.href && (
                    <a
                      href={job.href}
                      className="link-underline whitespace-nowrap text-accent"
                    >
                      Read more
                    </a>
                  )}
                </p>
              )}
              <p className="mt-1 text-[0.8125rem] text-faint-foreground">{job.location}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function Background() {
  return (
    <Section id="background" index="04" title="Background">
      <div className="grid gap-10 sm:grid-cols-2">
        <div>
          <p className="text-[0.9375rem] leading-relaxed">
            <strong className="font-medium">{background.education.degree}</strong>
            <br />
            <span className="text-muted-foreground">
              {background.education.school} — {background.education.detail}
            </span>
          </p>
          <ul className="mt-6 space-y-1.5">
            {background.certifications.map((cert) => (
              <li key={cert} className="text-[0.875rem] text-muted-foreground">
                {cert}
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-4 text-[0.9375rem] leading-relaxed text-muted-foreground">
          <p>{background.volunteering}</p>
          <p>{background.personal}</p>
        </div>
      </div>
    </Section>
  )
}

function Contact() {
  return (
    <Section id="contact" index="05" title="Contact">
      <p
        className="max-w-[46ch] font-serif tracking-[-0.015em]"
        style={{ fontSize: 'var(--text-title)', lineHeight: 1.12 }}
      >
        Say hello —{' '}
        <a href={`mailto:${site.email}`} className="link-underline text-accent">
          {site.email}
        </a>
      </p>
      <p className="mt-6 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
        I am not looking for work, but I am always glad to talk about real-time systems,
        voice interfaces, or the parts of a migration that never make it into the
        write-up.
      </p>
    </Section>
  )
}

export function Home() {
  return (
    <Page>
      <Hero />
      <Now />
      <SelectedWork />
      <Experience />
      <Background />
      <Contact />
    </Page>
  )
}
