import assert from 'node:assert';
import { evaluateRound1, checkFeasibility } from '../src/lib/protocol/engine.ts';
import { validateSpread, validateContinuity } from '../src/lib/protocol/validation.ts';
import type { Range, Deal } from '../src/lib/protocol/types.ts';

console.log('Running Full Deal Flow Simulation...');

/**
 * Simulation of a full deal flow between Party A and Party B.
 */
try {
  const spread = 0.2; // 20%
  const currency = 'USD';
  
  // 1. Party A initiates the deal
  const rangeA1: Range = { min: 100, max: 120 };
  assert.ok(validateSpread(rangeA1, spread), 'Party A initial range should be valid');

  const deal: Deal = {
    id: 'test-deal-123',
    currency,
    spread,
    partyAEmail: 'a@example.com',
    partyBEmail: 'b@example.com',
    status: 'WAITING_FOR_B1',
    createdAt: Date.now()
  };

  // 2. Party B submits Round 1 bid
  const rangeB1: Range = { min: 130, max: 156 }; // No initial overlap
  assert.ok(validateSpread(rangeB1, spread), 'Party B initial range should be valid');
  
  const r1Result = evaluateRound1(rangeA1, rangeB1);
  assert.strictEqual(r1Result.outcome, 'NO_MATCH', 'Round 1 should be NO_MATCH');
  
  // 3. System checks feasibility for Round 2
  const feasibility = checkFeasibility(rangeA1, rangeB1, spread);
  assert.strictEqual(feasibility.feasible, true, 'Round 2 should be feasible');
  assert.strictEqual(feasibility.direction, 'above', 'Party B should be told they are "above"');
  
  deal.status = 'WAITING_FOR_R2_BIDS';
  
  // 4. Round 2: Both parties adjust bids
  const rangeA2: Range = { min: 115, max: 138 };
  assert.ok(validateContinuity(rangeA1, rangeA2), 'A2 must be continuous with A1');
  assert.ok(validateSpread(rangeA2, spread), 'A2 must respect spread');

  const rangeB2: Range = { min: 110, max: 132 };
  assert.ok(validateContinuity(rangeB1, rangeB2), 'B2 must be continuous with B1');
  assert.ok(validateSpread(rangeB2, spread), 'B2 must respect spread');

  // 5. System evaluates Round 2
  const finalResult = evaluateRound1(rangeA2, rangeB2);
  assert.strictEqual(finalResult.outcome, 'MATCH', 'Round 2 should be a MATCH');
  assert.strictEqual(finalResult.value, 123.5, 'Final value should be 123.5');

  console.log('✅ Full Deal Flow Simulation Passed');
} catch (e: any) {
  console.error('❌ Full Deal Flow Simulation Failed:', e.message);
  process.exit(1);
}
