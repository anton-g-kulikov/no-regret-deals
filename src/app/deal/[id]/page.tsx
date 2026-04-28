'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { auth, db, googleProvider, signInWithPopup } from '@/lib/firebase-client';
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

      <style jsx>{`
        .visualizer-container { margin: 2.5rem 0; position: relative; }
        .visualizer-track { height: 56px; background: rgba(255,255,255,0.03); border-radius: 16px; position: relative; border: 1px solid var(--border-color); }
        .visualizer-secure-range { position: absolute; height: 100%; background: linear-gradient(to bottom, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1)); z-index: 1; border-left: 2px solid var(--accent-color); border-right: 2px solid var(--accent-color); }
        .range-label { position: absolute; top: -24px; font-size: 0.75rem; color: var(--text-secondary); font-weight: 600; white-space: nowrap; }
        .range-label.min { left: 0; transform: translateX(-50%); }
        .range-label.max { right: 0; transform: translateX(50%); }
        
        .visualizer-midpoint-line { position: absolute; width: 2px; height: 100%; background: white; z-index: 2; box-shadow: 0 0 15px rgba(255,255,255,0.3); transform: translateX(-50%); opacity: 0.8; }
        
        .visualizer-target-container { position: relative; height: 60px; margin-top: 0.5rem; }
        .visualizer-target-label { display: flex; flex-direction: column; align-items: center; position: absolute; transform: translateX(-50%); z-index: 3; }
        .visualizer-target-tick { height: 12px; width: 2px; background: var(--text-primary); margin-bottom: 8px; }
        
        .target-pill { background: var(--text-primary); color: var(--bg-color); padding: 0.4rem 0.8rem; border-radius: 99px; display: flex; flex-direction: column; align-items: center; line-height: 1.1; box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
        .target-label { font-size: 0.65rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.05em; opacity: 0.8; }
        .target-value { font-size: 1rem; font-weight: 900; }

        .visualizer-hint { text-align: center; margin-top: 2rem; color: var(--accent-color); font-weight: 800; font-size: 1rem; background: rgba(99,102,241,0.05); padding: 1rem; border-radius: 12px; border: 1px solid rgba(99,102,241,0.2); letter-spacing: 0.02em; }
      `}</style>
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

      <style jsx>{`
        .page-header {
          margin-bottom: 2.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
        }

        .header-top h1 {
          margin: 0;
          font-size: 2.25rem;
          line-height: 1.2;
        }

        .header-meta {
          display: flex;
          justify-content: space-between;
          gap: 1.5rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .meta-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0; /* Allow shrinking */
        }

        .meta-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          opacity: 0.7;
        }

        .meta-value {
          color: var(--text-primary);
          font-weight: 500;
          word-break: break-all;
        }

        .user-email {
          font-weight: 700;
        }

        .text-right {
          text-align: right;
        }

        @media (max-width: 640px) {
          .header-top {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-meta {
            flex-direction: column;
            gap: 1rem;
          }

          .text-right {
            text-align: left;
          }

          .header-top h1 {
            font-size: 1.85rem;
          }
        }
      `}</style>
    </header>
  );
}

