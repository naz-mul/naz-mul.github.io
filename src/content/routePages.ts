import { content } from './site.ts'

export const experiencePage = {
  eyebrow: 'Experience',
  title: 'A decade of backend systems.',
  introduction:
    'Work across payments, identity, healthcare data, financial workflows, and real-time voice systems, followed by education and professional certifications.',
} as const

export type TechnicalNoteSlug =
  | 'testing-real-time-voice-orchestration-under-interruption'
  | 'consistency-guarantees-for-deprovisioning'

export type NoteTimelineStep = {
  phase: string
  event: string
  invariant: string
  observe: string
}

export type NoteMatrixRow = {
  scenario: string
  pressure: string
  requiredBehaviour: string
  evidence: string
}

export type TechnicalNote = {
  slug: TechnicalNoteSlug
  href: string
  title: string
  description: string
  introduction: readonly string[]
  principles: readonly {
    heading: string
    body: readonly string[]
  }[]
  timeline: {
    heading: string
    introduction: string
    steps: readonly NoteTimelineStep[]
  }
  matrix: {
    heading: string
    introduction: string
    columns: readonly [string, string, string, string]
    rows: readonly NoteMatrixRow[]
  }
  sidebar: {
    label: string
    heading: string
    body: readonly string[]
  }
  sources: readonly {
    label: string
    url: string
    boundary: string
  }[]
}

const approvedNotes = new Map(content.technicalNotes.map((note) => [note.slug, note]))

function approvedDescriptor(slug: TechnicalNoteSlug) {
  const descriptor = approvedNotes.get(slug)
  if (!descriptor) throw new Error(`Missing approved technical-note descriptor: ${slug}`)
  return descriptor
}

const voiceDescriptor = approvedDescriptor(
  'testing-real-time-voice-orchestration-under-interruption',
)

