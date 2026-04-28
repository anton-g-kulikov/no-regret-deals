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

3.1 Midpoint (Target Price)

M

This value is private and represents the ideal target price.

3.2 Flexibility

F

Pre-defined options:
* 10% — strict / low flexibility
* 15% — moderate-low flexibility
* 20% — moderate flexibility
* 30% — high flexibility

The same flexibility percentage applies symmetrically to both parties.

3.3 Effective Range Calculation

The system automatically calculates an effective range from any submitted midpoint:
R = [M × (1 - F/2), M × (1 + F/2)]

Example with F = 20%:
Midpoint: 100
Effective Range: 90–110 (100 ± 10% of midpoint)

⸻

4. Information disclosed before first bid

Party B sees only:

This transaction uses F% maximum flexibility per bid.

Party B does not see Party A’s midpoint.

⸻

5. Round 1

Party B submits only their midpoint:

M_B

The system automatically expands this into an effective range:
B₁ = [M_B × (1 - F/2), M_B × (1 + F/2)]

⸻

6. Initial match check

The system checks whether the effective ranges overlap:

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

If Round 2 is feasible, both parties may submit a second midpoint.

For each party, the resulting effective range must satisfy:

9.1 Continuity constraint

The second effective range must overlap with that party’s own first effective range:

max(R1_min, R2_min) ≤ min(R1_max, R2_max)

This ensures that while a party may move, their new claim remains connected to their original claim.

⸻

10. Round 2 disclosure

Only if feasible, the system reveals:

"The other party is higher"

or

"The other party is lower"

No gap size, specific range, or estimated values are revealed.

Then both parties submit their second midpoints simultaneously.

⸻

11. Final match check

The system checks for an overlap between the updated effective ranges A₂ and B₂.

If overlap exists:

Outcome = midpoint of the overlap

If no overlap:

No match.

⸻

12. Outcome rule

When a match exists, the final value is the midpoint of the overlap between the two final effective ranges. This prevents either side from extracting extra surplus after alignment is found.

⸻

13. Full protocol summary

1. Party A defines private Midpoint and shared Flexibility F.
2. Party B sees only F.
3. Party B submits their first Midpoint.
4. System calculates effective ranges and checks for initial overlap.
5. If overlap exists → instant match at overlap midpoint.
6. If no overlap → system checks whether Round 2 is feasible.
7. If Round 2 is not feasible → no match, no direction revealed.
8. If Round 2 is feasible → reveal direction only.
9. Both parties submit second Midpoints simultaneously.
10. System calculates second effective ranges and checks for final overlap.
11. If overlap exists → match at overlap midpoint.
12. Else → no match.

⸻

14. Key invariants

Privacy invariant

No party ever sees the other party’s range.

Anti-probing invariant

Second round exists only if a match is feasible, so parties cannot use failed second rounds to infer hidden ranges.

Symmetry invariant

Both parties operate under the same flexibility and movement constraints.

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