/**
 * Single source of truth for site content.
 *
 * REVIEW BEFORE PUBLISHING. First-person contribution statements are reviewed
 * self-attestation. Editorial framing and official public context are separate
 * evidence classes and must not be presented as corroborating those statements.
 */

const CISCO_TITLE = 'Senior Software Engineer'
const CISCO_START = 'May 2026'

export type EvidenceClass =
  | 'editorial-consequence-framing'
  | 'reviewed-self-attestation'
  | 'official-public-context'

export type EvidenceStatement = {
  copy: string
  evidenceClass: Exclude<EvidenceClass, 'official-public-context'>
}

export type OfficialContext = {
  label: string
  url: string
  evidenceClass: 'official-public-context'
  boundary: string
}

export type PublicationBoundary = {
  allowed: readonly string[]
  excluded: readonly string[]
}

export type WorkSummary = {
  slug: 'cisco' | 'fidelity' | 'hmh' | 'optum'
  client: string
  href: string
  period: string
  role: string
  summary: string
  stack: readonly string[]
}

export type FlagshipProof = {
  systemConsequence: EvidenceStatement
  exactOwnership: EvidenceStatement
  consequentialDecision: EvidenceStatement
  sanitizedMechanism: EvidenceStatement
  rolloutAndOperations: EvidenceStatement
  observableOutcome: EvidenceStatement
  retrospective: EvidenceStatement
}

export type FlagshipStory = WorkSummary & {
  tier: 'flagship'
  proof: FlagshipProof
  officialContext: OfficialContext
  publicationBoundary: PublicationBoundary
}

export type SupportingProof = WorkSummary & {
  tier: 'supporting-proof'
  contribution: EvidenceStatement
  roleInNarrative: string
  officialContext: OfficialContext
  publicationBoundary: PublicationBoundary
}

export type CurrentWorkProof = WorkSummary & {
  tier: 'current-work-note'
  contribution: EvidenceStatement
  roleInNarrative: string
  officialContext: readonly OfficialContext[]
  publicationBoundary: PublicationBoundary
}

export type TechnicalNoteDescriptor = {
  slug: string
  href: string
  workingTitle: string
  purpose: string
  evidenceBoundary: string
  minimumArtifacts: readonly string[]
  excluded: readonly string[]
}

export type Job = {
  role: string
  company: string
  location: string
  period: string
  note?: string
  href?: string
}

export type SiteContentContract = {
  positioning: {
    thesis: string
    currentFrontier: string
    audience: readonly string[]
    leadershipBoundary: string
  }
  currentWork: CurrentWorkProof
  flagships: readonly [FlagshipStory, FlagshipStory]
  supportingProof: SupportingProof
  technicalNotes: readonly [TechnicalNoteDescriptor, TechnicalNoteDescriptor]
  credibilityLine: string
  contact: {
    heading: string
    invitation: string
  }
  experience: readonly Job[]
}

export const site = {
  name: 'Nazmul Alam',
  shortName: 'Naz',
  email: 'hello@nalam.me',
  location: 'Galway, Ireland',
  url: 'https://nalam.me',
  github: 'https://github.com/naz-mul',
  linkedin: 'https://www.linkedin.com/in/nalam',
  title: `${CISCO_TITLE}, Cisco`,
  description:
    'Senior software engineer designing distributed backends for latency-sensitive and high-consequence platforms.',
} as const

