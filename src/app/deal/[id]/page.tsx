'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { auth, db, googleProvider, signInWithPopup, logAnalyticsEvent } from '@/lib/firebase-client';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Deal, Party, Range } from '@/lib/protocol/types';
import { formatCurrency, formatPercent, calculateSafeReach } from '@/lib/protocol/format';

export default function DealPage() {
  const { id } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [dealLoading, setDealLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Local Form State (Responder/Round 2)
  const [midpoint, setMidpoint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [r1Range, setR1Range] = useState<Range | null>(null);

  // Derived Values for current submission
  const { anchor, targets } = useMemo(() => {
    const m = Number(midpoint);
    const flex = deal?.flexibility || deal?.spread || 0.2;
    if (!m || m <= 0) return { anchor: { min: 0, max: 0 }, targets: { min: 0, max: 0 } };

    const tMin = Math.round(m * (1 - flex / 2));
    const tMax = Math.round(m * (1 + flex / 2));

    return { 
      anchor: { min: tMin, max: tMax }, 
      targets: { min: tMin, max: tMax } 
    };
  }, [midpoint, deal]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      return;
    }

    const unsubDeal = onSnapshot(doc(db, 'deals', id as string), 
      (doc) => {
        if (doc.exists()) {
          setDeal({ id: doc.id, ...doc.data() } as Deal);
          setErrorMsg('');
        } else {
          setErrorMsg('Deal not found.');
        }
        setDealLoading(false);
      },
      (error) => {
        console.error("Error fetching deal:", error);
        setErrorMsg('Access denied');
        setDealLoading(false);
      }
    );
    return () => unsubDeal();
  }, [id, user, authLoading]);

  useEffect(() => {
    if (user && deal && (deal.status === 'DECIDING_ON_R2' || deal.status === 'WAITING_FOR_R2_BIDS')) {
      const party = user.email === deal.partyAEmail ? 'A' : 'B';
      const unsub = onSnapshot(doc(db, 'deals', id as string, 'bids', `${party}_1`), (doc) => {
        if (doc.exists()) setR1Range(doc.data().range);
      });
      return unsub;
    }
  }, [user, deal, id]);
  
  // Track outcomes
  useEffect(() => {
    if (deal?.status === 'COMPLETED') {
      logAnalyticsEvent('protocol_completed', { 
        dealId: id, 
        outcome: deal.result?.outcome,
        currency: deal.currency
      });
    } else if (deal?.status === 'REJECTED') {
      logAnalyticsEvent('protocol_rejected', { dealId: id });
    }
  }, [deal?.status, id, deal?.result?.outcome, deal?.currency]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login failed:', error);
      alert(error.message || 'Login failed. Please check the console for details.');
    }
  };

  if (authLoading) return <div className="container">Loading Protocol...</div>;
  if (!user) return <AuthView handleLogin={handleLogin} />;
  if (dealLoading) return <div className="container">Loading Protocol...</div>;
  if (errorMsg === 'Access denied') return <AccessDeniedView email={user.email!} />;
  if (errorMsg) return <div className="container">{errorMsg}</div>;
  if (!deal) return <div className="container">Deal not found.</div>;
  
  const isPartyA = user.email === deal.partyAEmail;
  const isPartyB = user.email === deal.partyBEmail;
  const party: Party = isPartyA ? 'A' : 'B';

  if (!isPartyA && !isPartyB) return <AccessDeniedView email={user.email!} />;

  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const round = (deal.status === 'WAITING_FOR_R2_BIDS' || deal.status === 'DECIDING_ON_R2') ? 2 : 1;
      const res = await fetch(`/api/deals/${id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ party, round, range: anchor }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      // Track events
      if (round === 1 && party === 'B') {
        logAnalyticsEvent('round1_partyb_bid_submitted', { dealId: id });
      } else if (round === 2) {
        logAnalyticsEvent('round2_bid_submitted', { dealId: id, party });
      }

      setMidpoint('');
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message);
      else alert('An unexpected error occurred');
    }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to end this protocol? No further movement will be possible.')) return;
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/deals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ party, accept: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      
      logAnalyticsEvent('deal_terminated', { dealId: id, party });
    } catch (error: unknown) {
      if (error instanceof Error) alert(error.message);
      else alert('An unexpected error occurred');
    }
    finally { setSubmitting(false); }
  };

  return (
    <main className="container">
      <div className="animate-fade-in">
        <Header deal={deal} userEmail={user.email!} />
        <SubjectView description={deal.description} />

        {deal.status === 'WAITING_FOR_B1' && (
          isPartyA ? <InitiatorInstructions deal={deal} /> : <ResponderWelcomeView deal={deal} onSubmit={handleSubmission} midpoint={midpoint} setMidpoint={setMidpoint} submitting={submitting} anchor={anchor} targets={targets} />
        )}

        {(deal.status === 'DECIDING_ON_R2' || deal.status === 'WAITING_FOR_R2_BIDS') && (
          <Round2UnifiedView 
            deal={deal} 
            party={party} 
            onSubmit={handleSubmission} 
            onReject={handleReject} 
            midpoint={midpoint} 
            setMidpoint={setMidpoint} 
            submitting={submitting}
            r1Range={r1Range}
            anchor={anchor}
            targets={targets}
          />
        )}

        {deal.status === 'COMPLETED' && <ResultView deal={deal} />}
        {deal.status === 'REJECTED' && <RejectedView />}
      </div>
    </main>
  );
}

// --- Sub-Components ---

function MarketSpreadVisualizer({ range, targets, currency, hint }: { range: { min: number, max: number }, targets: { min: number, max: number }, currency: string, hint?: string }) {
  if (range.min <= 0 || range.max < range.min) return null;
  
  const rawMin = targets.min * 0.85; // 15% visual padding
  const rawMax = targets.max * 1.15;
  const totalRange = rawMax - rawMin;
  const leftPadding = ((range.min - rawMin) / totalRange) * 100;
  const width = ((range.max - range.min) / totalRange) * 100;
  const midpoint = Math.round((range.min + range.max) / 2);

  return (
    <div className="visualizer-container">
      <div className="visualizer-track">
        <div className="visualizer-secure-range" style={{ left: `${leftPadding}%`, width: `${width}%` }}>
          <div className="range-label min">{formatCurrency(targets.min, currency)}</div>
          <div className="range-label max">{formatCurrency(targets.max, currency)}</div>
        </div>
        <div className="visualizer-midpoint-line" style={{ left: `${leftPadding + (width/2)}%` }} />
      </div>

      <div className="visualizer-target-container">
        <div className="visualizer-target-label" style={{ left: `${leftPadding + (width/2)}%` }}>
          <div className="visualizer-target-tick" />
          <div className="target-pill">
            <span className="target-label">Target</span>
            <span className="target-value">{formatCurrency(midpoint, currency)}</span>
          </div>
        </div>
      </div>

      {hint && (
        <div className="visualizer-hint">
          {hint === 'ABOVE' ? '↑ THE OTHER PARTY IS HIGHER' : '↓ THE OTHER PARTY IS LOWER'}
        </div>
      )}

      
    </div>
  );
}

function Header({ deal, userEmail }: { deal: Deal, userEmail: string }) {
  return (
    <header className="page-header">
      <div className="header-top">
        <h1>{deal.status === 'COMPLETED' ? 'Final Alignment' : 'Protocol in Progress'}</h1>
        <span className={`badge badge-${deal.status === 'COMPLETED' ? 'success' : 'active'}`}>
          {deal.status.replace(/_/g, ' ')}
        </span>
      </div>
      <div className="header-meta">
        <div className="meta-item">
          <span className="meta-label">ID:</span>
          <span className="meta-value">{deal.id}</span>
        </div>
        <div className="meta-item text-right">
          <span className="meta-label">Signed in as:</span>
          <span className="meta-value user-email">{userEmail}</span>
        </div>
      </div>

      
    </header>
  );
}

function SubjectView({ description }: { description?: string }) {
  if (!description) return null;
  return (
    <div className="card subject-card">
      <h3 className="subject-title">Negotiation Subject</h3>
      <p className="subject-desc">{description}</p>
      
    </div>
  );
}

function InitiatorInstructions({ deal }: { deal: Deal }) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card instructions-card">
      <h2>Deal Created Successfully</h2>
      <p>Your initial range and <strong>{formatPercent(deal.flexibility || deal.spread)} spread</strong> are locked in.</p>
      
      <div className="share-box">
        <p className="share-label">Share this URL with Party B:</p>
        <code className="share-code">{url}</code>
        <button className={`btn share-btn ${copied ? 'btn-success' : 'btn-primary'}`} onClick={handleCopy}>
          {copied ? 'Copied to Clipboard!' : 'Copy Invite URL'}
        </button>
      </div>

      <div className="rule-box">
        <h4>The Anchoring Rule</h4>
        <p>
          Remember: If no match is found now, your second range (if you proceed) <strong>must overlap</strong> with the range you just submitted.
        </p>
      </div>

      <div className="waiting-box">
        <p className="animate-pulse">Waiting for Party B to join...</p>
      </div>
      
    </div>
  );
}

function ResponderWelcomeView({ deal, onSubmit, midpoint, setMidpoint, submitting, anchor, targets }: {
  deal: Deal, onSubmit: React.FormEventHandler, midpoint: string, setMidpoint: (v: string) => void, submitting: boolean, anchor: Range, targets: Range
}) {
  return (
    <div className="card responder-card">
      <h2>Welcome to the Protocol</h2>
      <p className="welcome-desc">
        You&apos;ve been invited to align on <strong>{deal.description || 'a new deal'}</strong>.
      </p>

      <div className="private-analysis">
        <h4>Private Analysis</h4>
        <p>
          Submit your <strong>No Regret Target</strong>. The system will create a private spread around it (<strong>{formatPercent(deal.flexibility || deal.spread || 0)} total width</strong>) and privately compare it with the other party&apos;s range.
        </p>
      </div>
      
      <div className="form-group">
        <label className="label">Your Ideal Target Value</label>
        <form onSubmit={onSubmit}>
          <div className="input-row">
             <input className="input" type="number" required placeholder="100,000" value={midpoint} onChange={e => setMidpoint(e.target.value)} />
          </div>

          <div className="preview-container">
            <div className="preview-header">
              <h4>Secure Range Preview</h4>
              <span className="badge badge-active preview-badge">
                {formatCurrency(anchor.min, deal.currency)} – {formatCurrency(anchor.max, deal.currency)}
              </span>
            </div>
            <p className="preview-desc">
              Your private range centered on your target. Used for the initial match check.
            </p>
            
            <MarketSpreadVisualizer 
              range={anchor} 
              targets={targets}
              currency={deal.currency} 
            />
          </div>

          <button className="btn btn-primary submit-btn" disabled={submitting}>
            Submit Your Target Range
          </button>
        </form>
      </div>
      
    </div>
  );
}

function Round2UnifiedView({ deal, party, onSubmit, onReject, midpoint, setMidpoint, submitting, r1Range, anchor, targets }: {
  deal: Deal, party: Party, onSubmit: React.FormEventHandler, onReject: () => void, midpoint: string, setMidpoint: (val: string) => void, submitting: boolean, r1Range: Range | null, anchor: Range, targets: Range
}) {
  const isValidOverlap = useMemo(() => {
    if (!r1Range || !anchor.min || !anchor.max) return true;
    const overlapMin = Math.max(r1Range.min, anchor.min);
    const overlapMax = Math.min(r1Range.max, anchor.max);
    return overlapMin <= overlapMax;
  }, [r1Range, anchor]);

  const hasSubmitted = party === 'A' ? deal.round2SubmittedA : deal.round2SubmittedB;
  const isB = party === 'B';
  const bIsAbove = deal.result?.direction === 'above';
  const hint = isB ? (bIsAbove ? "BELOW" : "ABOVE") : (bIsAbove ? "ABOVE" : "BELOW");

  if (hasSubmitted) {
    return (
      <div className="card submitted-card">
        <h2>Position Submitted</h2>
        <div className="waiting-pulse">
          <p className="animate-pulse">Waiting for your counterpart to decide or submit their final range...</p>
        </div>
        
      </div>
    );
  }

  return (
    <div className="card r2-card">
      <h2>Common Ground Found</h2>
      <p>A match is possible within your shared flexibility. See the direction below:</p>
      
      {r1Range && (
        <MarketSpreadVisualizer 
          range={r1Range} 
          targets={{
            min: Math.round(((r1Range.min + r1Range.max)/2) * (1 - (deal.flexibility || deal.spread) / 2)),
            max: Math.round(((r1Range.min + r1Range.max)/2) * (1 + (deal.flexibility || deal.spread) / 2))
          }}
          currency={deal.currency} 
          hint={hint} 
        />
      )}

      <div className="r2-submission-box">
        <h3>Final Round Submission</h3>
        <p className="r2-instructions">
          Submit your final target below. Your new matching window <strong>must overlap</strong> with your original window ({formatCurrency(r1Range?.min || 0, deal.currency)} - {formatCurrency(r1Range?.max || 0, deal.currency)}).
        </p>

        <form onSubmit={onSubmit}>
          <div className="input-row">
            <input className="input" type="number" required placeholder="Final Target" value={midpoint} onChange={e => setMidpoint(e.target.value)} />
          </div>

          {Number(midpoint) > 0 && !isValidOverlap && (
            <div className="overlap-error">
              Your new range does not overlap with your original window. You must move closer to your previous position.
            </div>
          )}

          {Number(midpoint) > 0 && (
            <div className="preview-box">
              <h4>Final Commitment Preview</h4>
              <MarketSpreadVisualizer 
                range={anchor} 
                targets={targets}
                currency={deal.currency} 
              />
              <p className="preview-desc">
                Your final target will be compared against the other party&apos;s range.
              </p>
            </div>
          )}
          
          <div className="r2-actions">
            <button className="btn btn-primary" disabled={submitting || !isValidOverlap}>
              Submit Your Final Position
            </button>
            <button type="button" className="btn btn-error" onClick={onReject} disabled={submitting}>
              End Protocol
            </button>
          </div>

          
        </form>
      </div>
    </div>
  );
}

function ResultView({ deal }: { deal: Deal }) {
  const isMatch = deal.result?.outcome === 'MATCH';
  return (
    <div className={`card result-card ${isMatch ? 'match' : 'no-match'}`}>
      {isMatch ? (
        <>
          <h2 className="success-title">Alignment Achieved</h2>
          <div className="match-value">{formatCurrency(deal.result?.value || 0, deal.currency)}</div>
          <p>The system found a safe midpoint within your shared flexibility.</p>
        </>
      ) : (
        <>
          <h2 className="secondary-title">No Alignment</h2>
          <p>The protocol concluded without a match. No further information was revealed.</p>
        </>
      )}

      <div className="next-steps">
        <h4>Next Steps</h4>
        <p>
          The second party has also been notified of this outcome. 
          If you ever need to reference this alignment in the future, just open this same link.
        </p>
      </div>

      
    </div>
  );
}

function RejectedView() {
  return (
    <div className="card reject-card">
      <h2>Protocol Terminated</h2>
      <p>One of the parties chose not to proceed to Round 2. The deal is now closed.</p>
      
      <div className="next-steps">
        <h4>Next Steps</h4>
        <p>
          The second party has also been notified of this outcome. 
          If you ever need to reference this alignment in the future, just open this same link.
        </p>
      </div>

      
    </div>
  );
}

function AuthView({ handleLogin }: { handleLogin: () => void }) {
  return (
    <main className="container">
      <div className="card animate-fade-in auth-card">
        <h2>Secure Access</h2>
        <p>Please verify your identity to access this protocol.</p>
        <button className="btn btn-primary" onClick={handleLogin}>Sign in with Google</button>
      </div>
      
    </main>
  );
}

function AccessDeniedView({ email }: { email: string }) {
  return (
    <main className="container">
      <div className="card animate-fade-in denied-card">
        <h2>Access Denied</h2>
        <p>Account <strong>{email}</strong> is not authorized for this deal.</p>
        <button className="btn sign-out-btn" onClick={() => signOut(auth)}>Sign out</button>
      </div>
      
    </main>
  );
}
