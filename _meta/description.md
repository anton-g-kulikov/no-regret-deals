No Regret Deals: Bounded Alignment

1. Purpose

A privacy-preserving mechanism for low-information, high-regret transactions where the goal is not price discovery, but safe agreement.

Core principle:

A deal should happen only if both parties are already compatible within declared flexibility, without either side revealing or discovering the other side’s private range.

⸻

2. Actors

Two parties:

* Party A — e.g. company, buyer, client
* Party B — e.g. candidate, artist, freelancer

Each party has a private acceptable value range.

⸻

3. Configuration

Before the interaction starts, the initiating party defines:

3.1 Initial range

A₁ = [A₁_min, A₁_max]

This range is private.

3.2 Allowed spread

S

Example values:

* 10% — strict / low flexibility
* 20% — moderate flexibility
* 30% — high flexibility

The same spread applies symmetrically to both parties.

A range is valid iff:

Range_max ≤ Range_min × (1 + S)

Example with S = 20%:

100–120 ✅
100–130 ❌

⸻

4. Information disclosed before first bid

Party B sees only:

This transaction uses S% maximum spread per bid.

Party B does not see Party A’s range.

⸻

5. Round 1

Party B submits:

B₁ = [B₁_min, B₁_max]

Validation:

B₁_max ≤ B₁_min × (1 + S)

⸻

6. Initial match check

The system checks whether ranges overlap:

max(A₁_min, B₁_min) ≤ min(A₁_max, B₁_max)

If yes:

Overlap = [max(A₁_min, B₁_min), min(A₁_max, B₁_max)]
Outcome = midpoint(Overlap)

Then the process ends.

⸻

7. If no initial overlap

The system determines direction:

Case 1 — B is below A

B₁_max < A₁_min

System may internally label:

B below A

Case 2 — B is above A

B₁_min > A₁_max

System may internally label:

B above A

⸻

8. Feasibility gate

Before revealing direction or allowing Round 2, the system checks:

Is a match possible after one valid second bid from both parties?

If no, the system ends the process.

User-facing result:

No match within declared flexibility.

No direction is revealed.

This is important: if Round 2 is impossible, revealing direction would leak information without enabling a safe agreement.

⸻

9. Valid second bid

If Round 2 is feasible, both parties may submit a second range.

For each party, second range must satisfy:

9.1 Spread constraint

X₂_max ≤ X₂_min × (1 + S)

9.2 Continuity constraint

Second range must overlap with that party’s own first range:

max(X₁_min, X₂_min) ≤ min(X₁_max, X₂_max)

This replaces the stricter “must keep one endpoint” rule.

So valid movement means:

You may move, but your new claim must remain connected to your original claim.

Example:

Initial:

60–75

Valid second bid with 20% spread:

70–84 ✅

Invalid:

90–108 ❌

Because it no longer overlaps the original range.

⸻

10. Round 2 disclosure

Only if feasible, the system reveals:

You are below

or

You are above

No gap size.
No range.
No estimate.
No “close/far” label.

Then both parties submit second ranges simultaneously.

⸻

11. Final match check

The system checks overlap between:

A₂ = [A₂_min, A₂_max]
B₂ = [B₂_min, B₂_max]

If overlap exists:

Overlap₂ = [max(A₂_min, B₂_min), min(A₂_max, B₂_max)]
Outcome = midpoint(Overlap₂)

If no overlap:

No match.

⸻

12. Outcome rule

When a match exists:

Final value = midpoint of overlap

Formula:

Final = (Overlap_min + Overlap_max) / 2

This prevents either side from extracting extra surplus after overlap is found.

⸻

13. Full protocol summary

1. Party A privately defines initial range and spread S.
2. Party B sees only S.
3. Party B submits first range.
4. System checks initial overlap.
5. If overlap exists → midpoint outcome.
6. If no overlap → system checks whether Round 2 is feasible.
7. If Round 2 is not feasible → no match, no direction revealed.
8. If Round 2 is feasible → reveal direction only.
9. Both parties submit second ranges simultaneously.
10. System checks final overlap.
11. If overlap exists → midpoint outcome.
12. Else → no match.

⸻

14. Key invariants

Privacy invariant

No party ever sees the other party’s range.

Anti-probing invariant

Second round exists only if a match is feasible, so parties cannot use failed second rounds to infer hidden ranges.

Symmetry invariant

Both parties operate under the same spread and movement constraints.

Bounded-movement invariant

No party can fully abandon their original claim.

No-regret invariant

The mechanism blocks agreements that require large belief correction or hidden surplus extraction.

No-forced-convergence invariant

The system does not try to “make a deal happen.” It only permits deals reachable within declared flexibility.

⸻

15. Product framing

Short version:

A privacy-preserving alignment protocol for low-information markets.

Sharper version:

No bad deals. Only aligned ones.

Mechanism promise:

The system does not reveal private ranges or optimize for maximum deal volume. It only allows agreement when both parties are compatible within predefined flexibility.