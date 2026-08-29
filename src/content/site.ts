/**
 * Single source of truth for site content.
 *
 * ⚠️ REVIEW BEFORE PUBLISHING. Every case study below was drafted from the CV in
 * docs/resume/ plus what was agreed during planning. Nothing here is invented, but
 * it is written in the first person on your behalf — read it as your own claim.
 */

const CISCO_TITLE = 'Senior Software Engineer'
const CISCO_START = 'May 2026'

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
    'Senior software engineer in Galway. I build real-time voice AI for contact centres at Cisco, and have spent a decade on backend systems in payments, healthcare, identity and finance.',
} as const

/** The one line under the name. Specific beats comprehensive. */
export const heroLine =
  'I build the real-time layer of speech-to-speech voice AI for contact centres at Cisco — the part where a conversation has to feel like a conversation.'

export const nowText = [
  `At Cisco I work on contact-centre voice AI: the systems that let a caller talk to a
   machine and be understood without noticing the machinery. My focus is orchestration —
   session lifecycle, turn-taking, interruption handling, and the calls out to business
   systems that happen mid-conversation — inside a latency budget that a human ear
   notices long before a dashboard does.`,
  `Before that I spent five years contracting across financial services, education
   technology, healthcare analytics and Cisco's own demo platform. Most of that work was
   the same shape: an existing system that mattered, a constraint that made the obvious
   answer wrong, and a migration that had to happen without anyone noticing.`,
] as const

