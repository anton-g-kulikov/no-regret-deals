'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState<'partyA' | 'partyB'>('partyA');
  const [stats, setStats] = useState({ fairDeals: 0, unfairDealsPrevented: 0 });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStats(data);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="landing-container">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content animate-fade-in">
          <div className="badge-wrapper">
            <span className="badge badge-active">Private Alignment Protocol</span>
          </div>
          <h1>Find Common Ground <br /> <span className="text-gradient">Without Revealing Your Hand</span></h1>
          <p className="hero-subtitle">
            No Regret Deals uses the <Link href="/protocol">Private Alignment Protocol</Link>{' '}to match parties on price, salary, or value.
            Strike a deal instantly if you overlap, or walk away with your privacy intact if you don&apos;t.
          </p>
          <div className="hero-actions">
            <Link href="/create" className="btn btn-primary btn-lg">
              Start a Negotiation
            </Link>
            <a href="#how-it-works" className="btn btn-secondary">
              How it Works
            </a>
          </div>

          <div className="social-proof animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <div className="social-proof-label">Alignment achieved:</div>
            <div className="social-proof-stats">
              <strong>{stats.fairDeals}</strong> fair deals completed <span className="separator">––</span> <strong>{stats.unfairDealsPrevented}</strong> regrettable deals prevented
            </div>
          </div>
        </div>
        <div className="hero-visual animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="image-container">
            <div className="hero-visual-placeholder">
              <div className="glow-circle"></div>
              <div className="glow-line"></div>
              <div className="alignment-lines">
                <div className="line a"></div>
                <div className="line b"></div>
              </div>
            </div>
            <div className="image-overlay"></div>
          </div>
        </div>
      </section>

      {/* Perspectives Section */}
      <section className="perspectives" id="how-it-works">
        <div className="section-header">
          <h2>Two Sides, One Goal: <span className="text-gradient">No&nbsp;Regrets</span></h2>
          <p>Choose your perspective to see how the protocol protects you.</p>
        </div>

        <div className="tabs-container">
          <div className="tabs">
            <button
              className={`tab-btn ${activeTab === 'partyA' ? 'active' : ''}`}
              onClick={() => setActiveTab('partyA')}
            >
              For Initiators (Employers/Buyers)
            </button>
            <button
              className={`tab-btn ${activeTab === 'partyB' ? 'active' : ''}`}
              onClick={() => setActiveTab('partyB')}
            >
              For Responders (Candidates/Sellers)
            </button>
          </div>

          <div className={`tab-content card active-${activeTab}`}>
            {activeTab === 'partyA' ? (
              <div className="perspective-grid animate-fade-in">
                <div className="perspective-text">
                  <h3>The Initiator Strategy</h3>
                  <p>As Party A, you set the stage. Define the range you are comfortable with and invite the other party.</p>
                  <ul className="feature-list">
                    <li><strong>Define the Shared Reality:</strong> Set your ideal target price and a maximum <strong>Negotiation Spread (e.g., 20%)</strong>. Your resulting &quot;No Regret&quot; range is generated from this.</li>
                    <li><strong>The Spread is the Limit:</strong> The negotiation spread you choose dictates the maximum allowed width for Party B&apos;s range, preventing them from submitting artificially wide nets.</li>
                    <li><strong>Protect Your Budget:</strong> If their ask is outside your range + the % spread, the deal ends silently in a Deadlock. They never know what your numbers were.</li>
                  </ul>
                </div>
                <div className="outcome-box">
                  <h4>Possible Outcomes</h4>
                  <div className="outcome-item">
                    <span className="dot success"></span>
                    <div>
                      <strong>Match:</strong> Your ranges overlapped. A deal is struck at the midpoint, ensuring a fair outcome for both sides.
                    </div>
                  </div>
                  <div className="outcome-item">
                    <span className="dot warning"></span>
                    <div>
                      <strong>Feasible:</strong> You didn&apos;t overlap but are close. The system reveals the direction (above or below) so you can decide if you want to adjust.
                    </div>
                  </div>
                  <div className="outcome-item">
                    <span className="dot error"></span>
                    <div>
                      <strong>Deadlock:</strong> You are too far apart. The process ends. No ranges are revealed. No pride is lost.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="perspective-grid animate-fade-in">
                <div className="perspective-text">
                  <h3>The Responder Strategy</h3>
                  <p>As Party B, you respond to an invitation. You provide your &quot;No Regret&quot; range—the numbers you&apos;d be happy to sign today.</p>
                  <ul className="feature-list">
                    <li><strong>Constrained by the Spread:</strong> You must submit a range within the Initiator&apos;s chosen <strong>Negotiation Spread (e.g., 20%)</strong> to keep the negotiation fair.</li>
                    <li><strong>Internal Comparison:</strong> Your numbers are compared privately on the server. If you don&apos;t overlap, your specific target is never disclosed.</li>
                    <li><strong>Fair Midpoints:</strong> If you overlap, the deal happens at the exact midpoint of the shared range, ensuring both parties get a &quot;better than expected&quot; price.</li>
                  </ul>
                </div>
                <div className="outcome-box">
                  <h4>Outcomes for You</h4>
                  <div className="outcome-item">
                    <span className="dot success"></span>
                    <div>
                      <strong>Instant Deal:</strong> Your range hit their range. You get a fair price without the &quot;negotiation dance.&quot;
                    </div>
                  </div>
                  <div className="outcome-item">
                    <span className="dot warning"></span>
                    <div>
                      <strong>Directional Insight:</strong> If you&apos;re close, the system reveals if you are &quot;high&quot; or &quot;low&quot; relative to their range. You can then choose to adjust your ask.
                    </div>
                  </div>
                  <div className="outcome-item">
                    <span className="dot error"></span>
                    <div>
                      <strong>Private Walkaway:</strong> If the gap is too wide, the deal simply stops. No awkward emails or revealed numbers.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="visual-comparison">
        <div className="section-header">
          <h2>The Math of Alignment</h2>
          <p>See exactly when a deal is struck, when you get a second chance, and when you safely walk away.</p>
        </div>

        <div className="comparison-grid">
          <div className="comparison-card">
            <h4>Scenario A: Perfect Overlap</h4>
            <div className="scenario-description">
              Party A: 100–120k<br />
              Party B: 110–130k<br />
              <strong>Spread: 20%</strong>
            </div>
            <div className="visual-bar-wrapper">
              <div className="visual-bar-bg">
                <div className="bar-range a" style={{ left: '20%', width: '40%' }}>Party A</div>
                <div className="bar-range b" style={{ left: '40%', width: '40%' }}>Party B</div>
                <div className="match-point" style={{ left: '45%' }}></div>
              </div>
            </div>
            <p className="result-text success">Result: Deal at 115k (Midpoint of 110-120k overlap)</p>
          </div>

          <div className="comparison-card">
            <h4>Scenario B: Close but No Overlap</h4>
            <div className="scenario-description">
              Party A: 100–110k<br />
              Party B: 115–125k<br />
              <strong>Spread: 10%</strong>
            </div>
            <div className="visual-bar-wrapper">
              <div className="visual-bar-bg">
                <div className="bar-range a" style={{ left: '20%', width: '20%' }}>Party A</div>
                <div className="bar-range b" style={{ left: '50%', width: '20%' }}>Party B</div>
                <div className="gap-indicator" style={{ left: '40%', width: '10%' }}></div>
              </div>
            </div>
            <p className="result-text warning">Result: &quot;Feasible&quot;. Gap is within the 10% spread limit (110k * 1.1 = 121k ≥ 115k). Direction is revealed, and parties decide whether to adjust their positions.</p>
          </div>

          <div className="comparison-card">
            <h4>Scenario C: Wide Gap</h4>
            <div className="scenario-description">
              Party A: 100–110k<br />
              Party B: 150–170k<br />
              <strong>Spread: 20%</strong>
            </div>
            <div className="visual-bar-wrapper">
              <div className="visual-bar-bg">
                <div className="bar-range a" style={{ left: '10%', width: '20%' }}>Party A</div>
                <div className="bar-range b" style={{ left: '70%', width: '20%' }}>Party B</div>
              </div>
            </div>
            <p className="result-text error">Result: Deadlock. Gap exceeds the 20% negotiation spread limit. No data revealed.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="final-cta">
        <div className="card cta-card">
          <h2>Ready to find common ground?</h2>
          <p>Stop guessing. Start aligning.</p>
          <Link href="/create" className="btn btn-primary btn-lg">
            Start negotiations
          </Link>
        </div>
      </section>

      <style jsx>{`
        .landing-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
        }

        /* Hero */
        .hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 4rem;
          padding: 0rem 0;
          align-items: center;
        }

        .hero-content h1 {
          font-size: 4rem;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          letter-spacing: -0.04em;
        }

        .text-gradient {
          background: linear-gradient(135deg, var(--accent-color), #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: 1.25rem;
          color: var(--text-secondary);
          margin-bottom: 2.5rem;
          max-width: 540px;
        }

        .hero-actions {
          display: flex;
          gap: 1rem;
        }

        .social-proof {
          margin-top: 3rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--border-color);
        }

        .social-proof-label {
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .social-proof-stats {
          font-size: 1.1rem;
          color: var(--text-primary);
        }

        .social-proof-stats strong {
          color: var(--accent-color);
          font-size: 1.25rem;
        }

        .separator {
          color: var(--border-color);
          margin: 0 0.5rem;
        }

        .btn-lg {
          padding: 1rem 2.5rem;
          font-size: 1.125rem;
        }

        .btn-secondary {
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
        }

        .btn-secondary:hover {
          background: rgba(255,255,255,0.1);
        }

        .hero-visual {
          position: relative;
        }

        .image-container {
          position: relative;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 0 50px rgba(99, 102, 241, 0.2);
          border: 1px solid var(--glass-border);
        }

        .hero-image {
          width: 100%;
          height: auto;
          display: block;
        }

        .hero-visual-placeholder {
          width: 100%;
          aspect-ratio: 1;
          background: radial-gradient(circle at 30% 30%, #1e1b4b 0%, #0a0a0c 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }

        .glow-circle {
          position: absolute;
          width: 60%;
          height: 60%;
          background: radial-gradient(circle, var(--accent-color) 0%, transparent 70%);
          filter: blur(60px);
          opacity: 0.3;
          animation: pulse 8s infinite alternate;
        }

        .glow-line {
          position: absolute;
          width: 200%;
          height: 1px;
          background: linear-gradient(90deg, transparent, var(--accent-color), transparent);
          transform: rotate(-45deg);
          opacity: 0.2;
        }

        .alignment-lines {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .line {
          position: absolute;
          height: 2px;
          background: white;
          box-shadow: 0 0 20px white;
          border-radius: 99px;
        }

        .line.a {
          width: 150px;
          transform: translateX(-60px) rotate(15deg);
          background: var(--accent-color);
          box-shadow: 0 0 20px var(--accent-color);
          animation: slideA 4s infinite alternate ease-in-out;
        }

        .line.b {
          width: 150px;
          transform: translateX(60px) rotate(-15deg);
          background: #a78bfa;
          box-shadow: 0 0 20px #a78bfa;
          animation: slideB 4s infinite alternate ease-in-out;
        }

        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.2; }
          100% { transform: scale(1.2); opacity: 0.4; }
        }

        @keyframes slideA {
          0% { transform: translateX(-80px) rotate(15deg); }
          100% { transform: translateX(-40px) rotate(15deg); }
        }

        @keyframes slideB {
          0% { transform: translateX(80px) rotate(-15deg); }
          100% { transform: translateX(40px) rotate(-15deg); }
        }

        .image-overlay {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, transparent 0%, rgba(10, 10, 12, 0.4) 100%);
        }

        /* Sections */
        .perspectives, .visual-comparison, .final-cta {
          padding: 3rem 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: 4rem;
        }

        .section-header h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .section-header p {
          color: var(--text-secondary);
          font-size: 1.1rem;
        }

        /* Tabs */
        .tabs-container {
          width: 100%;
          margin: 0 auto;
        }

        .tabs {
          display: flex;
          gap: 0;
          margin-bottom: -1px;
          width: 100%;
          position: relative;
          z-index: 2;
          border-bottom: 1px solid var(--border-color);
          transition: border-color 0.3s ease;
        }

        .tabs-container:has(.active-partyA) .tabs,
        .tabs-container:has(.active-partyB) .tabs {
          border-color: var(--accent-color);
        }

        .tab-btn {
          flex: 1;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
          border-bottom: none;
          color: var(--text-secondary);
          padding: 1.5rem 2rem;
          border-radius: 1.5rem 1.5rem 0 0;
          cursor: pointer;
          font-weight: 700;
          font-size: 1.25rem;
          transition: all 0.3s ease;
          position: relative;
        }

        .tab-btn:hover:not(.active) {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-primary);
        }

        .tab-btn.active {
          background: var(--surface-color);
          color: white;
          border: 1px solid var(--accent-color);
          border-bottom: 1px solid var(--surface-color);
          z-index: 3;
        }

        .tab-content.card {
          border: 1px solid var(--border-color);
          border-top: none;
          border-top-left-radius: 0;
          border-top-right-radius: 0;
          position: relative;
          z-index: 1;
          transition: border-color 0.3s ease;
        }

        .tab-content.card.active-partyA,
        .tab-content.card.active-partyB {
          border-color: var(--accent-color);
        }

        .perspective-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 3rem;
          align-items: flex-start;
        }

        .perspective-text h3 {
          font-size: 1.75rem;
          margin-bottom: 1rem;
        }

        .feature-list {
          list-style: none;
          margin: 2rem 0;
        }

        .feature-list li {
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          position: relative;
          color: var(--text-secondary);
        }

        .feature-list li::before {
          content: '→';
          position: absolute;
          left: 0;
          color: var(--accent-color);
          font-weight: bold;
        }

        .feature-list li strong {
          color: var(--text-primary);
        }

        .outcome-box {
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border-color);
          border-radius: 1rem;
          padding: 1.5rem;
        }

        .outcome-box h4 {
          margin-bottom: 1rem;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-secondary);
        }

        .outcome-item {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .dot.success { background: var(--success-color); box-shadow: 0 0 8px var(--success-color); }
        .dot.warning { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
        .dot.error { background: var(--error-color); box-shadow: 0 0 8px var(--error-color); }

        /* Comparison Grid */
        .comparison-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 2rem;
        }

        .comparison-card {
          background: var(--surface-color);
          border: 1px solid var(--border-color);
          padding: 2rem;
          border-radius: 1.5rem;
        }

        .scenario-description {
          font-size: 0.9rem;
          color: var(--text-secondary);
          margin-bottom: 1.5rem;
          font-family: monospace;
          line-height: 1.6;
        }

        .visual-bar-wrapper {
          height: 100px;
          margin-bottom: 1.5rem;
        }

        .visual-bar-bg {
          height: 40px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
          position: relative;
          margin-top: 10px;
        }

        .bar-range {
          position: absolute;
          height: 24px;
          border-radius: 6px;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 8px;
          color: white;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .bar-range.a {
          top: 0;
          background: var(--accent-color);
          z-index: 2;
        }

        .bar-range.b {
          top: 30px;
          background: #a78bfa;
          z-index: 1;
        }

        .match-point {
          position: absolute;
          width: 4px;
          height: 100%;
          background: white;
          box-shadow: 0 0 15px white;
          z-index: 3;
        }

        .gap-indicator {
          position: absolute;
          height: 4px;
          background: repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(255,255,255,0.2) 4px, rgba(255,255,255,0.2) 8px);
          top: 50%;
          transform: translateY(-50%);
        }

        .result-text {
          font-size: 0.9rem;
          font-weight: 600;
        }

        .result-text.success { color: var(--success-color); }
        .result-text.warning { color: #f59e0b; }
        .result-text.error { color: var(--error-color); }

        /* CTA */
        .cta-card {
          text-align: center;
          background: linear-gradient(135deg, #1e1b4b 0%, #0a0a0c 100%);
          border: 1px solid var(--accent-color);
        }

        .cta-card h2 {
          font-size: 2.5rem;
          margin-bottom: 1rem;
        }

        .cta-card p {
          margin-bottom: 2rem;
          color: var(--text-secondary);
        }

        /* Responsive */
        @media (max-width: 968px) {
          .hero {
            grid-template-columns: 1fr;
            text-align: center;
            padding: 4rem 0;
            gap: 3rem;
          }

          .hero-content h1 { font-size: 3rem; }
          .hero-subtitle { margin-left: auto; margin-right: auto; }
          .hero-actions { justify-content: center; }
          .hero-visual { order: -1; max-width: 600px; margin: 0 auto; }
          
          .comparison-grid { grid-template-columns: 1fr; }
          .feature-list li { text-align: left; }
          
          .social-proof { margin-left: auto; margin-right: auto; max-width: 500px; }
          .perspectives, .visual-comparison, .final-cta { padding: 4rem 0; }
          .perspective-grid { grid-template-columns: 1fr; gap: 2rem; }
        }

        @media (max-width: 640px) {
          .hero-content h1 { font-size: 2.25rem; }
          .hero-subtitle { font-size: 1.1rem; }
          .hero-actions { flex-direction: column; width: 100%; }
          .hero-actions .btn { width: 100%; }
          
          .tabs {
            flex-direction: column;
            gap: 0;
          }
          
          .tab-btn {
            border-radius: 0;
            border-bottom: 1px solid var(--border-color);
            font-size: 1.1rem;
            padding: 1.25rem;
          }
          
          .tab-btn:first-child { border-radius: 1.5rem 1.5rem 0 0; }
          
          .tab-btn.active {
            background: var(--surface-color);
            border-bottom: 1px solid transparent;
          }
          
          .tab-btn.active::after { display: none; }
          
          .tab-content.card {
            padding: 1.5rem;
          }

          .social-proof-stats {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            font-size: 1rem;
          }
          
          .separator { display: none; }
          
          .section-header h2 { font-size: 1.85rem; }
          
          .outcome-box { padding: 1.5rem; }
          
          .visual-bar-bg { height: 60px; }
        }
      `}</style>
    </div>
  );
}

