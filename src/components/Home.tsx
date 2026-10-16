import { Page, Section, Shell, SpecList } from '@/components/Layout'
import { content, site } from '@/content/site'

/**
 * The hero leads with the durable systems thesis. Current work follows as
 * evidence, so no employer or technology defines the opening identity.
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
            <p className="label mb-5 text-accent">01 · Systems thesis</p>
            <h1
              className="font-serif font-medium tracking-[-0.03em]"
              style={{ fontSize: 'var(--text-display)', lineHeight: 0.94 }}
            >
              {site.name}
            </h1>

            <p
              className="mt-7 max-w-2xl text-muted-foreground"
              style={{ fontSize: 'var(--text-lead)', lineHeight: 1.5 }}
            >
              {content.positioning.thesis}
            </p>

            <SpecList
              className="mt-10 max-w-lg"
              items={[
                { key: 'Role', value: site.title },
                { key: 'Based', value: site.location },
              ]}
            />
          </div>
        </div>
      </Shell>
    </section>
  )
}

function ProofStatement({
  label,
  copy,
}: {
  label: string
  copy: string
}) {
  return (
    <div>
      <p className="label mb-2 text-[0.625rem]">{label}</p>
      <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">{copy}</p>
    </div>
  )
}

function CurrentFrontier() {
  return (
    <Section id="current-frontier" index="02" title="Current frontier">
      <div className="max-w-[62ch]">
        <p
          className="font-serif tracking-[-0.015em]"
          style={{ fontSize: 'var(--text-title)', lineHeight: 1.16 }}
        >
          {content.positioning.currentFrontier}
        </p>
        <div className="mt-8 border-l border-accent pl-5">
          <ProofStatement
            label="Reviewed contribution"
            copy={content.currentWork.contribution.copy}
          />
          <p className="label mt-5 text-[0.625rem] text-faint-foreground">
            Evidence boundary
          </p>
          <p className="mt-2 text-sm leading-relaxed text-faint-foreground">
            {content.currentWork.roleInNarrative}
          </p>
        </div>
      </div>
    </Section>
  )
}

function FlagshipProofs() {
  return (
    <Section id="flagship-proofs" index="03" title="Flagship proofs">
      <ol className="grid gap-10 lg:grid-cols-2">
        {content.flagships.map((story) => (
          <li key={story.slug} className="flex flex-col border-t border-border-strong pt-5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="font-serif text-2xl font-medium tracking-[-0.02em]">
                {story.client}
              </h2>
              <span className="label tabular whitespace-nowrap">{story.period}</span>
            </div>
            <p className="mt-3 text-[0.9375rem] leading-relaxed">{story.summary}</p>

            <div className="mt-6 space-y-5">
              <ProofStatement
                label="Why it mattered · editorial framing"
                copy={story.proof.systemConsequence.copy}
              />
              <ProofStatement
                label="What I owned · reviewed contribution"
                copy={story.proof.exactOwnership.copy}
              />
              <ProofStatement
                label="Observable outcome · reviewed contribution"
                copy={story.proof.observableOutcome.copy}
              />
            </div>

            <a
              href={story.href}
              className="link-underline mt-6 self-start text-sm text-accent"
            >
              Read the {story.client} evidence
            </a>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function DecisionIndex() {
  return (
    <Section id="design-decisions" index="04" title="Design decisions">
      <ul className="divide-y divide-border border-y border-border">
        {content.flagships.map((story) => (
          <li
            key={story.slug}
            className="grid gap-3 py-5 sm:grid-cols-[8rem_1fr]"
          >
            <a
              href={story.href}
              className="label self-start text-accent transition-colors hover:text-foreground"
            >
              {story.client}
            </a>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {story.proof.consequentialDecision.copy}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}

function TechnicalNotes() {
  return (
    <Section id="technical-notes" index="05" title="Technical notes">
      <ol>
        {content.technicalNotes.map((note) => (
          <li key={note.slug} className="border-b border-border py-6 first:pt-0">
            <a href={note.href} className="group block">
              <h2 className="font-serif text-2xl font-medium tracking-[-0.02em] transition-colors group-hover:text-accent">
                {note.workingTitle}
              </h2>
              <p className="mt-3 max-w-[62ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
                {note.purpose}
              </p>
            </a>
            <p className="label mt-5 text-[0.625rem] text-faint-foreground">
              Evidence boundary
            </p>
            <p className="mt-2 max-w-[62ch] text-sm leading-relaxed text-faint-foreground">
              {note.evidenceBoundary}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

function CareerCredibility() {
  return (
    <Section id="career-credibility" index="06" title="Career credibility">
      <p
        className="max-w-[54ch] font-serif tracking-[-0.015em]"
        style={{ fontSize: 'var(--text-title)', lineHeight: 1.16 }}
      >
        {content.credibilityLine}
      </p>
      <a href="/experience/" className="link-underline mt-6 inline-block text-sm text-accent">
        Full experience
      </a>
    </Section>
  )
}

function Contact() {
  return (
    <Section id="contact" index="07" title="Contact">
      <p
        className="max-w-[46ch] font-serif tracking-[-0.015em]"
        style={{ fontSize: 'var(--text-title)', lineHeight: 1.12 }}
      >
        {content.contact.heading}
      </p>
      <p className="mt-6 max-w-[52ch] text-[0.9375rem] leading-relaxed text-muted-foreground">
        {content.contact.invitation}
      </p>
      <p className="mt-6">
        <a href={`mailto:${site.email}`} className="link-underline text-accent">
          {site.email}
        </a>
      </p>
    </Section>
  )
}

export function Home() {
  return (
    <Page>
      <Hero />
      <CurrentFrontier />
      <FlagshipProofs />
      <DecisionIndex />
      <TechnicalNotes />
      <CareerCredibility />
      <Contact />
    </Page>
  )
}