const cisco = {
  tier: 'current-work-note',
  slug: 'cisco',
  client: 'Cisco',
  href: '/work/cisco/',
  period: `${CISCO_START} — Present`,
  role: CISCO_TITLE,
  summary:
    'Current work at the real-time voice frontier, bounded to personally implemented test and codec work.',
  stack: ['Real-time audio', 'Speech-to-speech testing', 'G.711 A-law'],
  contribution: {
    copy:
      'At Cisco, I built a speech-to-speech load-testing simulator and implemented G.711 A-law support.',
    evidenceClass: 'reviewed-self-attestation',
  },
  roleInNarrative:
    'Current evidence of the durable systems thesis, not a completed impact story or the whole professional identity.',
  officialContext: [
    {
      label: 'Webex Contact Center BYOVA',
      url: 'https://developer.webex.com/webex-contact-center/docs/bring-your-own-virtual-agent',
      evidenceClass: 'official-public-context',
      boundary:
        'Public product context only; it does not corroborate this contribution or describe an internal Cisco implementation.',
    },
    {
      label: 'Cisco public G711A codec listing',
      url: 'https://developer.cisco.com/docs/packaged-contact-center/virtualized-voice-browser-configuration-api/',
      evidenceClass: 'official-public-context',
      boundary:
        'Public codec context only; it does not establish internal adoption, rollout, performance, or outcome.',
    },
  ],
  publicationBoundary: {
    allowed: [
      'The reviewed simulator and G.711 A-law contribution.',
      'Generic lessons that do not reveal internal implementation or evaluation details.',
    ],
    excluded: [
      'Turn-taking or interruption orchestration ownership.',
      'Vendor evaluation, load-test matrices, tested capacity, or customer scale.',
      'Internal architecture, objectives, rollout, release readiness, adoption, or outcomes.',
    ],
  },
} as const satisfies CurrentWorkProof

const hmh = {
  tier: 'flagship',
  slug: 'hmh',
  client: 'Houghton Mifflin Harcourt',
  href: '/work/hmh/',
  period: 'Aug 2024 — Jul 2025',
  role: 'Senior Software Engineer (contract)',
  summary:
    'A live identity-platform migration shaped by continuity, cutover, and consequence-sensitive consistency.',
  stack: ['Identity platforms', 'Event-driven synchronization', 'Provisioning'],
  proof: {
    systemConsequence: {
      copy:
        'For a school district, changing the identity platform is not a background infrastructure swap. The transition has to preserve a dependable route into the learning systems people already use.',
      evidenceClass: 'editorial-consequence-framing',
    },
    exactOwnership: {
      copy:
        'At HMH, I was an early contributor who led implementation of an identity-platform migration for a school district.',
      evidenceClass: 'reviewed-self-attestation',
    },
    consequentialDecision: {
      copy:
        'I chose event-driven synchronization for identity changes instead of polling downstream state or coupling the provisioning path directly to every consumer. That kept the migration paths separable, while security-sensitive deprovisioning required stronger handling than ordinary profile changes.',
      evidenceClass: 'reviewed-self-attestation',
    },
    sanitizedMechanism: {
      copy:
        'I built provisioning services that interacted with an identity platform and emitted identity-change events for downstream consumers. The mechanism covered creation, updates, and deprovisioning without exposing customer-specific architecture or proprietary identifiers.',
      evidenceClass: 'reviewed-self-attestation',
    },
    rolloutAndOperations: {
      copy:
        'The integration supported a gradual cutover in which migration paths could coexist during the transition, rather than requiring every dependent system to change in one step.',
      evidenceClass: 'reviewed-self-attestation',
    },
    observableOutcome: {
      copy:
        'A district identity migration was implemented with downstream synchronization carried by identity-change events.',
      evidenceClass: 'reviewed-self-attestation',
    },
    retrospective: {
      copy:
        'The consistency guarantee should follow the consequence of delay. Eventual consistency can be reasonable for ordinary profile changes; deprovisioning deserves stronger, explicitly verified treatment because stale access is a security condition, not merely stale data.',
      evidenceClass: 'reviewed-self-attestation',
    },
  },
  officialContext: {
    label: 'HMH district SAML SSO guidance',
    url: 'https://support.hmhco.com/s/article/set-up-saml-sso-rostering-hmh-heinemann',
    evidenceClass: 'official-public-context',
    boundary:
      'District SSO context only; it does not identify the district or corroborate the project, contribution, rollout, or outcome.',
  },
  publicationBoundary: {
    allowed: [
      'Reviewed technical implementation ownership and the sanitized seven-stage proof.',
      'Gradual cutover and coexistence without claiming completion or zero disruption.',
    ],
    excluded: [
      'Customer identity, user count, unpublished timing, or customer-specific capacity.',
      'Proprietary identifiers, internal architecture, or measured operational impact.',
      'People-management implications or the word “pioneer”.',
    ],
  },
} as const satisfies FlagshipStory