export type CaseStudy = {
  slug: string
  client: string
  href: string
  period: string
  role: string
  summary: string
  stack: readonly string[]
  sections: readonly { heading: string; body: readonly string[] }[]
}

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: 'cisco',
    client: 'Cisco',
    href: '/work/cisco/',
    period: `${CISCO_START} — Present`,
    role: CISCO_TITLE,
    summary:
      'Orchestrating speech-to-speech voice AI for contact centres, where the hard constraint is the length of a pause a caller will tolerate.',
    stack: ['Real-time audio', 'Speech-to-speech AI', 'Orchestration', 'Kubernetes'],
    sections: [
      {
        heading: 'Context',
        body: [
          `A contact centre is an unusually unforgiving place to put a conversational
           model. The caller is on a phone line, often distracted, frequently annoyed,
           and has no visual feedback to tell them anything is happening. Every
           millisecond between the end of their sentence and the start of the reply is
           dead air they interpret as the system being broken.`,
          `My work sits in the orchestration layer: the component that owns the
           conversation as a stateful thing. It decides when the caller has finished
           speaking, when the system may speak, what happens when they talk over each
           other, what business systems get called mid-turn, and when the whole thing
           should stop and hand over to a person.`,
        ],
      },
      {
        heading: 'Constraints',
        body: [
          `The latency budget is the constraint everything else negotiates against. It is
           not a single number you optimise once — it is a chain, and every link wants
           more of it than it should have: audio arriving over the network, deciding the
           turn has ended, the model producing a response, any lookup that response
           depends on, and audio getting back to the caller.`,
          `The second constraint is that people interrupt. A voice system that cannot be
           interrupted mid-sentence is worse than a menu tree, because it removes the one
           thing callers do when a machine misunderstands them. Handling that properly
           means the system has to be willing to abandon work it has already started and
           partially delivered.`,
          `The third is that this runs on real telephony for real customers, so
           degradation has to be graceful. There is no error page on a phone call.`,
        ],
      },
      {
        heading: 'Trade-offs',
        body: [
          `Turn detection is the clearest example of a trade-off with no correct answer.
           Wait longer before responding and you almost never cut the caller off, but
           every exchange gains a pause that makes the system feel slow. Wait less and
           the system is responsive but starts talking over people mid-thought. The
           tuning is not a technical optimum; it is a judgement about which failure
           annoys people less, and it differs by the kind of call.`,
          `The same tension shows up in whether to call out to business systems during a
           turn or before one. Fetching data mid-turn gives a better answer and costs
           latency in the place where latency is most visible. Prefetching costs
           correctness when the conversation goes somewhere you did not predict.`,
        ],
      },
      {
        heading: 'What carries over',
        body: [
          `The parts of this that feel new — a model in the loop, audio streaming in both
           directions — sit on top of problems I have had before: distributed state,
           partial failure, backpressure, and the discipline of knowing which number you
           are actually optimising. Real-time voice mostly punishes the same mistakes
           faster and more publicly.`,
        ],
      },
    ],
  },
  {
    slug: 'fidelity',
    client: 'Fidelity Investments',
    href: '/work/fidelity/',
    period: 'Sep 2025 — Apr 2026',
    role: 'Senior Software Engineer (contract)',
    summary:
      'Modernising a legacy Node.js workflow platform into Spring Boot on Java 21, without pausing the business that depended on it.',
    stack: ['Java 21', 'Spring Boot', 'Node.js', 'Kubernetes', 'Datadog'],
    sections: [
      {
        heading: 'Context',
        body: [
          `XTRAC handles workflow automation, batch processing and document management —
           the unglamorous machinery that financial operations actually run on. The
           existing services were Node.js, written years earlier, and had reached the
           point where the cost of changing them safely exceeded the cost of replacing
           them.`,
          `The target was Spring Boot on Java 21, deployed to Kubernetes with full
           observability through Datadog.`,
        ],
      },
      {
        heading: 'Constraints',
        body: [
          `Nothing could stop. These are processes with deadlines attached — batches that
           must complete, documents that must be produced — so a migration that required
           a quiet weekend was not available.`,
          `Behaviour had to be preserved exactly, including behaviour nobody had
           documented and some that was arguably wrong. In a system of record, a bug that
           downstream processes have adapted to is a feature until proven otherwise.`,
        ],
      },
      {
        heading: 'What I did',
        body: [
          `Translated asynchronous Node.js logic into fault-tolerant Spring Boot services,
           service by service rather than as a single cutover, so each piece could be
           proven in production before the next one moved.`,
          `Instrumented deliberately rather than by default. In a batch system the useful
           signals are not request rates — they are how long a run took relative to its
           window, where it stalled, and which documents failed. Datadog was set up to
           answer those questions directly.`,
        ],
      },
      {
        heading: 'Trade-offs',
        body: [
          `Rewriting asynchronous JavaScript into Java is where the interesting decisions
           are. The idiomatic Java version of a Node.js callback chain is often
           structurally different, and the choice each time is between a faithful
           translation that is easy to verify against the original, and an idiomatic one
           that is easier to maintain afterwards. Early in a migration, verifiability is
           worth more; later, it stops being.`,
        ],
      },
    ],
  },
  {
    slug: 'hmh',
    client: 'Houghton Mifflin Harcourt',
    href: '/work/hmh/',
    period: 'Aug 2024 — Jul 2025',
    role: 'Senior Software Engineer (contract)',
    summary:
      'Leading a migration from an in-house authentication system to Okta, keeping identity consistent across systems during a live cutover.',
    stack: ['Okta', 'Kafka', 'Java', 'Spring Boot', 'WebClient'],
    sections: [
      {
        heading: 'Context',
        body: [
          `HMH ran its own authentication system. The task was to move to Okta — not as a
           greenfield integration, but as a replacement for something that already held
           every user and that every other system trusted.`,
        ],
      },
      {
        heading: 'Constraints',
        body: [
          `Identity migrations are unusually unforgiving. A failed deployment can be
           rolled back; a user who cannot log in has already had the outage. And because
           education platforms have sharp seasonal peaks, the windows where a mistake is
           survivable are narrow and known well in advance.`,
          `The deeper constraint was that user state lived in more than one place. Okta
           becoming the source of truth did not stop other systems needing to know, more
           or less immediately, when a user was created, changed or deprovisioned.`,
        ],
      },
      {
        heading: 'What I did',
        body: [
          `Architected the integration and built the provisioning services against Okta's
           REST APIs using WebClient — creation, updates and deprovisioning, with the
           failure semantics made explicit rather than assumed.`,
          `Used Kafka to synchronise user events across systems, so downstream consumers
           reacted to identity changes as events rather than by polling or by being
           called directly. That decoupling is what made a gradual cutover possible.`,
        ],
      },
      {
        heading: 'Trade-offs',
        body: [
          `Event-driven synchronisation buys decoupling and pays for it in consistency:
           between Okta changing and a downstream system knowing, the two disagree. For
           most identity attributes that window is harmless. For deprovisioning it is
           not, and those paths deserved different treatment rather than uniform
           eventual consistency.`,
        ],
      },
    ],
  },
  {
    slug: 'optum',
    client: 'Optum',
    href: '/work/optum/',
    period: 'Oct 2021 — Apr 2023',
    role: 'Senior Software Engineer (contract)',
    summary:
      'Leading the design of an analytics gateway serving pharmaceutical claims and rebate data, under the constraints that regulated healthcare data brings.',
    stack: ['Java', 'Spring Boot', 'Azure Synapse Analytics', 'Splunk', 'TypeScript'],
    sections: [
      {
        heading: 'Context',
        body: [
          `The Emisar Analytics Gateway served pharmaceutical manufacturers with
           dashboards and reporting over claims and rebate data. I led its design and
           architecture over roughly eighteen months.`,
        ],
      },
      {
        heading: 'Constraints',
        body: [
          `Healthcare claims data is regulated, commercially sensitive, and belongs to
           parties who are frequently competitors. Access control is not a feature layered
           on afterwards — it is a property the data model has to hold, because the
           consequence of getting it wrong is not a bug report.`,
          `Analytical queries over claims are also large. The shape of the workload is the
           opposite of the transactional systems most of this stack is designed for.`,
        ],
      },
      {
        heading: 'What I did',
        body: [
          `Led the architecture, and built the APIs on Java and Spring Boot over Azure
           Synapse Analytics for the analytical workload.`,
          `Integrated Splunk and ElasticSearch for observability, and worked directly with
           the frontend engineers building the dashboards — an API for analytics is shaped
           by what the charts need, and designing it without that conversation produces
           something technically correct and awkward to use.`,
        ],
      },
      {
        heading: 'Trade-offs',
        body: [
          `The recurring decision was how much aggregation belongs in the warehouse versus
           the API. Pushing it down is faster and less flexible; keeping it in the API
           layer stays flexible and moves volumes of data that do not need moving. The
           answer differed per report, which meant resisting a single uniform pattern.`,
        ],
      },
    ],
  },
] as const

