# Bounded Alignment Protocol v0.1

## Purpose

A privacy-preserving mechanism for low-information, high-regret transactions where agreement is allowed only if both parties are already aligned within declared flexibility.

## Core Principles

- No price discovery
- No iterative negotiation
- Bounded updates only
- Symmetric constraints
- Rejection over forced convergence

## Actors

- Party A (initiator)
- Party B (responder)

## Configuration
- Midpoint $M$ (Target Price)
- Flexibility $F$ (10%, 15%, 20%, 30%)
- Effective Range $R = [M \times (1-F), M \times (1+F)]$

## Protocol Flow

1. Party A defines Midpoint and selects Flexibility.
2. Party B sees only the Flexibility percentage.
3. Party B submits their Midpoint.
4. System calculates the Effective Range for both parties using the shared Flexibility.
5. If ranges overlap in Round 1 → instant match at the overlap midpoint.
6. If no overlap → feasibility check (can they align within the bounds?).
7. If infeasible → no match (direction is NOT revealed).
8. If feasible → reveal direction (e.g., "The other party is higher").
9. Both submit second Midpoints.
10. Final overlap check using updated Effective Ranges.
11. If overlap → match at overlap midpoint.
12. Else → no match.

## Guarantees

- Privacy
- No probing
- Symmetry
- No-regret filtering