const optum = {
  tier: 'flagship',
  slug: 'optum',
  client: 'Optum',
  href: '/work/optum/',
  period: 'Oct 2021 — Apr 2023',
  role: 'Senior Software Engineer (contract)',
  summary:
    'Technical design and implementation for healthcare-data work where analytical usefulness and stewardship shaped the same boundary.',
  stack: ['Analytical data', 'Governed APIs', 'Observability'],
  proof: {
    systemConsequence: {
      copy:
        'Healthcare-data systems make technical decisions consequential: the work has to make useful analysis possible while treating data stewardship as a design constraint.',
      evidenceClass: 'editorial-consequence-framing',
    },
    exactOwnership: {
      copy:
        'At Optum, I led technical design and implementation for healthcare-data work, including architecture, design decisions, and coordination.',
      evidenceClass: 'reviewed-self-attestation',
    },
    consequentialDecision: {
      copy:
        'I decided per report how much aggregation belonged in the analytical store and how much belonged in the API, rather than imposing one uniform rule. Pushing aggregation down reduced data movement; retaining it in the API preserved flexibility for consumer-specific needs.',
      evidenceClass: 'reviewed-self-attestation',
    },
    sanitizedMechanism: {
      copy:
        'I designed and implemented a governed API layer over an analytical data store. Access boundaries were part of the data and API design, and operational instrumentation made the service observable without exposing internal names or detailed architecture.',
      evidenceClass: 'reviewed-self-attestation',
    },
    rolloutAndOperations: {
      copy:
        'I worked with dashboard and frontend engineers to shape the API around reporting needs, and added operational instrumentation around the service so its behaviour could be examined during delivery and use.',
      evidenceClass: 'reviewed-self-attestation',
    },
    observableOutcome: {
      copy:
        'The work delivered an API boundary supporting dashboard and reporting workflows over regulated analytical data.',
      evidenceClass: 'reviewed-self-attestation',
    },
    retrospective: {
      copy:
        'Aggregation placement is workload-specific: the useful boundary depends on query shape, data movement, and the flexibility consumers need. In regulated analytical systems, governance and consumer workflows have to shape the API boundary together.',
      evidenceClass: 'reviewed-self-attestation',
    },
  },
  officialContext: {
    label: 'Optum data and analytics',
    url: 'https://business.optum.com/en/data-analytics.html',
    evidenceClass: 'official-public-context',
    boundary:
      'Sector context only; it does not prove a particular system, contribution, architecture, adoption, or outcome.',
  },
  publicationBoundary: {
    allowed: [
      'Reviewed technical design and implementation ownership.',
      'The sanitized seven-stage proof and bounded delivery outcome.',
    ],
    excluded: [
      'A specific product, customer, dataset, internal architecture, or scale.',
      'Measured reliability, adoption, incident, customer, or business outcomes.',
      'Team, line, or people-management claims and organization-wide authority.',
    ],
  },
} as const satisfies FlagshipStory

const fidelity = {
  tier: 'supporting-proof',
  slug: 'fidelity',
  client: 'Fidelity Investments',
  href: '/work/fidelity/',
  period: 'Sep 2025 — Apr 2026',
  role: 'Senior Software Engineer (contract)',
  summary:
    'Collaborative evidence of working through workflow-service modernization and migration trade-offs.',
  stack: ['Workflow services', 'Modernization', 'Migration'],
  contribution: {
    copy:
      'At Fidelity, I contributed to modernising workflow services, including architecture discussions, design decisions, and migration work.',
    evidenceClass: 'reviewed-self-attestation',
  },
  roleInNarrative:
    'Supporting modernization proof; the available evidence does not support a deep impact or completion story.',
  officialContext: {
    label: 'XTRAC workflow and document-management overview',
    url: 'https://www.xtracsolutions.com/DOCS/1-WorkHub/5.0/WorkHub/Content/NewtoXTRAC.htm',
    evidenceClass: 'official-public-context',
    boundary:
      'Product context only; it does not corroborate Fidelity implementation details, this contribution, or a migration result.',
  },
  publicationBoundary: {
    allowed: [
      'Collaborative contribution to architecture discussions, design decisions, and migration work.',
      'Generic modernization and retirement trade-offs.',
    ],
    excluded: [
      'Implementation-stack and internal-architecture details.',
      'Sole ownership, completed migration, service retirement, scale, performance, or operational outcomes.',
      'Architecture shape presented as impact.',
    ],
  },
} as const satisfies SupportingProof

