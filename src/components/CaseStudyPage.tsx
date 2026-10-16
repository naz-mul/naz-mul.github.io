import { Page, Section, Shell, SpecList } from '@/components/Layout'
import {
  content,
  type EvidenceStatement,
  type FlagshipStory,
  type OfficialContext,
} from '@/content/site'

const SECTION_INDEX = (i: number) => String(i + 1).padStart(2, '0')

const FLAGSHIP_STAGES = [
  { key: 'systemConsequence', heading: 'System consequence' },
  { key: 'exactOwnership', heading: 'Exact ownership' },
  { key: 'consequentialDecision', heading: 'Consequential decision' },
  { key: 'sanitizedMechanism', heading: 'Sanitized mechanism' },
  { key: 'rolloutAndOperations', heading: 'Rollout and operations' },
  { key: 'observableOutcome', heading: 'Observable outcome' },
  { key: 'retrospective', heading: 'Retrospective' },
] as const satisfies readonly {
  key: keyof FlagshipStory['proof']
  heading: string
}[]

const TIER_LABELS = {
  flagship: 'Flagship case study',
  'supporting-proof': 'Supporting migration evidence',
  'current-work-note': 'Current-work note',
} as const

const EVIDENCE_LABELS = {
  'editorial-consequence-framing': 'Editorial consequence framing',
  'reviewed-self-attestation': 'Reviewed first-person account',
} as const

const studies = [
  ...content.flagships,
  content.supportingProof,
  content.currentWork,
] as const

function EvidenceCopy({ statement }: { statement: EvidenceStatement }) {
  return (
    <div className="max-w-[62ch]">
      <p className="label mb-4 text-faint-foreground">
        {EVIDENCE_LABELS[statement.evidenceClass]}
      </p>
      <div className="prose-editorial">
        <p>{statement.copy}</p>
      </div>
    </div>
  )
}

function FlagshipEvidence({ study }: { study: FlagshipStory }) {
  return FLAGSHIP_STAGES.map((stage, i) => (
    <Section
      key={stage.key}
      index={SECTION_INDEX(i)}
      title={stage.heading}
      className={stage.key === 'consequentialDecision' ? 'bg-surface-sunken' : undefined}
    >
      <EvidenceCopy statement={study.proof[stage.key]} />
    </Section>
  ))
}

function OfficialContextList({
  context,
}: {
  context: OfficialContext | readonly OfficialContext[]
}) {
  const items = Array.isArray(context) ? context : [context]

  return (
    <Section index="—" title="Official context" className="bg-surface-sunken">
      <div className="max-w-[62ch]">
        <p className="label mb-4 text-faint-foreground">Separate domain context</p>
        <ul className="border-t border-border">
          {items.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                rel="noopener"
                className="group flex items-baseline justify-between gap-5 border-b border-border py-4 transition-colors duration-300 hover:border-accent"
              >
                <span className="text-sm font-medium transition-colors group-hover:text-accent">
                  {item.label}
                </span>
                <span aria-hidden="true" className="text-faint-foreground">
                  ↗
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

/**
 * Case-study template.
 *
 * The depth of the document follows the available evidence: HMH and Optum use
 * the seven-stage flagship sequence, while Fidelity and Cisco remain visibly
 * shallower. Evidence classes are labelled and official context stays separate
 * from the first-person project account.
 */
export function CaseStudyPage({ slug }: { slug: string }) {
  const study = studies.find((candidate) => candidate.slug === slug)
  if (!study) throw new Error(`Unknown case study: ${slug}`)

  const others = studies.filter((candidate) => candidate.slug !== slug)

  return (
    <Page back>
      <article>
        <header className="relative overflow-hidden border-b border-border">
          <div className="grid-field pointer-events-none absolute inset-0" aria-hidden="true" />
          <Shell>
            <div className="relative grid gap-x-10 gap-y-8 py-16 sm:py-20 lg:grid-cols-[10rem_1fr]">
              <p className="label lg:pt-4">{TIER_LABELS[study.tier]}</p>
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
                    { key: 'Evidence', value: TIER_LABELS[study.tier] },
                    { key: 'Stack', value: study.stack.join(' · ') },
                  ]}
                />
              </div>
            </div>
          </Shell>
        </header>

        {study.tier === 'flagship' ? (
          <FlagshipEvidence study={study} />
        ) : (
          <Section
            index="01"
            title={study.tier === 'supporting-proof' ? 'Migration contribution' : 'Current work'}
          >
            <EvidenceCopy statement={study.contribution} />
          </Section>
        )}

        <OfficialContextList context={study.officialContext} />
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
                <span className="flex flex-col items-end gap-1">
                  <span className="label text-faint-foreground">{TIER_LABELS[other.tier]}</span>
                  <span className="label tabular whitespace-nowrap">{other.period}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Section>
    </Page>
  )
}
