export type Range = {
  min: number;
  max: number;
};

export type Party = 'A' | 'B';

export type DealStatus = 
  | 'WAITING_FOR_B1'
  | 'DECIDING_ON_R2'
  | 'WAITING_FOR_R2_BIDS'
  | 'COMPLETED'
  | 'REJECTED';

export type DealResult = {
  outcome: 'MATCH' | 'NO_MATCH';
  value?: number;
  directionRevealed?: boolean;
  direction?: 'above' | 'below';
};

export interface Deal {
  id: string;
  currency: string;
  spread: number;
  partyAEmail: string;
  partyBEmail: string;
  status: DealStatus;
  result?: DealResult;
  createdAt: number;
  
  // Decision flags
  round2AcceptedA?: boolean;
  round2AcceptedB?: boolean;

  // Submission flags for Round 2
  round2SubmittedA?: boolean;
  round2SubmittedB?: boolean;
}

export interface Bid {
  party: Party;
  round: 1 | 2;
  range: Range;
  timestamp: number;
}