export const content = {
  positioning: {
    thesis:
      'I design distributed backends for latency-sensitive and high-consequence platforms — systems that must remain correct while changing and responsive while parts fail.',
    currentFrontier:
      'Voice AI is my current frontier: another place where latency, partial failure, and system boundaries become visible to the person using the system.',
    audience: [
      'Staff and principal engineers, technical founders, and startup CTOs.',
      'Engineering directors and hiring managers.',
      'Recruiters who need clear role vocabulary and compact chronology.',
    ],
    leadershipBoundary:
      'Leadership means technical design ownership: designing, deciding, implementing, operating, and aligning around systems. It does not imply people management or organization-wide authority.',
  },
  currentWork: cisco,
  flagships: [hmh, optum],
  supportingProof: fidelity,
  technicalNotes: [
    {
      slug: 'testing-real-time-voice-orchestration-under-interruption',
      href: '/notes/testing-real-time-voice-orchestration-under-interruption/',
      workingTitle: 'Testing real-time voice orchestration under interruption',
      purpose:
        'A public-source engineering analysis of turn boundaries, interruption and barge-in, duplex timing, codec boundaries, backpressure, and observable failure modes.',
      evidenceBoundary:
        'The analysis is not a Cisco case study. A separate current-work sidebar may state only the reviewed simulator and G.711 A-law contribution.',
      minimumArtifacts: [
        'An annotated session timeline or state model.',
        'A compact scenario matrix covering normal turns, overlap, barge-in, codec conversion, and degraded dependencies.',
      ],
      excluded: [
        'Cisco turn-taking or interruption-orchestration ownership.',
        'Cisco architecture, vendor evaluation, internal test matrices, capacity, rollout, adoption, or outcomes.',
        'Any implication that public-source analysis describes Cisco implementation.',
      ],
    },
    {
      slug: 'consistency-guarantees-for-deprovisioning',
      href: '/notes/consistency-guarantees-for-deprovisioning/',
      workingTitle: 'Consistency guarantees for deprovisioning during live identity migration',
      purpose:
        'A generic analysis of why ordinary profile changes and security-sensitive deprovisioning need different consistency guarantees during live migration.',
      evidenceBoundary:
        'Reviewed generic first-person lessons may be used, but client systems remain genericised and public patterns must not be presented as proprietary architecture.',
      minimumArtifacts: [
        'A consistency-invariant matrix.',
        'A failure-window sequence comparing profile changes with disable, revoke, and deprovision events.',
      ],
      excluded: [
        'Customer counts, unpublished timing, proprietary identifiers, or architecture.',
        'Unreviewed operational detail or invented metrics.',
        'Claims that eventual consistency is unsafe for every identity attribute.',
      ],
    },
  ],
  credibilityLine:
    'A decade across payments, identity, healthcare data, financial workflows, and real-time voice systems.',
  contact: {
    heading: 'For considered technical conversations.',
    invitation:
      'I welcome peer conversations about real-time systems, difficult migrations, and backend platforms, as well as unusually consequential technical roles.',
  },
  experience: [
    {
      role: CISCO_TITLE,
      company: 'Cisco',
      location: 'Galway',
      period: `${CISCO_START} — Present`,
      note: 'Speech-to-speech load-testing simulator and G.711 A-law support.',
      href: '/work/cisco/',
    },
    {
      role: 'Senior Software Engineer (contract)',
      company: 'Fidelity Investments',
      location: 'Galway',
      period: 'Sep 2025 — Apr 2026',
      note: 'Collaborative workflow-service modernization and migration work.',
      href: '/work/fidelity/',
    },
    {
      role: 'Senior Software Engineer (contract)',
      company: 'Houghton Mifflin Harcourt',
      location: 'Dublin',
      period: 'Aug 2024 — Jul 2025',
      note: 'Led implementation of an identity-platform migration for a school district.',
      href: '/work/hmh/',
    },
    {
      role: 'Senior Software Engineer (contract)',
      company: 'Cisco',
      location: 'Galway',
      period: 'Jul 2023 — Apr 2024',
      note: 'Backend work on a demonstration platform.',
    },
    {
      role: 'Senior Software Engineer (contract)',
      company: 'Optum',
      location: 'Dublin',
      period: 'Oct 2021 — Apr 2023',
      note: 'Technical design and implementation for healthcare-data work.',
      href: '/work/optum/',
    },
    {
      role: 'Software Engineer',
      company: 'WP Engine',
      location: 'Limerick',
      period: 'Apr 2021 — Sep 2021',
      note: 'User portal, billing, and signup work. Cut single-page render from 7s to 2s.',
    },
    {
      role: 'Software Engineer',
      company: 'Fexco',
      location: 'Killorglin, Kerry',
      period: 'Jan 2016 — Mar 2021',
      note: 'Payments and financial services. Apache Camel work cut response times from 5 minutes to 1.5.',
    },
  ],
} as const satisfies SiteContentContract

