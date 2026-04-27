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
  const [midpoint, setMidpoint] = useState('100000');
  const [selectedSpread, setSelectedSpread] = useState(0.2); // 20%
  const [partyBEmail, setPartyBEmail] = useState('');
  const [currency, setCurrency] = useState('$');

  // Derived Protocol Values
  const { anchor, targets, spread } = useMemo(() => {
    const m = Number(midpoint);
    if (!m || m <= 0) return { anchor: { min: 0, max: 0 }, targets: { min: 0, max: 0 }, spread: selectedSpread };

    // Full flexibility range as the initial bid
    const tMin = Math.round(m * (1 - selectedSpread));
    const tMax = Math.round(m * (1 + selectedSpread));

    // Calculate spread from the EXACT rounded values we are about to store/submit.
    // This avoids "exceeds spread" errors caused by tiny rounding differences.
    const protocolSpread = (tMax / tMin) - 1;

    return {
      anchor: { min: tMin, max: tMax },
      targets: { min: tMin, max: tMax },
      spread: protocolSpread
    };
  }, [midpoint, selectedSpread]);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);


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
          flexibility: selectedSpread,
          partyBEmail,
          initialRange: anchor
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
                <label className="label">Mid-Point Target (Ideal Price)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input 
                    className="input" 
                    type="text" 
                    style={{ width: '60px', textAlign: 'center' }}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                  <input 
                    className="input" 
                    type="number" 
                    required 
                    placeholder="100,000"
                    value={midpoint}
                    onChange={(e) => setMidpoint(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2rem', marginTop: '2rem' }}>
                <h3 style={{ marginBottom: '1rem' }}>Negotiation Flexibility</h3>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  How far are you willing to move from your ideal price if the other party is close?
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
                  {[0.1, 0.15, 0.2, 0.3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn ${selectedSpread === s ? 'btn-active' : ''}`}
                      style={{ 
                        padding: '0.75rem', 
                        fontSize: '0.875rem',
                        background: selectedSpread === s ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                        border: selectedSpread === s ? 'none' : '1px solid rgba(255,255,255,0.1)'
                      }}
                      onClick={() => setSelectedSpread(s)}
                    >
                      {formatPercent(s)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>Range Preview</h4>
                  <span className="badge badge-active" style={{ fontSize: '0.85rem' }}>
                    {formatCurrency(anchor.min, currency)} – {formatCurrency(anchor.max, currency)}
                  </span>
                </div>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                  This is your private matching window. If the other party&apos;s window overlaps with yours, an immediate match is found at the midpoint.
                </p>
                
                <MarketSpreadVisualizer 
                  range={anchor} 
                  targets={targets}
                  currency={currency} 
                />
                
                <div style={{ fontSize: '0.95rem', background: 'rgba(99, 102, 241, 0.05)', padding: '1.25rem', borderRadius: '0.5rem', marginTop: '1rem', border: '1px solid rgba(99, 102, 241, 0.2)', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                  🛡️ <strong style={{ color: 'var(--accent-color)' }}>The Privacy Shield:</strong> The system only reveals direction <strong>if a match is feasible</strong> within your shared thresholds. If you are so far apart that no alignment is possible, the protocol simply ends without disclosing anything at all—not even the direction.
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

function MarketSpreadVisualizer({ range, targets, currency }: { range: { min: number, max: number }, targets: { min: number, max: number }, currency: string }) {
  if (range.min <= 0 || range.max < range.min) return null;
  
  const rawMin = targets.min * 0.85; // Add 15% visual padding
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
    </div>
  );
}
