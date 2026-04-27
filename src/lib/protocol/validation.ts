import type { Range } from './types.ts';
import { leq } from './format.ts';

/**
 * Validates if the range satisfies the spread constraint S.
 * Formula: max <= min * (1 + S)
 */
export function validateSpread(range: Range, spread: number): boolean {
  if (range.min < 0 || range.max < 0) return false;
  if (range.max < range.min) return false;
  
  const maxAllowed = range.min * (1 + spread);
  return leq(range.max, maxAllowed);
}

/**
 * Validates if the second range overlaps with the first range (continuity).
 * Formula: max(X1_min, X2_min) <= min(X1_max, X2_max)
 */
export function validateContinuity(range1: Range, range2: Range): boolean {
  const overlapMin = Math.max(range1.min, range2.min);
  const overlapMax = Math.min(range1.max, range2.max);
  
  return leq(overlapMin, overlapMax);
}