const voiceNote = {
  slug: voiceDescriptor.slug,
  href: voiceDescriptor.href,
  title: voiceDescriptor.workingTitle,
  description: voiceDescriptor.purpose,
  introduction: [
    'A representative voice-system test is not a sequence of independent requests. It is a timed conversation in which input, output, cancellation, and transport state overlap.',
    'The useful unit of testing is therefore the session boundary: what the system believed was happening, what the caller could hear, and how quickly every component reacted when that state changed.',
  ],
  principles: [
    {
      heading: 'Model interaction, not throughput alone',
      body: [
        'Requests per second can describe pressure on a service, but it cannot describe whether a spoken exchange remains coherent. A voice test needs explicit turn states, media direction, and timestamps for transitions between listening, responding, interrupting, cancelling, and draining.',
        'That state model makes timing attributable. It separates transport delay from turn detection, model response, audio production, queueing, and playback instead of collapsing them into one end-to-end number.',
      ],
    },
    {
      heading: 'Treat interruption as a state transition',
      body: [
        'Barge-in is not merely new input arriving early. The system has to detect speech while output is active, stop or invalidate work already in flight, prevent stale audio from leaking into playback, and establish the next authoritative turn.',
        'The test should record both reaction time and correctness: when interruption was detected, when cancellation was issued, how much audio remained buffered, and whether any cancelled response crossed the audible boundary.',
      ],
    },
    {
      heading: 'Make codec and backpressure boundaries visible',
      body: [
        'A session can be logically correct and still fail at a media boundary. Frame size, cadence, codec conversion, and duplex timing belong in the scenario model because they change buffering and expose assumptions hidden by idealized audio.',
        'Backpressure should be observable at each queue rather than inferred from a final timeout. Queue depth, dropped or late frames, cancellation age, and dependency latency show whether the session sheds work coherently or simply accumulates delay.',
      ],
    },
  ],
  timeline: {
    heading: 'Annotated interruption timeline',
    introduction:
      'The timeline is a state-and-measurement model, not a description of any Cisco implementation.',
    steps: [
      {
        phase: '01 · Input',
        event: 'Speech frames enter while the session is listening.',
        invariant: 'Frame order and media clock remain monotonic.',
        observe: 'Ingress cadence, jitter, codec, queue depth.',
      },
      {
        phase: '02 · Turn boundary',
        event: 'The system marks the caller turn as actionable.',
        invariant: 'One authoritative input turn is opened.',
        observe: 'Detection time, buffered audio, boundary confidence.',
      },
      {
        phase: '03 · Response',
        event: 'Response work begins and output frames become available.',
        invariant: 'Output is associated with the active turn.',
        observe: 'First-work and first-audio latency, output cadence.',
      },
      {
        phase: '04 · Interruption',
        event: 'New caller speech arrives while output is active.',
        invariant: 'The new input can supersede the speaking state.',
        observe: 'Barge-in detection and reaction timestamps.',
      },
      {
        phase: '05 · Cancel and drain',
        event: 'In-flight response work is cancelled or invalidated.',
        invariant: 'Cancelled audio cannot cross the playback boundary.',
        observe: 'Cancellation age, queued frames, leaked audio.',
      },
      {
        phase: '06 · Resume',
        event: 'The interrupted speech becomes the next active turn.',
        invariant: 'No stale response can reclaim session authority.',
        observe: 'Recovery latency, state transitions, error cause.',
      },
    ],
  },
  matrix: {
    heading: 'Scenario matrix',
    introduction:
      'Each scenario applies pressure to a different boundary and needs an observable correctness condition.',
    columns: ['Scenario', 'Pressure', 'Required behaviour', 'Evidence'],
    rows: [
      {
        scenario: 'Normal turn',
        pressure: 'Baseline timing',
        requiredBehaviour: 'One input turn produces ordered output without overlap.',
        evidence: 'Boundary timestamps and media cadence.',
      },
      {
        scenario: 'Natural overlap',
        pressure: 'Duplex timing',
        requiredBehaviour: 'Concurrent media is classified without corrupting turn state.',
        evidence: 'Directional frames and state-transition log.',
      },
      {
        scenario: 'Barge-in',
        pressure: 'Cancellation',
        requiredBehaviour: 'New speech supersedes output and stale audio is contained.',
        evidence: 'Detection-to-stop time and leaked-frame count.',
      },
      {
        scenario: 'Codec conversion',
        pressure: 'Media boundary',
        requiredBehaviour: 'Cadence, ordering, and duration survive conversion.',
        evidence: 'Frame metadata, decode errors, duration drift.',
      },
      {
        scenario: 'Degraded dependency',
        pressure: 'Backpressure',
        requiredBehaviour: 'Queues remain bounded and failure is attributed explicitly.',
        evidence: 'Queue depth, timeout cause, cancellation age.',
      },
    ],
  },
  sidebar: {
    label: 'Current-work boundary',
    heading: 'A deliberately narrow personal contribution',
    body: [
      content.currentWork.contribution.copy,
      'That self-attested contribution is separate from the public-source analysis on this page. It does not claim ownership of Cisco turn-taking or interruption orchestration, and it makes no statement about internal architecture, evaluation, capacity, rollout, adoption, or outcomes.',
    ],
  },
  sources: content.currentWork.officialContext.map(({ label, url, boundary }) => ({
    label,
    url,
    boundary,
  })),
} as const satisfies TechnicalNote

const identityDescriptor = approvedDescriptor('consistency-guarantees-for-deprovisioning')

