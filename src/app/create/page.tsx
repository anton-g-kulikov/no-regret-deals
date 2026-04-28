'use client';

import { useState, useEffect, useMemo } from 'react';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase-client';
import { onAuthStateChanged, User } from 'firebase/auth';
import { formatCurrency, formatPercent } from '@/lib/protocol/format';

const COMMON_CURRENCIES = [
  { symbol: '$', label: 'USD ($)' },
  { symbol: '€', label: 'EUR (€)' },
  { symbol: '¥', label: 'JPY (¥)' },
  { symbol: '£', label: 'GBP (£)' },
  { symbol: 'A$', label: 'AUD (A$)' },
  { symbol: 'C$', label: 'CAD (C$)' },
  { symbol: 'CHF', label: 'CHF' },
  { symbol: '¥', label: 'CNY (¥)' },
  { symbol: 'HK$', label: 'HKD (HK$)' },
  { symbol: 'kr', label: 'SEK (kr)' },
  { symbol: '₽', label: 'RUB (₽)' },
  { symbol: '₴', label: 'UAH (₴)' },
  { symbol: 'R$', label: 'BRL (R$)' },
  { symbol: 'د.إ', label: 'AED (د.إ)' },
];

export default function CreateDealPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Core Form State
  const [midpoint, setMidpoint] = useState('100000');
  const [selectedSpread, setSelectedSpread] = useState(0.1); // 10% default
  const [partyBEmail, setPartyBEmail] = useState('');
  const [currency, setCurrency] = useState('$');
  const [description, setDescription] = useState('');

  // Derived Protocol Values
  const { anchor, targets, spread } = useMemo(() => {
    const m = Number(midpoint);
    if (!m || m <= 0) return { anchor: { min: 0, max: 0 }, targets: { min: 0, max: 0 }, spread: selectedSpread };

    const tMin = Math.round(m * (1 - selectedSpread / 2));
    const tMax = Math.round(m * (1 + selectedSpread / 2));
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
                <label className="label uppercase-label">Your Ideal Target Value</label>
                <div className="currency-input-group">
                  <select 
                    className="input currency-select" 
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                  >
                    {COMMON_CURRENCIES.map((c) => (
                      <option key={`${c.label}-${c.symbol}`} value={c.symbol}>
                        {c.label}
                      </option>
                    ))}
                  </select>
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
                    <h3>Negotiation Spread</h3>
                    <p className="flex-desc">
                      The total range of movement you&apos;re willing to consider.
                    </p>
                  </div>
                  <div className="flex-value">
                    {formatPercent(selectedSpread)}
                  </div>
                </div>
                
                <div className="spread-grid">
                  {[0.05, 0.1, 0.15, 0.2].map((s) => (
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
                {creating ? 'Submitting...' : 'Submit Your Target Range'}
              </button>
            </form>
          </div>
        )}
      </div>

      
    </main>
  );
}