function SubjectView({ description }: { description?: string }) {
  if (!description) return null;
  return (
    <div className="card subject-card">
      <h3 className="subject-title">Negotiation Subject</h3>
      <p className="subject-desc">{description}</p>
      <style jsx>{`
        .subject-card { margin-bottom: 2rem; background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.05); }
        .subject-title { font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem; }
        .subject-desc { font-size: 1.15rem; line-height: 1.6; white-space: pre-wrap; }
      `}</style>
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
      <style jsx>{`
        .instructions-card h2 { margin-bottom: 1.5rem; }
        .instructions-card > p { margin-bottom: 1.5rem; }
        .share-box { background: var(--surface-hover); padding: 1.5rem; border-radius: 0.5rem; margin-bottom: 2rem; border: 1px solid rgba(99, 102, 241, 0.3); }
        .share-label { font-size: 1rem; margin-bottom: 0.5rem; color: var(--text-secondary); }
        .share-code { word-break: break-all; color: var(--accent-color); font-size: 0.95rem; }
        .share-btn { width: 100%; margin-top: 1rem; }
        .rule-box { border-left: 4px solid var(--accent-color); padding-left: 1rem; margin: 2rem 0; }
        .rule-box h4 { color: var(--accent-color); font-size: 1.05rem; }
        .rule-box p { font-size: 1rem; margin-top: 0.5rem; line-height: 1.5; }
        .waiting-box { margin-top: 2rem; padding: 1.5rem; border: 1px dashed var(--accent-color); border-radius: 0.5rem; text-align: center; }
      `}</style>
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
        <label className="label">Your Mid-Point Target (Ideal Price)</label>
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
      <style jsx>{`
        .responder-card { padding: 2.5rem; }
        .responder-card h2 { margin-bottom: 1.5rem; }
        .welcome-desc { margin-bottom: 1.5rem; }
        
        .private-analysis { background: rgba(99, 102, 241, 0.05); padding: 1.25rem; border-radius: 0.5rem; margin-bottom: 2rem; border: 1px solid rgba(99, 102, 241, 0.2); }
        .private-analysis h4 { color: var(--accent-color); margin-bottom: 0.5rem; font-size: 1.05rem; }
        .private-analysis p { font-size: 1rem; line-height: 1.5; }
        
        .input-row { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
        
        .preview-container { margin-top: 2rem; margin-bottom: 2rem; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .preview-header h4 { font-size: 1rem; color: var(--text-secondary); }
        .preview-badge { font-size: 0.9rem; }
        .preview-desc { font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 1.5rem; line-height: 1.5; }
        
        .submit-btn { width: 100%; margin-top: 1.5rem; }
      `}</style>
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
        <style jsx>{`
          .submitted-card { text-align: center; }
          .submitted-card h2 { margin-bottom: 1.5rem; }
          .waiting-pulse { padding: 2rem; border: 1px dashed var(--accent-color); border-radius: 1rem; }
        `}</style>
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

          <style jsx>{`
            .r2-card h2 { margin-bottom: 1.5rem; }
            .r2-card > p { margin-bottom: 1.5rem; }
            .r2-submission-box { margin-top: 3rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 2rem; }
            .r2-submission-box h3 { margin-bottom: 1rem; }
            .r2-instructions { margin-bottom: 1.5rem; font-size: 1rem; color: var(--text-secondary); line-height: 1.5; }
            .input-row { display: flex; gap: 0.5rem; margin-bottom: 1.5rem; }
            .preview-box { margin-top: 2rem; margin-bottom: 2rem; }
            .preview-box h4 { font-size: 1rem; color: var(--text-secondary); margin-bottom: 1rem; }
            .preview-desc { font-size: 0.9rem; color: var(--text-secondary); margin-top: 1rem; text-align: center; }
            .overlap-error {
              background: rgba(239, 68, 68, 0.1);
              color: var(--error-color);
              padding: 1rem;
              border-radius: 0.5rem;
              margin-bottom: 1.5rem;
              font-weight: 600;
              border: 1px solid rgba(239, 68, 68, 0.2);
            }
            .r2-actions {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 1rem;
              margin-top: 1.5rem;
            }
            .btn-error {
              background: var(--error-color);
              color: white;
            }
            @media (max-width: 640px) {
              .r2-actions {
                grid-template-columns: 1fr;
              }
            }
          `}</style>
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

      <style jsx>{`
        .result-card { text-align: center; }
        .result-card.match { border: 2px solid var(--success-color); }
        .result-card.no-match { border: 1px solid var(--text-secondary); }
        .success-title { color: var(--success-color); margin-bottom: 1rem; }
        .match-value { font-size: 4rem; font-weight: bold; margin: 2rem 0; }
        .secondary-title { color: var(--text-secondary); margin-bottom: 1rem; }
        
        .next-steps {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: left;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .next-steps h4 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }
        .next-steps p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }
      `}</style>
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

      <style jsx>{`
        .reject-card { text-align: center; }
        .reject-card h2 { color: var(--error-color); margin-bottom: 1.5rem; }
        
        .next-steps {
          margin-top: 3rem;
          padding-top: 2rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          text-align: left;
          max-width: 500px;
          margin-left: auto;
          margin-right: auto;
        }
        .next-steps h4 {
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
        }
        .next-steps p {
          font-size: 0.95rem;
          line-height: 1.6;
          color: var(--text-secondary);
        }
      `}</style>
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
      <style jsx>{`
        .auth-card { text-align: center; }
        .auth-card h2 { margin-bottom: 1.5rem; }
        .auth-card p { margin-bottom: 2rem; opacity: 0.8; }
      `}</style>
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
      <style jsx>{`
        .denied-card { text-align: center; }
        .denied-card h2 { color: var(--error-color); margin-bottom: 1.5rem; }
        .sign-out-btn { margin-top: 2rem; }
      `}</style>
    </main>
  );
}
