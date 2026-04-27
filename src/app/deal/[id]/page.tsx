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
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Local Form State (Responder/Round 2)
  const [midpoint, setMidpoint] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [r1Range, setR1Range] = useState<Range | null>(null);

  // Derived Values for current submission
  const { anchor, targets } = useMemo(() => {
    const m = Number(midpoint);
    const flex = deal?.flexibility || deal?.spread || 0.2;
    if (!m || m <= 0) return { anchor: { min: 0, max: 0 }, targets: { min: 0, max: 0 } };

    const tMin = Math.round(m * (1 - flex));
    const tMax = Math.round(m * (1 + flex));

    return { 
      anchor: { min: tMin, max: tMax }, 
      targets: { min: tMin, max: tMax } 
    };
  }, [midpoint, deal]);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    const unsubDeal = onSnapshot(doc(db, 'deals', id as string), (doc) => {
      if (doc.exists()) setDeal({ id: doc.id, ...doc.data() } as Deal);
      setLoading(false);
    });
    return () => { unsubAuth(); unsubDeal(); };
  }, [id]);

  useEffect(() => {
    if (user && deal && (deal.status === 'DECIDING_ON_R2' || deal.status === 'WAITING_FOR_R2_BIDS')) {
      const party = user.email === deal.partyAEmail ? 'A' : 'B';
      const unsub = onSnapshot(doc(db, 'deals', id as string, 'bids', `${party}_1`), (doc) => {
        if (doc.exists()) setR1Range(doc.data().range);
      });
      return unsub;
    }
  }, [user, deal, id]);

  if (loading) return <div className="container">Loading Protocol...</div>;
  if (!deal) return <div className="container">Deal not found.</div>;
  if (!user) return <AuthView handleLogin={() => signInWithPopup(auth, googleProvider)} />;
  
  const isPartyA = user.email === deal.partyAEmail;
  const isPartyB = user.email === deal.partyBEmail;
  const party: Party = isPartyA ? 'A' : 'B';

  if (!isPartyA && !isPartyB) return <AccessDeniedView email={user.email!} />;

  const handleBid = async (e: React.FormEvent) => {
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
    } catch (error: any) { alert(error.message); }
    finally { setSubmitting(false); }
  };

  const handleReject = async () => {
    if (!confirm('Are you sure you want to end this protocol? No further bids will be possible.')) return;
    setSubmitting(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/deals/${id}/decide`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ party, accept: false }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
    } catch (error: any) { alert(error.message); }
    finally { setSubmitting(false); }
  };

  return (
    <main className="container">
      <div className="animate-fade-in">
        <Header deal={deal} userEmail={user.email!} />
        <SubjectView description={deal.description} />

        {deal.status === 'WAITING_FOR_B1' && (
          isPartyA ? <InitiatorInstructions deal={deal} /> : <ResponderWelcomeView deal={deal} onSubmit={handleBid} midpoint={midpoint} setMidpoint={setMidpoint} submitting={submitting} anchor={anchor} targets={targets} />
        )}

        {(deal.status === 'DECIDING_ON_R2' || deal.status === 'WAITING_FOR_R2_BIDS') && (
          <Round2UnifiedView 
            deal={deal} 
            party={party} 
            onSubmit={handleBid}
            onReject={handleReject}
            midpoint={midpoint} setMidpoint={setMidpoint}
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
    <div style={{ margin: '2rem 0', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', padding: '0 4px', fontWeight: 500 }}>
        <span>Min Threshold: {formatCurrency(targets.min, currency)}</span>
        <span>Max Threshold: {formatCurrency(targets.max, currency)}</span>
      </div>
      
      <div style={{ height: '48px', background: 'var(--surface-hover)', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
        <div style={{ 
          position: 'absolute', 
          left: `${leftPadding}%`, 
          width: `${width}%`, 
          height: '100%', 
          background: 'rgba(99, 102, 241, 0.15)',
          zIndex: 1,
          borderLeft: '2px solid rgba(99, 102, 241, 0.6)',
          borderRight: '2px solid rgba(99, 102, 241, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--accent-hover)',
          fontSize: '0.9rem',
          fontWeight: 'bold',
          letterSpacing: '0.05em'
        }}>
          SECURE RANGE
        </div>

        <div style={{ 
          position: 'absolute', 
          left: `${leftPadding + (width/2)}%`, 
          width: '4px', 
          height: '100%', 
          background: 'var(--text-primary)',
          zIndex: 2,
          boxShadow: '0 0 10px rgba(255,255,255,0.5)',
          transform: 'translateX(-50%)'
        }} />
      </div>

      <div style={{ position: 'relative', height: '40px', marginTop: '0.5rem' }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          position: 'absolute', 
          left: `${leftPadding + (width/2)}%`, 
          transform: 'translateX(-50%)',
          color: 'var(--text-primary)',
          fontWeight: 'bold',
          zIndex: 3,
          fontSize: '0.9rem'
        }}>
          <div style={{ height: '8px', width: '2px', background: 'var(--text-primary)', marginBottom: '4px' }} />
          <span>TARGET: {formatCurrency(midpoint, currency)}</span>
        </div>
      </div>

      {hint && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1.1rem', background: 'rgba(99,102,241,0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.2)' }}>
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
    <div className="card" style={{ marginBottom: '2rem', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
      <h3 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Negotiation Subject</h3>
      <p style={{ fontSize: '1.15rem', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{description}</p>
    </div>
  );
}

function InitiatorInstructions({ deal }: { deal: Deal }) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>Deal Created Successfully</h2>
      <p style={{ marginBottom: '1.5rem' }}>Your initial range and <strong>{formatPercent(deal.flexibility || deal.spread)} flexibility</strong> are locked in.</p>
      
      <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <p style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Share this URL with Party B:</p>
        <code style={{ wordBreak: 'break-all', color: 'var(--accent-color)', fontSize: '0.95rem' }}>{url}</code>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => {
          navigator.clipboard.writeText(url);
          alert('URL copied to clipboard');
        }}>Copy Invite URL</button>
      </div>

      <div style={{ borderLeft: '4px solid var(--accent-color)', paddingLeft: '1rem', margin: '2rem 0' }}>
        <h4 style={{ color: 'var(--accent-color)', fontSize: '1.05rem' }}>The Anchoring Rule</h4>
        <p style={{ fontSize: '1rem', marginTop: '0.5rem', lineHeight: '1.5' }}>
          Remember: If no match is found now, your second range (if you proceed) <strong>must overlap</strong> with the range you just submitted.
        </p>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed var(--accent-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
        <p className="animate-pulse">Waiting for Party B to join...</p>
      </div>
    </div>
  );
}

function ResponderWelcomeView({ deal, onSubmit, midpoint, setMidpoint, submitting, anchor, targets }: any) {
  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>Welcome to the Protocol</h2>
      <p style={{ marginBottom: '1.5rem' }}>
        You have been invited to a private alignment. This protocol uses a <strong>{formatPercent(deal.flexibility || deal.spread)} maximum flexibility</strong> constraint.
      </p>

      <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Private Analysis</h4>
        <p style={{ fontSize: '1rem', lineHeight: '1.5' }}>
          If your ranges overlap, the system will identify a match. If you are too far apart, no information is shared—not even the direction of the gap.
        </p>
      </div>
      
      <div className="form-group">
        <label className="label">Your Mid-Point Target (Ideal Price)</label>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
             <input className="input" type="number" required placeholder="100,000" value={midpoint} onChange={e => setMidpoint(e.target.value)} />
          </div>

          <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Secure Range Preview</h4>
              <span className="badge badge-active" style={{ fontSize: '0.9rem' }}>
                {formatCurrency(anchor.min, deal.currency)} – {formatCurrency(anchor.max, deal.currency)}
              </span>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              Your private range centered on your target. Used for the initial match check.
            </p>
            
            <MarketSpreadVisualizer 
            range={anchor} 
            targets={targets}
            currency={deal.currency} 
          />
          </div>

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={submitting}>
            Submit Secure Bid
          </button>
        </form>
      </div>
    </div>
  );
}

function Round2UnifiedView({ deal, party, onSubmit, onReject, midpoint, setMidpoint, submitting, r1Range, anchor, targets }: any) {
  const hasSubmitted = party === 'A' ? deal.round2SubmittedA : deal.round2SubmittedB;
  const isB = party === 'B';
  const bIsAbove = deal.result?.direction === 'above';
  const hint = isB ? (bIsAbove ? "BELOW" : "ABOVE") : (bIsAbove ? "ABOVE" : "BELOW");

  if (hasSubmitted) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Bid Submitted</h2>
        <div style={{ padding: '2rem', border: '1px dashed var(--accent-color)', borderRadius: '1rem' }}>
          <p className="animate-pulse">Waiting for your counterpart to decide or submit their final range...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>Common Ground Found</h2>
      <p style={{ marginBottom: '1.5rem' }}>A match is possible within your shared flexibility. See the direction below:</p>
      
      {r1Range && (
        <MarketSpreadVisualizer 
          range={r1Range} 
          targets={{
            min: Math.round(((r1Range.min + r1Range.max)/2) * (1 - (deal.flexibility || deal.spread))),
            max: Math.round(((r1Range.min + r1Range.max)/2) * (1 + (deal.flexibility || deal.spread)))
          }}
          currency={deal.currency} 
          hint={hint} 
        />
      )}

      <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Final Round Submission</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '1rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          Submit your final target below. Your new matching window <strong>must overlap</strong> with your original window ({formatCurrency(r1Range?.min || 0, deal.currency)} - {formatCurrency(r1Range?.max || 0, deal.currency)}).
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <input className="input" type="number" required placeholder="Final Target" value={midpoint} onChange={e => setMidpoint(e.target.value)} />
          </div>

          {Number(midpoint) > 0 && (
            <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
              <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Final Commitment Preview</h4>
              <MarketSpreadVisualizer 
                range={anchor} 
                targets={targets}
                currency={deal.currency} 
              />
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '1rem', textAlign: 'center' }}>
                Your final target will be compared against the other party&apos;s range.
              </p>
            </div>
          )}
          
          <div className="r2-actions">
            <button className="btn btn-primary" disabled={submitting}>
              Submit Final Bid
            </button>
            <button type="button" className="btn btn-error" onClick={onReject} disabled={submitting}>
              End Protocol
            </button>
          </div>

          <style jsx>{`
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
    <div className="card" style={{ textAlign: 'center', border: isMatch ? '2px solid var(--success-color)' : '1px solid var(--text-secondary)' }}>
      {isMatch ? (
        <>
          <h2 style={{ color: 'var(--success-color)', marginBottom: '1rem' }}>Alignment Achieved</h2>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', margin: '2rem 0' }}>{formatCurrency(deal.result?.value || 0, deal.currency)}</div>
          <p>The system found a safe midpoint within your shared flexibility.</p>
        </>
      ) : (
        <>
          <h2 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No Alignment</h2>
          <p>The protocol concluded without a match. No further information was revealed.</p>
        </>
      )}
    </div>
  );
}

function RejectedView() {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <h2 style={{ color: 'var(--error-color)', marginBottom: '1.5rem' }}>Protocol Terminated</h2>
      <p>One of the parties chose not to proceed to Round 2. The deal is now closed.</p>
    </div>
  );
}

function AuthView({ handleLogin }: any) {
  return (
    <main className="container">
      <div className="card animate-fade-in" style={{ textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Secure Access</h2>
        <p style={{ marginBottom: '2rem', opacity: 0.8 }}>Please verify your identity to access this protocol.</p>
        <button className="btn btn-primary" onClick={handleLogin}>Sign in with Google</button>
      </div>
    </main>
  );
}

function AccessDeniedView({ email }: { email: string }) {
  return (
    <main className="container">
      <div className="card animate-fade-in" style={{ textAlign: 'center' }}>
        <h2 style={{ color: 'var(--error-color)', marginBottom: '1.5rem' }}>Access Denied</h2>
        <p>Account <strong>{email}</strong> is not authorized for this deal.</p>
        <button className="btn" style={{ marginTop: '2rem' }} onClick={() => signOut(auth)}>Sign out</button>
      </div>
    </main>
  );
}