function ProtocolVisualizer({ role }: { role: 'A' | 'B' }) {
  return (
    <div className="protocol-viz">
      <div className="viz-step">
        <div className="viz-number">1</div>
        <div className="viz-info">
          <strong>Private Threshold</strong>
          <p>Define your ideal target and set your negotiation spread.</p>
        </div>
      </div>
      <div className="viz-step">
        <div className="viz-number">2</div>
        <div className="viz-info">
          <strong>Internal Comparison</strong>
          <p>The system performs a private overlap check on the server.</p>
        </div>
      </div>
      <div className="viz-step">
        <div className="viz-number">3</div>
        <div className="viz-info">
          <strong>Binary Outcome</strong>
          <p>Match or Walkaway.</p>
        </div>
      </div>

      <style jsx>{`
        .protocol-viz {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          padding: 2rem;
          background: rgba(255,255,255,0.02);
          border-radius: 1.5rem;
          border: 1px dashed var(--border-color);
        }
        .viz-step {
          display: flex;
          gap: 1.5rem;
          align-items: flex-start;
        }
        .viz-number {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          flex-shrink: 0;
        }
        .viz-info strong {
          display: block;
          margin-bottom: 0.25rem;
          font-size: 1rem;
        }
        .viz-info p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }
      `}</style>
    </div>
  );
}