export type Job = {
  role: string
  company: string
  location: string
  period: string
  note?: string
  href?: string
}

export const experience: readonly Job[] = [
  {
    role: CISCO_TITLE,
    company: 'Cisco',
    location: 'Galway',
    period: `${CISCO_START} — Present`,
    note: 'Contact-centre speech-to-speech voice AI.',
    href: '/work/cisco/',
  },
  {
    role: 'Senior Software Engineer (contract)',
    company: 'Fidelity Investments',
    location: 'Galway',
    // NOTE: the CV records this as 09/2025 – Present (it predates the Cisco move), so the
    // end month is inferred from the Cisco start date. Confirm before publishing.
    period: 'Sep 2025 — Apr 2026',
    note: 'XTRAC workflow platform: Node.js to Spring Boot on Java 21.',
    href: '/work/fidelity/',
  },
  {
    role: 'Senior Software Engineer (contract)',
    company: 'Houghton Mifflin Harcourt',
    location: 'Dublin',
    period: 'Aug 2024 — Jul 2025',
    note: 'Authentication migration to Okta, event-driven with Kafka.',
    href: '/work/hmh/',
  },
  {
    role: 'Senior Software Engineer (contract)',
    company: 'Cisco',
    location: 'Galway',
    period: 'Jul 2023 — Apr 2024',
    note: 'dCloud demonstration platform: Kotlin and Spring Boot microservices on Kubernetes.',
  },
  {
    role: 'Senior Software Engineer (contract)',
    company: 'Optum',
    location: 'Dublin',
    period: 'Oct 2021 — Apr 2023',
    note: 'Emisar Analytics Gateway for pharmaceutical claims and rebates.',
    href: '/work/optum/',
  },
  {
    role: 'Software Engineer',
    company: 'WP Engine',
    location: 'Limerick',
    period: 'Apr 2021 — Sep 2021',
    note: 'Ruby on Rails user portal, billing and signup. Cut single-page render from 7s to 2s.',
  },
  {
    role: 'Software Engineer',
    company: 'Fexco',
    location: 'Killorglin, Kerry',
    period: 'Jan 2016 — Mar 2021',
    note: 'Payments and financial services. Apache Camel work cut response times from 5 minutes to 1.5. Mentored trainee developers.',
  },
] as const

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
