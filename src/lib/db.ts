import { db } from './firebase-admin';
import type { Deal, Range, Bid, Party, DealResult } from './protocol/types';
import { evaluateRound1, checkFeasibility } from './protocol/engine';
import { validateContinuity, validateSpread } from './protocol/validation';

/**
 * Creates a new identity-locked deal.
 */
export async function createDeal(params: {
  currency: string;
  spread: number;
  partyAEmail: string;
  partyBEmail: string;
  flexibility: number;
  initialRange: Range;
}): Promise<string> {
  console.log('DEBUG: createDeal', { range: params.initialRange, spread: params.spread });
  if (!validateSpread(params.initialRange, params.spread + 0.01)) {
    throw new Error(`Your midpoint and flexibility range exceed the deal's locked-in constraints.`);
  }

  const dealRef = db.collection('deals').doc();
  const now = Date.now();
  
  const deal: Omit<Deal, 'id'> = {
    currency: params.currency,
    spread: params.spread,
    partyAEmail: params.partyAEmail,
    partyBEmail: params.partyBEmail,
    flexibility: params.flexibility,
    status: 'WAITING_FOR_B1',
    createdAt: now,
  };

  await dealRef.set(deal);
  
  // Store initial bid privately
  await dealRef.collection('bids').doc('A_1').set({
    party: 'A',
    round: 1,
    range: params.initialRange,
    timestamp: now
  });

  return dealRef.id;
}

/**
 * Submits a bid and triggers protocol evaluation if necessary.
 */
export async function submitBid(params: {
  dealId: string;
  party: Party;
  round: 1 | 2;
  range: Range;
  userEmail: string;
}): Promise<void> {
  const dealRef = db.collection('deals').doc(params.dealId);
  const dealDoc = await dealRef.get();
  
  if (!dealDoc.exists) throw new Error('Deal not found');
  const deal = dealDoc.data() as Deal;

  // Identity verification
  const expectedEmail = params.party === 'A' ? deal.partyAEmail : deal.partyBEmail;
  if (params.userEmail !== expectedEmail) throw new Error('Unauthorized');

  // Spread validation
  console.log('DEBUG: submitBid', { range: params.range, dealSpread: deal.spread });
  // Add an emergency 1% buffer to the deal spread for the check
  if (!validateSpread(params.range, deal.spread + 0.01)) {
    throw new Error(`Your submission exceeds the maximum allowed flexibility for this deal.`);
  }

  // Continuity check for Round 2
  if (params.round === 2) {
    const bid1Doc = await dealRef.collection('bids').doc(`${params.party}_1`).get();
    if (bid1Doc.exists) {
      const range1 = bid1Doc.data()?.range as Range;
      if (!validateContinuity(range1, params.range)) {
        throw new Error('Round 2 range must overlap with your Round 1 range.');
      }
    }
  }

  // Store the bid
  const bidId = `${params.party}_${params.round}`;
  await dealRef.collection('bids').doc(bidId).set({
    party: params.party,
    round: params.round,
    range: params.range,
    timestamp: Date.now()
  });

  // Evaluate state transitions
  if (params.party === 'B' && params.round === 1) {
    await processRound1(dealRef, deal, params.range);
  } else if (params.round === 2) {
    await checkRound2Completion(dealRef, deal, params.party, params.range);
  }
}

/**
 * Handles the decision to proceed to Round 2.
 */
export async function decideRound2(params: {
  dealId: string;
  party: Party;
  accept: boolean;
  userEmail: string;
}): Promise<void> {
  const dealRef = db.collection('deals').doc(params.dealId);
  const dealDoc = await dealRef.get();
  
  if (!dealDoc.exists) throw new Error('Deal not found');
  const deal = dealDoc.data() as Deal;

  // Identity verification
  const expectedEmail = params.party === 'A' ? deal.partyAEmail : deal.partyBEmail;
  if (params.userEmail !== expectedEmail) throw new Error('Unauthorized');

  if (!params.accept) {
    await dealRef.update({ status: 'REJECTED' });
    return;
  }

  const update: any = {};
  if (params.party === 'A') update.round2AcceptedA = true;
  if (params.party === 'B') update.round2AcceptedB = true;

  await dealRef.update(update);
}

async function processRound1(dealRef: any, deal: Deal, rangeB1: Range) {
  const bidA1Doc = await dealRef.collection('bids').doc('A_1').get();
  const rangeA1 = bidA1Doc.data()?.range as Range;

  const result = evaluateRound1(rangeA1, rangeB1);
  
  if (result.outcome === 'MATCH') {
    await dealRef.update({
      status: 'COMPLETED',
      result: { outcome: 'MATCH', value: result.value }
    });
  } else {
    const feasibility = checkFeasibility(rangeA1, rangeB1, deal.spread);
    if (feasibility.feasible) {
      await dealRef.update({
        status: 'DECIDING_ON_R2',
        result: { 
          outcome: 'NO_MATCH', 
          directionRevealed: true,
          direction: feasibility.direction 
        }
      });
    } else {
      await dealRef.update({
        status: 'COMPLETED',
        result: { outcome: 'NO_MATCH', directionRevealed: false }
      });
    }
  }
}

async function checkRound2Completion(dealRef: any, deal: Deal, currentParty: Party, currentRange: Range) {
  const counterpartParty = currentParty === 'A' ? 'B' : 'A';
  const counterpartBidDoc = await dealRef.collection('bids').doc(`${counterpartParty}_2`).get();
  
  const update: any = {};
  // If you submit R2 bid, you implicitly accept R2
  if (currentParty === 'A') {
    update.round2SubmittedA = true;
    update.round2AcceptedA = true;
  } else {
    update.round2SubmittedB = true;
    update.round2AcceptedB = true;
  }

  if (counterpartBidDoc.exists) {
    const bids = {
      [currentParty]: currentRange,
      [counterpartParty]: counterpartBidDoc.data().range
    };

    const result = evaluateRound1(bids.A, bids.B);
    
    Object.assign(update, {
      status: 'COMPLETED',
      result: { outcome: result.outcome, value: result.value }
    });
  }
  
  await dealRef.update(update);
}
