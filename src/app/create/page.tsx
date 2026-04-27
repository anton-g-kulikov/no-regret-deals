'use client';

import { useState, useEffect, useMemo } from 'react';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase-client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { formatCurrency, formatPercent } from '@/lib/protocol/format';

export default function CreateDealPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Core Form State
  const [midpoint, setMidpoint] = useState('100000');
  const [selectedSpread, setSelectedSpread] = useState(0.2); // 20%
  const [partyBEmail, setPartyBEmail] = useState('');
  const [currency, setCurrency] = useState('$');
  const [description, setDescription] = useState('');

  // Derived Protocol Values
  const { anchor, targets, spread } = useMemo(() => {
    const m = Number(midpoint);
    if (!m || m <= 0) return { anchor: { min: 0, max: 0 }, targets: { min: 0, max: 0 }, spread: selectedSpread };

    const tMin = Math.round(m * (1 - selectedSpread));
    const tMax = Math.round(m * (1 + selectedSpread));
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
          initialRange: anchor,
          description
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

  if (loading) return <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
    <div className="animate-pulse" style={{ fontSize: '1.25rem', color: 'var(--text-secondary)' }}>Loading authentication...</div>
  </div>;

  return (
    <main className="container" style={{ maxWidth: '800px', paddingBottom: '6rem' }}>
      <div className="animate-fade-in">
        <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>Initialize New Alignment</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            Set your target and invite your counterpart.
          </p>
        </header>

        {!user ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Identity Required</h2>
            <p style={{ marginBottom: '2.5rem', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 2.5rem' }}>
              We use Google Authentication to verify your identity and ensure the privacy of your deals.
            </p>
            <button className="btn btn-primary btn-lg" onClick={handleLogin}>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="card shadow-lg" style={{ padding: '3rem' }}>
            <form onSubmit={handleCreateDeal}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="label" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Negotiation Subject</label>
                <textarea 
                  className="input" 
                  rows={2}
                  placeholder="e.g., Senior Product Designer Salary or Purchase of &apos;Sunset Over Mars&apos; Art"
                  style={{ resize: 'none', padding: '1rem', fontSize: '1.1rem' }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="label" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Responder&apos;s Google Email (Party B)</label>
                <input 
                  className="input" 
                  type="email" 
                  required 
                  placeholder="their-email@gmail.com"
                  style={{ padding: '1rem', fontSize: '1.1rem' }}
                  value={partyBEmail}
                  onChange={(e) => setPartyBEmail(e.target.value)}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                  Only this account will be able to access this protocol.
                </p>
              </div>

              <div className="form-group" style={{ marginBottom: '3rem' }}>
                <label className="label" style={{ fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.8 }}>Your Ideal Target Price</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <input 
                    className="input" 
                    type="text" 
                    style={{ width: '80px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                  <input 
                    className="input" 
                    type="number" 
                    required 
                    placeholder="100,000"
                    style={{ fontSize: '1.25rem', fontWeight: 'bold', padding: '1rem' }}
                    value={midpoint}
                    onChange={(e) => setMidpoint(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '2.5rem', marginTop: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Negotiation Flexibility</h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      The maximum &quot;distance&quot; you&apos;re willing to move to find common ground.
                    </p>
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--accent-color)' }}>
                    {formatPercent(selectedSpread)}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '2.5rem' }}>
                  {[0.1, 0.15, 0.2, 0.3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn ${selectedSpread === s ? 'btn-active' : ''}`}
                      style={{ 
                        padding: '1rem', 
                        fontSize: '1rem',
                        background: selectedSpread === s ? 'var(--accent-color)' : 'rgba(255,255,255,0.03)',
                        border: selectedSpread === s ? 'none' : '1px solid var(--border-color)'
                      }}
                      onClick={() => setSelectedSpread(s)}
                    >
                      {formatPercent(s)}
                    </button>
                  ))}
                </div>

                <div className="preview-box" style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '1rem', padding: '2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Initial Secure Range</h4>
                    <span className="badge badge-active" style={{ fontSize: '0.9rem', padding: '0.4rem 0.8rem' }}>
                      {formatCurrency(anchor.min, currency)} – {formatCurrency(anchor.max, currency)}
                    </span>
                  </div>
                  
                  <div style={{ height: '48px', background: 'var(--surface-hover)', borderRadius: '12px', position: 'relative', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
                    <div style={{ 
                      position: 'absolute', 
                      left: '25%', 
                      width: '50%', 
                      height: '100%', 
                      background: 'rgba(99, 102, 241, 0.15)',
                      zIndex: 1,
                      borderLeft: '2px solid rgba(99, 102, 241, 0.6)',
                      borderRight: '2px solid rgba(99, 102, 241, 0.6)',
                    }} />
                    <div style={{ 
                      position: 'absolute', 
                      left: '50%', 
                      width: '4px', 
                      height: '100%', 
                      background: 'var(--text-primary)',
                      zIndex: 2,
                      boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                      transform: 'translateX(-50%)'
                    }} />
                  </div>

                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', textAlign: 'center' }}>
                    Your numbers are processed internally. The other party only sees your target if an overlap is found. If you&apos;re too far apart, no data is shared.
                  </p>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-lg" 
                style={{ width: '100%', marginTop: '3rem' }}
                disabled={creating}
              >
                {creating ? 'Starting Protocol...' : 'Initialize Private Alignment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
