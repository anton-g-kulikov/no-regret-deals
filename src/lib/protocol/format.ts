/**
 * Centralized formatting and rounding rules for the No Regret Protocol.
 */

export const EPSILON = 1e-9;

/**
 * Formats currency values for UI display.
 * Default: US-style thousands separators, no cents unless needed.
 */
export function formatCurrency(value: number, currency: string = '$'): string {
  return `${currency}${value.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Formats spread percentages for UI display.
 * Standard: Round digits, no decimals.
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

/**
 * Safe Reach Calculations
 * We use Floor for Max and Ceil for Min to ensure that any 
 * integer entry within these bounds is mathematically valid 
 * even with floating point noise.
 */
export function calculateSafeReach(anchor: number, spread: number, direction: 'min' | 'max'): number {
  if (direction === 'min') {
    return Math.ceil((anchor / (1 + spread)) - EPSILON);
  } else {
    return Math.floor((anchor * (1 + spread)) + EPSILON);
  }
}

/**
 * Comparison with Epsilon tolerance.
 * Returns true if a is less than or equal to b (within tolerance).
 */
export function leq(a: number, b: number): boolean {
  // Add a tiny buffer (0.01%) to account for rounding differences in large numbers
  return a <= (b * 1.0001) + EPSILON;
}

/**
 * Comparison with Epsilon tolerance.
 * Returns true if a is greater than or equal to b (within tolerance).
 */
export function geq(a: number, b: number): boolean {
  // Add a tiny buffer (0.01%) to account for rounding differences in large numbers
  return a >= (b * 0.9999) - EPSILON;
}