/** Compatibility exports keep current consumers type-safe until later route/layout tickets. */
export const heroLine = content.positioning.thesis

export const nowText = [
  content.currentWork.contribution.copy,
  content.positioning.currentFrontier,
] as const

const flagshipStageOrder = [
  'systemConsequence',
  'exactOwnership',
  'consequentialDecision',
  'sanitizedMechanism',
  'rolloutAndOperations',
  'observableOutcome',
  'retrospective',
] as const satisfies readonly (keyof FlagshipProof)[]

const flagshipStageHeadings: Record<keyof FlagshipProof, string> = {
  systemConsequence: 'System consequence',
  exactOwnership: 'Exact ownership',
  consequentialDecision: 'Consequential decision',
  sanitizedMechanism: 'Sanitized mechanism',
  rolloutAndOperations: 'Rollout and operations',
  observableOutcome: 'Observable outcome',
  retrospective: 'Retrospective',
}

export type CaseStudy = WorkSummary & {
  tier: FlagshipStory['tier'] | SupportingProof['tier'] | CurrentWorkProof['tier']
  sections: readonly { heading: string; body: readonly string[] }[]
}

function asFlagshipCaseStudy(story: FlagshipStory): CaseStudy {
  return {
    ...story,
    sections: flagshipStageOrder.map((stage) => ({
      heading: flagshipStageHeadings[stage],
      body: [story.proof[stage].copy],
    })),
  }
}

export const caseStudies: readonly CaseStudy[] = [
  ...content.flagships.map(asFlagshipCaseStudy),
  {
    ...content.supportingProof,
    sections: [
      {
        heading: 'Contribution',
        body: [content.supportingProof.contribution.copy],
      },
      {
        heading: 'Evidence boundary',
        body: [content.supportingProof.roleInNarrative],
      },
    ],
  },
  {
    ...content.currentWork,
    sections: [
      {
        heading: 'Current work',
        body: [content.currentWork.contribution.copy],
      },
      {
        heading: 'Evidence boundary',
        body: [content.currentWork.roleInNarrative],
      },
    ],
  },
]

export const experience: readonly Job[] = content.experience

export const background = {
  education: {
    degree: 'BSc Computing with Software Development',
    school: 'Munster Technological University',
    detail: 'First Class Honours, 2017',
  },
  certifications: [
    'Professional Scrum Master I — Scrum.org',
    'Kubernetes in Practice — Jetstack',
    'Docker — GuruTeam',
  ],
  volunteering:
    'Since 2019 I have built and maintained the website and backend for the Kerry Islamic Cultural Centre.',
  personal:
    'Outside work I cook, take photographs, and travel more than is strictly sensible.',
} as const
