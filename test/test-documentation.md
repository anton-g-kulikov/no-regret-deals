# Test Documentation - Bounded Alignment Protocol

## Core Invariants to Verify

### 1. Privacy Invariant
- **Scenario**: Party A's range should never be exposed to Party B's view.
- **Scenario**: Party B's range should never be exposed to Party A's view.
- **Verification**: Check API response payloads to ensure only outcome/direction/value is returned.

### 2. Spread Constraint (Validation)
- **Scenario**: Reject range if `max > min * (1 + S)`.
- **Scenario**: Accept range if `max <= min * (1 + S)`.
- **Verification**: `validateSpread(range, spread)` should return boolean/error.

### 3. Continuity Constraint (Validation)
- **Scenario**: Reject Round 2 bid if it doesn't overlap with Round 1 bid.
- **Scenario**: Accept Round 2 bid if it overlaps with Round 1 bid.
- **Verification**: `validateContinuity(range1, range2)` should return boolean/error.

### 4. Overlap & Midpoint (Engine)
- **Scenario**: If overlap exists, return midpoint.
- **Scenario**: `overlap([100, 120], [110, 130])` -> `[110, 120]` -> `115`.
- **Verification**: `calculateOutcome(rangeA, rangeB)` matches expected midpoint.

### 5. Feasibility Gate (Engine)
- **Scenario**: If gap exists but can be closed in one valid move, return `feasible: true` and `direction`.
- **Scenario**: If gap is too wide, return `feasible: false` and no direction.
- **Verification**: `checkFeasibility(rangeA1, rangeB1, spread)` logic.

## Test Strategy

Since external test runners are currently unavailable, we will use a custom lightweight test script (`test/run-tests.js`) using Node's native `assert` module to verify the core logic.
