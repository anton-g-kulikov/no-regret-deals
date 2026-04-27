import assert from 'node:assert';
import { validateSpread, validateContinuity } from '../src/lib/protocol/validation.ts';
import type { Range } from '../src/lib/protocol/types.ts';

console.log('Running Validation Tests...');

// 1. Spread Constraint Tests
try {
  // Valid spread (20% allowed, 100-120 is 20%)
  assert.strictEqual(validateSpread({ min: 100, max: 120 }, 0.2), true, 'Should accept valid 20% spread');
  
  // Invalid spread (20% allowed, 100-130 is 30%)
  assert.strictEqual(validateSpread({ min: 100, max: 130 }, 0.2), false, 'Should reject 30% spread when 20% allowed');

  // Boundary cases
  assert.strictEqual(validateSpread({ min: 100, max: 100 }, 0.1), true, 'Should accept zero spread');
  
  console.log('✅ Spread Validation Tests Passed');
} catch (e: any) {
  console.error('❌ Spread Validation Tests Failed:', e.message);
}

// 2. Continuity Constraint Tests
try {
  const r1: Range = { min: 100, max: 120 };
  
  // Valid continuity (overlap)
  assert.strictEqual(validateContinuity(r1, { min: 110, max: 132 }), true, 'Should accept overlapping Round 2 bid');
  
  // Valid continuity (boundary overlap)
  assert.strictEqual(validateContinuity(r1, { min: 120, max: 144 }), true, 'Should accept boundary overlapping Round 2 bid');

  // Invalid continuity (no overlap)
  assert.strictEqual(validateContinuity(r1, { min: 121, max: 145 }), false, 'Should reject non-overlapping Round 2 bid');

  console.log('✅ Continuity Validation Tests Passed');
} catch (e: any) {
  console.error('❌ Continuity Validation Tests Failed:', e.message);
}
