import type { Range, DealResult } from './types.ts';
import { leq, geq } from './format.ts';

/**
 * Calculates the midpoint of a range.
 */
export function calculateMidpoint(range: Range): number {
  return (range.min + range.max) / 2;
}

/**
 * Evaluates Round 1 bids for overlap.
 */
export function evaluateRound1(rangeA: Range, rangeB: Range): DealResult {
  const overlapMin = Math.max(rangeA.min, rangeB.min);
  const overlapMax = Math.min(rangeA.max, rangeB.max);

  if (leq(overlapMin, overlapMax)) {
    return {
      outcome: 'MATCH',
      value: calculateMidpoint({ min: overlapMin, max: overlapMax }),
    };
  }

  return {
    outcome: 'NO_MATCH',
  };
}

/**
 * Checks if a match is feasible in Round 2 and determines direction.
 * Note: Direction is ONLY returned if feasible is true.
 */
export function checkFeasibility(
  rangeA: Range,
  rangeB: Range,
  spread: number
): { feasible: boolean; direction?: 'above' | 'below' } {
  // Case 1: B is below A
  if (rangeB.max < rangeA.min) {
    const maxB2 = rangeB.max * (1 + spread);
    const minA2 = rangeA.min / (1 + spread);
    
    if (geq(maxB2, minA2)) {
      return { feasible: true, direction: 'below' };
    }
    return { feasible: false };
  }

  // Case 2: B is above A
  if (rangeB.min > rangeA.max) {
    const minB2 = rangeB.min / (1 + spread);
    const maxA2 = rangeA.max * (1 + spread);
    
    if (leq(minB2, maxA2)) {
      return { feasible: true, direction: 'above' };
    }
    return { feasible: false };
  }

  // Should not happen if evaluateRound1 was called first, but for safety:
  return { feasible: true };
}
