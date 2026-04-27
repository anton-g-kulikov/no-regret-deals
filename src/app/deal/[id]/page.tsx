'use client';

import { useState, useEffect } from 'react';
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
  
  // Local Form State
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [r1Range, setR1Range] = useState<Range | null>(null);

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
        body: JSON.stringify({ party, round, range: { min: Number(min), max: Number(max) } }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setMin(''); setMax('');
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

        {deal.status === 'WAITING_FOR_B1' && (
          isPartyA ? <InitiatorInstructions deal={deal} /> : <ResponderWelcomeView deal={deal} onSubmit={handleBid} min={min} setMin={setMin} max={max} setMax={setMax} submitting={submitting} />
        )}

        {(deal.status === 'DECIDING_ON_R2' || deal.status === 'WAITING_FOR_R2_BIDS') && (
          <Round2UnifiedView 
            deal={deal} 
            party={party} 
            onSubmit={handleBid}
            onReject={handleReject}
            min={min} setMin={setMin} 
            max={max} setMax={setMax} 
            submitting={submitting}
            r1Range={r1Range}
          />
        )}

        {deal.status === 'COMPLETED' && <ResultView deal={deal} />}
        {deal.status === 'REJECTED' && <RejectedView />}
      </div>
    </main>
  );
}

// --- Sub-Components ---

function MarketSpreadVisualizer({ range, spread, currency, hint }: { range: { min: number, max: number }, spread: number, currency: string, hint?: string }) {
  if (range.min <= 0 || range.max < range.min) return null;
  
  const reachMin = calculateSafeReach(range.min, spread, 'min');
  const reachMax = calculateSafeReach(range.max, spread, 'max');
  
  const rawMin = range.min / (1 + spread);
  const rawMax = range.max * (1 + spread);
  const totalRange = rawMax - rawMin;
  const leftPadding = ((range.min - rawMin) / totalRange) * 100;
  const width = ((range.max - range.min) / totalRange) * 100;

  return (
    <div style={{ margin: '1.5rem 0', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.4, marginBottom: '1rem', padding: '0 4px' }}>
        <span>{formatCurrency(reachMin, currency)} (Lowest Threshold)</span>
        <span>{formatCurrency(reachMax, currency)} (Highest Threshold)</span>
      </div>
      
      <div style={{ height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ 
          position: 'absolute', 
          left: `${leftPadding}%`, 
          width: `${width}%`, 
          height: '100%', 
          background: 'var(--accent-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '0.65rem',
          fontWeight: 'bold',
          zIndex: 2,
          boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)'
        }}>
          ANCHOR
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginTop: '0.5rem', padding: '0 4px', opacity: 0.8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', left: `${leftPadding}%`, transform: 'translateX(-50%)' }}>
          <div style={{ height: '6px', width: '1px', background: 'var(--accent-color)', marginBottom: '4px' }} />
          <span>{formatCurrency(range.min, currency)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', left: `${leftPadding + width}%`, transform: 'translateX(-50%)' }}>
          <div style={{ height: '6px', width: '1px', background: 'var(--accent-color)', marginBottom: '4px' }} />
          <span>{formatCurrency(range.max, currency)}</span>
        </div>
      </div>

      {hint && (
        <div style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--accent-color)', fontWeight: 'bold', fontSize: '1rem' }}>
          {hint === 'ABOVE' ? '↑ THE OTHER PARTY IS HIGHER' : '↓ THE OTHER PARTY IS LOWER'}
        </div>
      )}
    </div>
  );
}

function Header({ deal, userEmail }: { deal: Deal, userEmail: string }) {
  return (
    <header style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>{deal.status === 'COMPLETED' ? 'Final Alignment' : 'Protocol in Progress'}</h1>
        <span className={`badge badge-${deal.status === 'COMPLETED' ? 'success' : 'active'}`}>
          {deal.status.replace(/_/g, ' ')}
        </span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', opacity: 0.7, fontSize: '0.85rem' }}>
        <p>ID: {deal.id}</p>
        <p>Signed in as: <strong>{userEmail}</strong></p>
      </div>
    </header>
  );
}

