---
id: "consistency-guarantees-for-deprovisioning"
kind: "technical-note"
title: "Consistency guarantees for deprovisioning during live identity migration"
description: "A generic analysis of why ordinary profile changes and security-sensitive deprovisioning need different consistency guarantees during live migration."
permalink: "/notes/consistency-guarantees-for-deprovisioning/"
publicationState: "published"
visibility: "public"
reviewed: true
source: {"kind":"original","evidence":["Reviewed generic first-person lessons may be used, but client systems remain genericised and public patterns must not be presented as proprietary architecture."]}
knowledgeState: "analysis"
order: 20
links: []
references: []
---

A live identity migration temporarily creates more than one path by which identity state can be written, copied, or read. The central design question is not whether every field is instantly consistent. It is which inconsistency windows are acceptable for each consequence.

A delayed display-name update is stale data. A delayed disable, revocation, or deprovision event can preserve access. Those events should not inherit the same guarantees merely because they share a transport.

## Choose an authority before adding paths

Every migration phase needs a stated authority for each class of state. Dual writes without an authority rule turn disagreement into guesswork; dual reads without precedence can let an older path silently restore stale state.

For ordinary profile attributes, a bounded convergence window may be acceptable. For access-removing events, the safe authority rule should prevent a stale path from granting access after a newer path has removed it.

## State the security invariant directly

The useful invariant is stronger than “events are eventually delivered.” Once a disable or revocation is accepted by the authoritative path, no participating read path should continue to authorize solely from older state.

That may require synchronous acknowledgement, a deny marker that dominates older data, fail-closed reads during uncertainty, or another mechanism appropriate to the system. The mechanism can vary; the invariant should not be implicit.

## Make cutover and rollback asymmetric

A profile migration can often roll back by returning reads to the old path and reconciling later. Access-removing state cannot safely roll back if doing so resurrects an older authorization decision.

Cutover therefore needs evidence by event class: reconciliation is caught up, both paths agree on security-sensitive state, and rollback preserves revocations even if ordinary attributes return to the previous authority.

## Failure window across two identity paths

The sequence compares the tolerable convergence of a profile update with the stronger boundary needed for access removal.

### 01 · Coexistence

Old and new identity paths both participate during migration.

**Invariant:** Authority and precedence are explicit for each event class.

**Observe:** Source version, path, write acknowledgement.

### 02 · Profile change

A non-security attribute reaches one path before the other.

**Invariant:** Reads may be stale only within the declared convergence window.

**Observe:** Version lag and reconciliation age.

### 03 · Disable

The authority accepts a disable, revoke, or deprovision event.

**Invariant:** Older state cannot continue to grant access.

**Observe:** Authoritative version and revocation acknowledgement.

### 04 · Delayed propagation

One path is slow, unavailable, or holding stale state.

**Invariant:** Uncertainty resolves toward denied access, not stale allowance.

**Observe:** Propagation state, deny marker, read-path decision.

### 05 · Reconciliation

The lagging path compares state with the authority.

**Invariant:** Security state dominates conflicting older profile state.

**Observe:** Mismatch class, repair action, completion proof.

### 06 · Cutover or rollback

Traffic moves to the new path or returns to the old path.

**Invariant:** No transition can resurrect revoked access.

**Observe:** Cutover gate, rollback gate, post-transition audit.

## Consistency-invariant matrix

The guarantees differ by consequence; eventual consistency is not categorically wrong for identity data.

| Event class | Read and write guarantee | Reconciliation | Cutover and rollback |
| --- | --- | --- | --- |
| Profile update | Authoritative write with bounded asynchronous propagation. | Repair version drift within a declared window. | Cut over when lag is within policy; rollback may restore the prior read path. |
| Disable | Acknowledged removal must dominate stale enabled state. | Prioritize and verify disagreement immediately. | Both paths deny before cutover; rollback retains the disable. |
| Session revoke | Reads must not authorize from a superseded session state. | Propagate or consult revocation state before allowance. | Revocation survives either routing direction. |
| Deprovision | Removal is monotonic across participating paths. | A stale create or update cannot recreate access. | No unresolved security mismatch at cutover or rollback. |

## Evidence boundary

### Generic lessons, not a client architecture

My rule from migration work is to set consistency guarantees by consequence: ordinary profile changes can often tolerate bounded convergence, while deprovisioning needs stronger and explicitly verified treatment.

The authority, coexistence, reconciliation, cutover, and rollback patterns here are intentionally generic. They do not describe a customer-specific system, proprietary identifier, unpublished timing, or migration scale.