const identityNote = {
  slug: identityDescriptor.slug,
  href: identityDescriptor.href,
  title: identityDescriptor.workingTitle,
  description: identityDescriptor.purpose,
  introduction: [
    'A live identity migration temporarily creates more than one path by which identity state can be written, copied, or read. The central design question is not whether every field is instantly consistent. It is which inconsistency windows are acceptable for each consequence.',
    'A delayed display-name update is stale data. A delayed disable, revocation, or deprovision event can preserve access. Those events should not inherit the same guarantees merely because they share a transport.',
  ],
  principles: [
    {
      heading: 'Choose an authority before adding paths',
      body: [
        'Every migration phase needs a stated authority for each class of state. Dual writes without an authority rule turn disagreement into guesswork; dual reads without precedence can let an older path silently restore stale state.',
        'For ordinary profile attributes, a bounded convergence window may be acceptable. For access-removing events, the safe authority rule should prevent a stale path from granting access after a newer path has removed it.',
      ],
    },
    {
      heading: 'State the security invariant directly',
      body: [
        'The useful invariant is stronger than “events are eventually delivered.” Once a disable or revocation is accepted by the authoritative path, no participating read path should continue to authorize solely from older state.',
        'That may require synchronous acknowledgement, a deny marker that dominates older data, fail-closed reads during uncertainty, or another mechanism appropriate to the system. The mechanism can vary; the invariant should not be implicit.',
      ],
    },
    {
      heading: 'Make cutover and rollback asymmetric',
      body: [
        'A profile migration can often roll back by returning reads to the old path and reconciling later. Access-removing state cannot safely roll back if doing so resurrects an older authorization decision.',
        'Cutover therefore needs evidence by event class: reconciliation is caught up, both paths agree on security-sensitive state, and rollback preserves revocations even if ordinary attributes return to the previous authority.',
      ],
    },
  ],
  timeline: {
    heading: 'Failure window across two identity paths',
    introduction:
      'The sequence compares the tolerable convergence of a profile update with the stronger boundary needed for access removal.',
    steps: [
      {
        phase: '01 · Coexistence',
        event: 'Old and new identity paths both participate during migration.',
        invariant: 'Authority and precedence are explicit for each event class.',
        observe: 'Source version, path, write acknowledgement.',
      },
      {
        phase: '02 · Profile change',
        event: 'A non-security attribute reaches one path before the other.',
        invariant: 'Reads may be stale only within the declared convergence window.',
        observe: 'Version lag and reconciliation age.',
      },
      {
        phase: '03 · Disable',
        event: 'The authority accepts a disable, revoke, or deprovision event.',
        invariant: 'Older state cannot continue to grant access.',
        observe: 'Authoritative version and revocation acknowledgement.',
      },
      {
        phase: '04 · Delayed propagation',
        event: 'One path is slow, unavailable, or holding stale state.',
        invariant: 'Uncertainty resolves toward denied access, not stale allowance.',
        observe: 'Propagation state, deny marker, read-path decision.',
      },
      {
        phase: '05 · Reconciliation',
        event: 'The lagging path compares state with the authority.',
        invariant: 'Security state dominates conflicting older profile state.',
        observe: 'Mismatch class, repair action, completion proof.',
      },
      {
        phase: '06 · Cutover or rollback',
        event: 'Traffic moves to the new path or returns to the old path.',
        invariant: 'No transition can resurrect revoked access.',
        observe: 'Cutover gate, rollback gate, post-transition audit.',
      },
    ],
  },
  matrix: {
    heading: 'Consistency-invariant matrix',
    introduction:
      'The guarantees differ by consequence; eventual consistency is not categorically wrong for identity data.',
    columns: ['Event class', 'Read and write guarantee', 'Reconciliation', 'Cutover and rollback'],
    rows: [
      {
        scenario: 'Profile update',
        pressure: 'Authoritative write with bounded asynchronous propagation.',
        requiredBehaviour: 'Repair version drift within a declared window.',
        evidence: 'Cut over when lag is within policy; rollback may restore the prior read path.',
      },
      {
        scenario: 'Disable',
        pressure: 'Acknowledged removal must dominate stale enabled state.',
        requiredBehaviour: 'Prioritize and verify disagreement immediately.',
        evidence: 'Both paths deny before cutover; rollback retains the disable.',
      },
      {
        scenario: 'Session revoke',
        pressure: 'Reads must not authorize from a superseded session state.',
        requiredBehaviour: 'Propagate or consult revocation state before allowance.',
        evidence: 'Revocation survives either routing direction.',
      },
      {
        scenario: 'Deprovision',
        pressure: 'Removal is monotonic across participating paths.',
        requiredBehaviour: 'A stale create or update cannot recreate access.',
        evidence: 'No unresolved security mismatch at cutover or rollback.',
      },
    ],
  },
  sidebar: {
    label: 'Evidence boundary',
    heading: 'Generic lessons, not a client architecture',
    body: [
      'My rule from migration work is to set consistency guarantees by consequence: ordinary profile changes can often tolerate bounded convergence, while deprovisioning needs stronger and explicitly verified treatment.',
      'The authority, coexistence, reconciliation, cutover, and rollback patterns here are intentionally generic. They do not describe a customer-specific system, proprietary identifier, unpublished timing, or migration scale.',
    ],
  },
  sources: [],
} as const satisfies TechnicalNote

export const technicalNotes = [voiceNote, identityNote] as const

export function getTechnicalNote(slug: TechnicalNoteSlug): TechnicalNote {
  const note = technicalNotes.find((candidate) => candidate.slug === slug)
  if (!note) throw new Error(`Unknown technical note: ${slug}`)
  return note
}