function InitiatorInstructions({ deal }: { deal: Deal }) {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>Deal Created Successfully</h2>
      <p style={{ marginBottom: '1.5rem' }}>Your initial range and <strong>{formatPercent(deal.spread)} spread</strong> are locked in.</p>
      
      <div style={{ background: 'var(--surface-hover)', padding: '1.5rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem', opacity: 0.7 }}>Share this URL with Party B:</p>
        <code style={{ wordBreak: 'break-all', color: 'var(--accent-color)' }}>{url}</code>
        <button className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} onClick={() => {
          navigator.clipboard.writeText(url);
          alert('URL copied to clipboard');
        }}>Copy Invite URL</button>
      </div>

      <div style={{ borderLeft: '4px solid var(--accent-color)', paddingLeft: '1rem', margin: '2rem 0' }}>
        <h4 style={{ color: 'var(--accent-color)' }}>The Anchoring Rule</h4>
        <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
          Remember: If no match is found now, your second range (if you proceed) <strong>must overlap</strong> with the range you just submitted.
        </p>
      </div>

      <div style={{ marginTop: '2rem', padding: '1.5rem', border: '1px dashed var(--accent-color)', borderRadius: '0.5rem', textAlign: 'center' }}>
        <p className="animate-pulse">Waiting for Party B to join...</p>
      </div>
    </div>
  );
}

function ResponderWelcomeView({ deal, onSubmit, min, setMin, max, setMax, submitting }: any) {
  return (
    <div className="card">
      <h2 style={{ marginBottom: '1.5rem' }}>Welcome to the Protocol</h2>
      <p style={{ marginBottom: '1.5rem' }}>
        You have been invited to a private alignment. This protocol uses a <strong>{formatPercent(deal.spread)} maximum spread</strong> constraint.
      </p>

      <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem', borderRadius: '0.5rem', marginBottom: '2rem', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
        <h4 style={{ color: 'var(--accent-color)', marginBottom: '0.5rem' }}>🛡️ The Privacy Shield</h4>
        <p style={{ fontSize: '0.875rem' }}>
          If a match is feasible, the system will only reveal direction. If you are too far apart, the system reveals <strong>nothing</strong>—not even direction.
        </p>
      </div>
      
      <div className="form-group">
        <label className="label">Your Private Range (Round 1)</label>
        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <input className="input" type="number" required placeholder="Min" value={min} onChange={e => setMin(e.target.value)} />
            <input className="input" type="number" required placeholder="Max" value={max} onChange={e => setMax(e.target.value)} />
          </div>
          
          <MarketSpreadVisualizer 
            range={{ min: Number(min) || 0, max: Number(max) || 0 }} 
            spread={deal.spread} 
            currency={deal.currency} 
          />

          <button className="btn btn-primary" style={{ width: '100%', marginTop: '1.5rem' }} disabled={submitting}>
            Submit Secure Bid
          </button>
        </form>
      </div>
    </div>
  );
}

function Round2UnifiedView({ deal, party, onSubmit, onReject, min, setMin, max, setMax, submitting, r1Range }: any) {
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
      <h2 style={{ marginBottom: '1.5rem' }}>Round 1 Result</h2>
      <p style={{ marginBottom: '1.5rem' }}>A match is <strong>feasible</strong> within your shared thresholds. Reveal the direction below:</p>
      
      {r1Range && <MarketSpreadVisualizer range={r1Range} spread={deal.spread} currency={deal.currency} hint={hint} />}

      <div style={{ marginTop: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem' }}>
        <h3 style={{ marginBottom: '1rem' }}>Final Round Submission</h3>
        <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', opacity: 0.7 }}>
          If you wish to proceed, submit your final range below. Your new range <strong>must overlap</strong> with your anchor ({formatCurrency(r1Range?.min || 0, deal.currency)} - {formatCurrency(r1Range?.max || 0, deal.currency)}).
        </p>

        <form onSubmit={onSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
            <input className="input" type="number" required placeholder="Min" value={min} onChange={e => setMin(e.target.value)} />
            <input className="input" type="number" required placeholder="Max" value={max} onChange={e => setMax(e.target.value)} />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              Submit Final Bid
            </button>
            <button type="button" className="btn" style={{ background: 'var(--error-color)', width: '100%' }} onClick={onReject} disabled={submitting}>
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
