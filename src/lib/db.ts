import { db } from './firebase-admin';
import type { Deal, Range, Bid, Party, DealResult } from './protocol/types';
import { evaluateRound1, checkFeasibility } from './protocol/engine';
import { validateContinuity, validateSpread } from './protocol/validation';

/**
 * Creates a new identity-locked deal.
 */
export async function createDeal(params: {
  currency: string;
  frequency: Frequency;
  spread: number;
  partyAEmail: string;
  partyBEmail: string;
  flexibility: number;
  initialRange: Range;
  description: string;
}): Promise<string> {
  console.log('DEBUG: createDeal', { range: params.initialRange, spread: params.spread });
  if (!validateSpread(params.initialRange, params.spread + 0.01)) {
    throw new Error(`Your midpoint and flexibility range exceed the deal's locked-in constraints.`);
  }

  const dealRef = db.collection('deals').doc();
  const now = Date.now();
  
  const deal: Omit<Deal, 'id'> = {
    currency: params.currency,
    frequency: params.frequency,
    spread: params.spread,
    partyAEmail: params.partyAEmail,
    partyBEmail: params.partyBEmail,
    flexibility: params.flexibility,
    description: params.description,
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

export async function submitBid(params: {
  dealId: string;
  party: Party;
  round: 1 | 2;
  range: Range;
  userEmail: string;
}): Promise<void> {
  const dealRef = db.collection('deals').doc(params.dealId);
  const bidRef = dealRef.collection('bids').doc(`${params.party}_${params.round}`);

  await db.runTransaction(async (t) => {
    const dealDoc = await t.get(dealRef);
    if (!dealDoc.exists) throw new Error('Deal not found');
    const deal = dealDoc.data() as Deal;

    // Identity verification
    const expectedEmail = params.party === 'A' ? deal.partyAEmail : deal.partyBEmail;
    if (params.userEmail !== expectedEmail) throw new Error('Unauthorized');

    // Spread validation
    // Add an emergency 1% buffer to the deal spread for the check
    if (!validateSpread(params.range, deal.spread + 0.01)) {
      throw new Error(`Your submission exceeds the maximum allowed flexibility for this deal.`);
    }

    let bid1Doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | undefined;
    let bidA1Doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | undefined;
    let counterpartBidDoc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> | undefined;

    // --- EXECUTE ALL READS FIRST ---

    if (params.round === 2) {
      const bid1Ref = dealRef.collection('bids').doc(`${params.party}_1`);
      bid1Doc = await t.get(bid1Ref);
      
      const counterpartParty = params.party === 'A' ? 'B' : 'A';
      const counterpartBidRef = dealRef.collection('bids').doc(`${counterpartParty}_2`);
      counterpartBidDoc = await t.get(counterpartBidRef);
    } else if (params.party === 'B' && params.round === 1) {
      const bidA1Ref = dealRef.collection('bids').doc('A_1');
      bidA1Doc = await t.get(bidA1Ref);
    }

    // --- EXECUTE ALL WRITES AND LOGIC ---

    // Continuity check for Round 2
    if (params.round === 2 && bid1Doc && bid1Doc.exists) {
      const range1 = bid1Doc.data()?.range as Range;
      if (!validateContinuity(range1, params.range)) {
        throw new Error('Round 2 range must overlap with your Round 1 range.');
      }
    }

    // Prepare bid data
    const bidData = {
      party: params.party,
      round: params.round,
      range: params.range,
      timestamp: Date.now()
    };
    t.set(bidRef, bidData);

    // Evaluate state transitions
    if (params.party === 'B' && params.round === 1) {
      const rangeA1 = bidA1Doc?.data()?.range as Range;
      
      if (!rangeA1) {
        throw new Error('Party A bid not found.');
      }

      const result = evaluateRound1(rangeA1, params.range);
      
      if (result.outcome === 'MATCH') {
        t.update(dealRef, {
          status: 'COMPLETED',
          result: { 
            outcome: 'MATCH', 
            value: result.value,
            directionRevealed: false
          }
        });
      } else {
        const feasibility = checkFeasibility(rangeA1, params.range, deal.spread);
        if (feasibility.feasible) {
          t.update(dealRef, {
            status: 'DECIDING_ON_R2',
            result: { 
              outcome: 'NO_MATCH', 
              directionRevealed: true,
              direction: feasibility.direction 
            }
          });
        } else {
          t.update(dealRef, {
            status: 'COMPLETED',
            result: { outcome: 'NO_MATCH', directionRevealed: false }
          });
        }
      }
    } else if (params.round === 2) {
      const counterpartParty = params.party === 'A' ? 'B' : 'A';
      
      const update: Record<string, any> = {};
      if (params.party === 'A') {
        update.round2SubmittedA = true;
        update.round2AcceptedA = true;
      } else {
        update.round2SubmittedB = true;
        update.round2AcceptedB = true;
      }

      if (counterpartBidDoc && counterpartBidDoc.exists) {
        const counterpartRange = counterpartBidDoc.data()?.range as Range;
        const bids = {
          [params.party]: params.range,
          [counterpartParty]: counterpartRange
        };

        const result = evaluateRound1(bids.A, bids.B);
        
        const resultData: any = { 
          outcome: result.outcome,
          directionRevealed: result.outcome === 'MATCH' ? false : true 
        };
        
        if (result.value !== undefined) {
          resultData.value = result.value;
        } else if (resultData.directionRevealed) {
          const feasibility = checkFeasibility(bids.A, bids.B, deal.spread);
          resultData.direction = feasibility.direction;
        }

        Object.assign(update, {
          status: 'COMPLETED',
          result: resultData
        });
      }
      
      t.update(dealRef, update);
    }
  });
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

  await db.runTransaction(async (t) => {
    const dealDoc = await t.get(dealRef);
    if (!dealDoc.exists) throw new Error('Deal not found');
    const deal = dealDoc.data() as Deal;

    // Identity verification
    const expectedEmail = params.party === 'A' ? deal.partyAEmail : deal.partyBEmail;
    if (params.userEmail !== expectedEmail) throw new Error('Unauthorized');

    if (!params.accept) {
      t.update(dealRef, { status: 'REJECTED' });
      return;
    }

    const update: Record<string, any> = {};
    if (params.party === 'A') update.round2AcceptedA = true;
    if (params.party === 'B') update.round2AcceptedB = true;

    t.update(dealRef, update);
  });
}

/**
 * Gets aggregated statistics for deals.
 */
export async function getDealStats(): Promise<{ fairDeals: number; unfairDealsPrevented: number }> {
  try {
    const matchesCountSnapshot = await db.collection('deals').where('result.outcome', '==', 'MATCH').count().get();
    const noMatchesCountSnapshot = await db.collection('deals').where('result.outcome', '==', 'NO_MATCH').count().get();
    const rejectedCountSnapshot = await db.collection('deals').where('status', '==', 'REJECTED').count().get();

    const matches = matchesCountSnapshot.data().count;
    const noMatches = noMatchesCountSnapshot.data().count;
    const rejected = rejectedCountSnapshot.data().count;

    // We can also count deals that were abandoned before completion, but for now we focus on explicit outcomes.
    // Assuming starting a deal that doesn't overlap prevents an unfair outcome.
    
    const fairDeals = matches;
    const unfairDealsPrevented = noMatches + rejected;

    return {
      fairDeals,
      unfairDealsPrevented,
    };
  } catch (error) {
    console.error('Error fetching deal stats from Firestore:', error);
    // Return 0 if there's an error
    return { fairDeals: 0, unfairDealsPrevented: 0 };
  }
}

