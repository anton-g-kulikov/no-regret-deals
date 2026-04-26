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

- Private range A₁ = [A₁_min, A₁_max]
- Spread S

### Constraint:

Range_max ≤ Range_min × (1 + S)

## Protocol Flow

1. Party A defines range and spread
2. Party B sees only spread
3. Party B submits first range B₁
4. System checks overlap
5. If overlap → midpoint outcome
6. If no overlap → feasibility check
7. If infeasible → no match
8. If feasible → reveal direction
9. Both submit second ranges
10. Final overlap check
11. If overlap → midpoint
12. Else → no match

## Guarantees

- Privacy
- No probing
- Symmetry
- No-regret filtering
