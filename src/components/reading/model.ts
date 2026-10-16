import type {
  CurrentWorkProof,
  EvidenceStatement,
  FlagshipStory,
  OfficialContext,
  SupportingProof,
} from '../../content/site'

export type ReaderHeading = { depth: number; slug: string; text: string }
export type WorkStudy = FlagshipStory | SupportingProof | CurrentWorkProof
export type StudySection = ReaderHeading & { statement: EvidenceStatement }

const flagshipStages = [
  ['systemConsequence', 'System consequence'],
  ['exactOwnership', 'Exact ownership'],
  ['consequentialDecision', 'Consequential decision'],
  ['sanitizedMechanism', 'Sanitized mechanism'],
  ['rolloutAndOperations', 'Rollout and operations'],
  ['observableOutcome', 'Observable outcome'],
  ['retrospective', 'Retrospective'],
] as const satisfies readonly (readonly [keyof FlagshipStory['proof'], string])[]

export const studyTierLabels = {
  flagship: 'Flagship case study',
  'supporting-proof': 'Supporting migration evidence',
  'current-work-note': 'Current-work note',
} as const

export const evidenceLabels = {
  'editorial-consequence-framing': 'Editorial consequence framing',
  'reviewed-self-attestation': 'Reviewed first-person account',
} as const

export function studySections(study: WorkStudy): StudySection[] {
  if (study.tier === 'flagship') {
    return flagshipStages.map(([key, text]) => ({
      depth: 2,
      slug: key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`),
      text,
      statement: study.proof[key],
    }))
  }
  return [{
    depth: 2,
    slug: 'contribution',
    text: study.tier === 'supporting-proof' ? 'Migration contribution' : 'Current work',
    statement: study.contribution,
  }]
}

export function officialSources(study: WorkStudy): readonly OfficialContext[] {
  const context = study.officialContext
  return 'url' in context ? [context] : context
}

export const experienceContents = [
  { depth: 2, slug: 'chronology', text: 'Chronology' },
  { depth: 2, slug: 'education', text: 'Education' },
  { depth: 2, slug: 'certifications', text: 'Certifications' },
  { depth: 2, slug: 'beyond-work', text: 'Beyond work' },
] as const satisfies readonly ReaderHeading[]
