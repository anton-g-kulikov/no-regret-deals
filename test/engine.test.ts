import assert from 'node:assert';
import { calculateMidpoint, evaluateRound1, checkFeasibility } from '../src/lib/protocol/engine.ts';
import type { Range } from '../src/lib/protocol/types.ts';

console.log('Running Engine Tests...');

// 1. Midpoint Calculation
try {
  assert.strictEqual(calculateMidpoint({ min: 110, max: 120 }), 115, 'Midpoint of 110-120 should be 115');
  assert.strictEqual(calculateMidpoint({ min: 100, max: 101 }), 100.5, 'Midpoint of 100-101 should be 100.5');
  console.log('✅ Midpoint Tests Passed');
} catch (e: any) {
  console.error('❌ Midpoint Tests Failed:', e.message);
}

// 2. Round 1 Evaluation
try {
  const rangeA: Range = { min: 100, max: 120 };
  const rangeB: Range = { min: 110, max: 130 };
  
  const result = evaluateRound1(rangeA, rangeB);
  assert.strictEqual(result.outcome, 'MATCH', 'Should find a match for overlapping ranges');
  assert.strictEqual(result.value, 115, 'Should return midpoint of overlap [110, 120]');
  
  const noMatchResult = evaluateRound1({ min: 100, max: 110 }, { min: 120, max: 130 });
  assert.strictEqual(noMatchResult.outcome, 'NO_MATCH', 'Should return NO_MATCH for non-overlapping ranges');
  
  console.log('✅ Round 1 Evaluation Tests Passed');
} catch (e: any) {
  console.error('❌ Round 1 Evaluation Tests Failed:', e.message);
}

// 3. Feasibility Gate
try {
  const spread = 0.2; // 20%
  
  const a1: Range = { min: 100, max: 120 };
  const b1: Range = { min: 130, max: 156 };
  
  const feasibleResult = checkFeasibility(a1, b1, spread);
  assert.strictEqual(feasibleResult.feasible, true, 'Should be feasible if gap can be bridged');
  assert.strictEqual(feasibleResult.direction, 'above', 'Should correctly identify B is above A');

  // Case: Gap too wide
  const bTooFar: Range = { min: 200, max: 240 };
  
  const infeasibleResult = checkFeasibility(a1, bTooFar, spread);
  assert.strictEqual(infeasibleResult.feasible, false, 'Should be infeasible if gap is too wide');
  assert.strictEqual(infeasibleResult.direction, undefined, 'Should NOT reveal direction if infeasible');

  console.log('✅ Feasibility Gate Tests Passed');
} catch (e: any) {
  console.error('❌ Feasibility Gate Tests Failed:', e.message);
}
