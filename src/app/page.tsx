'use client';

import { useState, useEffect, useMemo } from 'react';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase-client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { formatCurrency, formatPercent, calculateSafeReach } from '@/lib/protocol/format';

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Core Form State
  const [currency, setCurrency] = useState('$');
  const [partyBEmail, setPartyBEmail] = useState('');
  
  // Default values for 20% spread with 100-110 anchor:
  // 100 / 1.2 = 83.33 (84 is safe)
  // 110 * 1.2 = 132
  const [min, setMin] = useState('100');
  const [max, setMax] = useState('110');
  
  // Negotiation Room (Discovery Mode)
  const [targetReachMin, setTargetReachMin] = useState('84');
  const [targetReachMax, setTargetReachMax] = useState('132');
  
  // Derived State
  const { spread, limitingSide } = useMemo(() => {
    const r1Min = Number(min);
    const r1Max = Number(max);
    const tMin = Number(targetReachMin);
    const tMax = Number(targetReachMax);

    if (r1Min > 0 && r1Max >= r1Min && tMin > 0 && tMax > 0 && tMin <= r1Min && tMax >= r1Max) {
      const sLow = (r1Min / tMin) - 1;
      const sHigh = (tMax / r1Max) - 1;
      
      const calculated = Math.max(0.05, Math.max(sLow, sHigh));
      let side: 'min' | 'max' | 'both' = 'both';

      if (Math.abs(sLow - sHigh) < 0.01) side = 'both';
      else if (sLow > sHigh) side = 'min';
      else side = 'max';

      return { spread: calculated, limitingSide: side };
    }
    return { spread: 0.2, limitingSide: 'both' as const };
  }, [min, max, targetReachMin, targetReachMax]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const updateMin = (val: string) => {
    setMin(val);
    if (Number(targetReachMin) > Number(val)) setTargetReachMin(val);
  };

  const updateMax = (val: string) => {
    setMax(val);
    if (Number(targetReachMax) < Number(val)) setTargetReachMax(val);
  };

  const updateTargetMin = (val: string) => {
    const v = Number(val);
    const rMin = Number(min);
    setTargetReachMin(v > rMin ? min : val);
  };

  const updateTargetMax = (val: string) => {
    const v = Number(val);
    const rMax = Number(max);
    setTargetReachMax(v < rMax ? max : val);
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error('Login failed:', error);
    }
  };

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setCreating(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/deals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          currency,
          spread,
          partyBEmail,
          initialRange: { min: Number(min), max: Number(max) }
        }),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create deal');
      
      const { dealId } = await res.json();
      window.location.href = `/deal/${dealId}`;
    } catch (error: any) {
      console.error('Error:', error);
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="container">Loading...</div>;

  return (
    <main className="container">
      <div className="animate-fade-in">
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>No Regret Deals</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
            Privacy-preserving alignment for high-value agreements.
          </p>
        </header>

        {!user ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Get Started</h2>
            <button className="btn btn-primary" onClick={handleLogin}>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="card">
            <h2 style={{ marginBottom: '2rem' }}>Configure Alignment</h2>
            <form onSubmit={handleCreateDeal}>
              <div className="form-group">
                <label className="label">Responder&apos;s Google Email (Party B)</label>
                <input 
                  className="input" 
                  type="email" 
                  required 
                  placeholder="candidate@gmail.com"
                  value={partyBEmail}
                  onChange={(e) => setPartyBEmail(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="label">Currency</label>
                <input 
                  className="input" 
                  type="text" 
                  required 
                  placeholder="$" 
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>1. Your Secure Anchor</h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1.5rem' }}>
                  The private range you are comfortable with right now. You won&apos;t have to move from this unless a match is found.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="label">Min</label>
                    <input className="input" type="number" required value={min} onChange={(e) => updateMin(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Max</label>
                    <input className="input" type="number" required value={max} onChange={(e) => updateMax(e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', marginTop: '1rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>2. Your Negotiation Intent</h3>
                <p style={{ fontSize: '0.875rem', opacity: 0.7, marginBottom: '1.5rem' }}>
                  Set the boundaries of where you are willing to move if the other party is close.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="label">Target Min Consideration</label>
                    <input className="input" type="number" required value={targetReachMin} onChange={(e) => updateTargetMin(e.target.value)} />
                  </div>
                  <div className="form-group">
                    <label className="label">Target Max Consideration</label>
                    <input className="input" type="number" required value={targetReachMax} onChange={(e) => updateTargetMax(e.target.value)} />
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '0.875rem', opacity: 0.7 }}>Threshold Preview</h4>
                  <span className="badge badge-active" style={{ fontSize: '0.75rem' }}>
                    PROTOCOL SPREAD: {formatPercent(spread)}
                  </span>
                </div>
                
                <MarketSpreadVisualizer 
                  range={{ min: Number(min) || 0, max: Number(max) || 0 }} 
                  targets={{ min: Number(targetReachMin) || 0, max: Number(targetReachMax) || 0 }}
                  spread={spread} 
                  currency={currency} 
                />
                
                <div style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1rem', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  🛡️ <strong>The Privacy Shield:</strong> The system only reveals direction <strong>if a match is feasible</strong> within your shared thresholds. If you are so far apart that no alignment is possible, the protocol simply ends without disclosing anything at all—not even the direction.
                </div>
              </div>

              <button 
                className="btn btn-primary" 
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Initialize Deal'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

function MarketSpreadVisualizer({ range, targets, spread, currency }: { range: { min: number, max: number }, targets: { min: number, max: number }, spread: number, currency: string }) {
  if (range.min <= 0 || range.max < range.min) return null;
  
  const reachMin = calculateSafeReach(range.min, spread, 'min');
  const reachMax = calculateSafeReach(range.max, spread, 'max');
  
  const rawMin = range.min / (1 + spread);
  const rawMax = range.max * (1 + spread);
  const totalRange = rawMax - rawMin;
  
  const leftPadding = ((range.min - rawMin) / totalRange) * 100;
  const width = ((range.max - range.min) / totalRange) * 100;

  const targetLeftPadding = ((targets.min - rawMin) / totalRange) * 100;
  const targetWidth = ((targets.max - targets.min) / totalRange) * 100;

  return (
    <div style={{ margin: '1.5rem 0', position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', opacity: 0.4, marginBottom: '1rem', padding: '0 4px' }}>
        <span>{formatCurrency(reachMin, currency)} (Lowest Threshold)</span>
        <span>{formatCurrency(reachMax, currency)} (Highest Threshold)</span>
      </div>
      
      <div style={{ height: '40px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', position: 'relative', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ 
          position: 'absolute', 
          left: `${targetLeftPadding}%`, 
          width: `${targetWidth}%`, 
          height: '100%', 
          background: 'rgba(99, 102, 241, 0.1)',
          zIndex: 1,
          borderLeft: '2px solid rgba(99, 102, 241, 0.5)',
          borderRight: '2px solid rgba(99, 102, 241, 0.5)',
        }} />

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', left: `${targetLeftPadding}%`, transform: 'translateX(-50%)' }}>
          <div style={{ height: '6px', width: '1px', background: 'var(--accent-color)', marginBottom: '4px' }} />
          <span>{formatCurrency(targets.min, currency)}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'absolute', left: `${targetLeftPadding + targetWidth}%`, transform: 'translateX(-50%)' }}>
          <div style={{ height: '6px', width: '1px', background: 'var(--accent-color)', marginBottom: '4px' }} />
          <span>{formatCurrency(targets.max, currency)}</span>
        </div>
      </div>

      <div style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.65rem', opacity: 0.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Your Intended Negotiation Room
      </div>
    </div>
  );
}
