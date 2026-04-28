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
      alert(error.message || 'Login failed. Please check the console for details.');
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
    } catch (error: unknown) {
      console.error('Error:', error);
      if (error instanceof Error) alert(error.message);
      else alert('An unexpected error occurred');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="container loading-container">
    <div className="animate-pulse loading-text">Loading authentication...</div>
    <style jsx>{`
      .loading-container { display: flex; align-items: center; justify-content: center; height: 80vh; }
      .loading-text { font-size: 1.25rem; color: var(--text-secondary); }
    `}</style>
  </div>;

  return (
    <main className="container create-main">
      <div className="animate-fade-in">
        <header className="page-header">
          <h1>Initialize New Alignment</h1>
          <p className="subtitle">
            Set your target and invite your counterpart.
          </p>
        </header>

        {!user ? (
          <div className="card auth-required-card">
            <h2>Identity Required</h2>
            <p className="auth-desc">
              We use Google Authentication to verify your identity and ensure the privacy of your deals.
            </p>
            <button className="btn btn-primary btn-lg" onClick={handleLogin}>
              Sign in with Google
            </button>
          </div>
        ) : (
          <div className="card shadow-lg form-card">
            <form onSubmit={handleCreateDeal}>
              <div className="form-group mb-2">
                <label className="label uppercase-label">Negotiation Subject</label>
                <textarea 
                  className="input subject-input" 
                  rows={2}
                  placeholder="e.g., Senior Product Designer Salary or Purchase of 'Sunset Over Mars' Art"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="form-group mb-2">
                <label className="label uppercase-label">Responder&apos;s Google Email (Party B)</label>
                <input 
                  className="input padded-input" 
                  type="email" 
                  required 
                  placeholder="their-email@gmail.com"
                  value={partyBEmail}
                  onChange={(e) => setPartyBEmail(e.target.value)}
                />
                <p className="input-hint">
                  Only this account will be able to access this protocol.
                </p>
              </div>

              <div className="form-group mb-3">
                <label className="label uppercase-label">Your Ideal Target Price</label>
                <div className="currency-input-group">
                  <input 
                    className="input currency-symbol" 
                    type="text" 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  />
                  <input 
                    className="input amount-input" 
                    type="number" 
                    required 
                    placeholder="100,000"
                    value={midpoint}
                    onChange={(e) => setMidpoint(e.target.value)}
                  />
                </div>
              </div>

              <div className="flexibility-section">
                <div className="flexibility-header">
                  <div>
                    <h3>Negotiation Flexibility</h3>
                    <p className="flex-desc">
                      The maximum &quot;distance&quot; you&apos;re willing to move to find common ground.
                    </p>
                  </div>
                  <div className="flex-value">
                    {formatPercent(selectedSpread)}
                  </div>
                </div>
                
                <div className="spread-grid">
                  {[0.1, 0.15, 0.2, 0.3].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`btn spread-btn ${selectedSpread === s ? 'btn-active active-spread' : ''}`}
                      onClick={() => setSelectedSpread(s)}
                    >
                      {formatPercent(s)}
                    </button>
                  ))}
                </div>

                <div className="preview-box">
                  <div className="preview-header">
                    <h4>Initial Secure Range</h4>
                    <span className="badge badge-active secure-badge">
                      {formatCurrency(anchor.min, currency)} – {formatCurrency(anchor.max, currency)}
                    </span>
                  </div>
                  
                  <div className="visualizer-track">
                    <div className="visualizer-secure-range" />
                    <div className="visualizer-midpoint-line" />
                  </div>

                  <p className="privacy-note">
                    Your numbers are processed internally. The other party only sees your target if an overlap is found. If you&apos;re too far apart, no data is shared.
                  </p>
                </div>
              </div>

              <button 
                className="btn btn-primary btn-lg submit-btn" 
                disabled={creating}
              >
                {creating ? 'Starting Protocol...' : 'Initialize Private Alignment'}
              </button>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .create-main { max-width: 800px; padding-bottom: 6rem; }
        .page-header { margin-bottom: 3rem; text-align: center; }
        .page-header h1 { font-size: 2.5rem; margin-bottom: 0.75rem; }
        .subtitle { color: var(--text-secondary); font-size: 1.1rem; }
        
        .auth-required-card { text-align: center; padding: 4rem 2rem; }
        .auth-required-card h2 { margin-bottom: 1.5rem; }
        .auth-desc { margin-bottom: 2.5rem; color: var(--text-secondary); max-width: 400px; margin: 0 auto 2.5rem; }
        
        .form-card { padding: 3rem; }
        .mb-2 { margin-bottom: 2rem; }
        .mb-3 { margin-bottom: 3rem; }
        
        .uppercase-label { font-size: 0.9rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.8; }
        .subject-input { resize: none; padding: 1rem; font-size: 1.1rem; }
        .padded-input { padding: 1rem; font-size: 1.1rem; }
        .input-hint { font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem; }
        
        .currency-input-group { display: flex; gap: 1rem; }
        .currency-symbol { width: 80px; text-align: center; font-size: 1.25rem; font-weight: bold; }
        .amount-input { font-size: 1.25rem; font-weight: bold; padding: 1rem; }
        
        .flexibility-section { border-top: 1px solid var(--border-color); padding-top: 2.5rem; margin-top: 2.5rem; }
        .flexibility-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 1.5rem; }
        .flexibility-header h3 { font-size: 1.25rem; margin-bottom: 0.5rem; }
        .flex-desc { font-size: 0.9rem; color: var(--text-secondary); }
        .flex-value { font-size: 1.25rem; font-weight: bold; color: var(--accent-color); }
        
        .spread-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.75rem; margin-bottom: 2.5rem; }
        .spread-btn { padding: 1rem; font-size: 1rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); }
        .active-spread { background: var(--accent-color); border: none; }
        
        .preview-box { background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 1rem; padding: 2rem; }
        .preview-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .preview-header h4 { font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; }
        .secure-badge { font-size: 0.9rem; padding: 0.4rem 0.8rem; }
        
        .visualizer-track { height: 48px; background: var(--surface-hover); border-radius: 12px; position: relative; overflow: hidden; border: 1px solid var(--border-color); margin-bottom: 1.5rem; }
        .visualizer-secure-range { position: absolute; left: 25%; width: 50%; height: 100%; background: rgba(99, 102, 241, 0.15); z-index: 1; border-left: 2px solid rgba(99, 102, 241, 0.6); border-right: 2px solid rgba(99, 102, 241, 0.6); }
        .visualizer-midpoint-line { position: absolute; left: 50%; width: 4px; height: 100%; background: var(--text-primary); z-index: 2; box-shadow: 0 0 10px rgba(255,255,255,0.5); transform: translateX(-50%); }
        
        .privacy-note { font-size: 0.875rem; color: var(--text-secondary); line-height: 1.6; text-align: center; }
        
        .submit-btn { width: 100%; margin-top: 3rem; }

        @media (max-width: 640px) {
          .spread-grid { grid-template-columns: repeat(2, 1fr); }
          .flexibility-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
        }
      `}</style>
    </main>
  );
}
