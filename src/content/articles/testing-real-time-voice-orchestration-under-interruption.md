---
id: "testing-real-time-voice-orchestration-under-interruption"
kind: "technical-note"
title: "Testing real-time voice orchestration under interruption"
description: "A public-source engineering analysis of turn boundaries, interruption and barge-in, duplex timing, codec boundaries, backpressure, and observable failure modes."
permalink: "/notes/testing-real-time-voice-orchestration-under-interruption/"
publicationState: "published"
visibility: "public"
reviewed: true
source: {"kind":"original","evidence":["The analysis is not a Cisco case study. A separate current-work sidebar may state only the reviewed simulator and G.711 A-law contribution."]}
knowledgeState: "analysis"
order: 10
links: [{"label":"Webex Contact Center BYOVA","url":"https://developer.webex.com/webex-contact-center/docs/bring-your-own-virtual-agent","reviewed":true},{"label":"Cisco public G711A codec listing","url":"https://developer.cisco.com/docs/packaged-contact-center/virtualized-voice-browser-configuration-api/","reviewed":true}]
references: ["cisco"]
---

A representative voice-system test is not a sequence of independent requests. It is a timed conversation in which input, output, cancellation, and transport state overlap.

The useful unit of testing is therefore the session boundary: what the system believed was happening, what the caller could hear, and how quickly every component reacted when that state changed.

## Model interaction, not throughput alone

Requests per second can describe pressure on a service, but it cannot describe whether a spoken exchange remains coherent. A voice test needs explicit turn states, media direction, and timestamps for transitions between listening, responding, interrupting, cancelling, and draining.

That state model makes timing attributable. It separates transport delay from turn detection, model response, audio production, queueing, and playback instead of collapsing them into one end-to-end number.

## Treat interruption as a state transition

Barge-in is not merely new input arriving early. The system has to detect speech while output is active, stop or invalidate work already in flight, prevent stale audio from leaking into playback, and establish the next authoritative turn.

The test should record both reaction time and correctness: when interruption was detected, when cancellation was issued, how much audio remained buffered, and whether any cancelled response crossed the audible boundary.

## Make codec and backpressure boundaries visible

A session can be logically correct and still fail at a media boundary. Frame size, cadence, codec conversion, and duplex timing belong in the scenario model because they change buffering and expose assumptions hidden by idealized audio.

Backpressure should be observable at each queue rather than inferred from a final timeout. Queue depth, dropped or late frames, cancellation age, and dependency latency show whether the session sheds work coherently or simply accumulates delay.

## Annotated interruption timeline

The timeline is a state-and-measurement model, not a description of any Cisco implementation.

### 01 · Input

Speech frames enter while the session is listening.

**Invariant:** Frame order and media clock remain monotonic.

**Observe:** Ingress cadence, jitter, codec, queue depth.

### 02 · Turn boundary

The system marks the caller turn as actionable.

**Invariant:** One authoritative input turn is opened.

**Observe:** Detection time, buffered audio, boundary confidence.

### 03 · Response

Response work begins and output frames become available.

**Invariant:** Output is associated with the active turn.

**Observe:** First-work and first-audio latency, output cadence.

### 04 · Interruption

New caller speech arrives while output is active.

**Invariant:** The new input can supersede the speaking state.

**Observe:** Barge-in detection and reaction timestamps.

### 05 · Cancel and drain

In-flight response work is cancelled or invalidated.

**Invariant:** Cancelled audio cannot cross the playback boundary.

**Observe:** Cancellation age, queued frames, leaked audio.

### 06 · Resume

The interrupted speech becomes the next active turn.

**Invariant:** No stale response can reclaim session authority.

**Observe:** Recovery latency, state transitions, error cause.

## Scenario matrix

Each scenario applies pressure to a different boundary and needs an observable correctness condition.

| Scenario | Pressure | Required behaviour | Evidence |
| --- | --- | --- | --- |
| Normal turn | Baseline timing | One input turn produces ordered output without overlap. | Boundary timestamps and media cadence. |
| Natural overlap | Duplex timing | Concurrent media is classified without corrupting turn state. | Directional frames and state-transition log. |
| Barge-in | Cancellation | New speech supersedes output and stale audio is contained. | Detection-to-stop time and leaked-frame count. |
| Codec conversion | Media boundary | Cadence, ordering, and duration survive conversion. | Frame metadata, decode errors, duration drift. |
| Degraded dependency | Backpressure | Queues remain bounded and failure is attributed explicitly. | Queue depth, timeout cause, cancellation age. |

## Current-work boundary

### A deliberately narrow personal contribution

At Cisco, I built a speech-to-speech load-testing simulator and implemented G.711 A-law support.

That self-attested contribution is separate from the public-source analysis on this page. It does not claim ownership of Cisco turn-taking or interruption orchestration, and it makes no statement about internal architecture, evaluation, capacity, rollout, adoption, or outcomes.

## Official public context

### [Webex Contact Center BYOVA](https://developer.webex.com/webex-contact-center/docs/bring-your-own-virtual-agent)

Public product context only; it does not corroborate this contribution or describe an internal Cisco implementation.

### [Cisco public G711A codec listing](https://developer.cisco.com/docs/packaged-contact-center/virtualized-voice-browser-configuration-api/)

Public codec context only; it does not establish internal adoption, rollout, performance, or outcome.
