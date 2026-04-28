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
              For Initiators (Party A)
            </button>
            <button
              className={`tab-btn ${activeTab === 'partyB' ? 'active' : ''}`}
              onClick={() => setActiveTab('partyB')}
            >
              For Responders (Party B)
            </button>
          </div>

          <div className={`tab-content card active-${activeTab}`}>
            {activeTab === 'partyA' ? (
              <div className="perspective-grid animate-fade-in">
                <div className="perspective-text">
                  <h3>The Initiator Strategy</h3>
                  <p>As Party A, you set the stage. Define the range you are comfortable with and invite the other party.</p>
                  <ul className="feature-list">
                    <li><strong>Define the Shared Reality:</strong> Set your ideal target value and a maximum <strong>Negotiation Spread (e.g., 20%)</strong>. Your resulting &quot;No Regret&quot; range is generated from this.</li>
                    <li><strong>The Spread is the Limit:</strong> The negotiation spread you choose dictates the maximum allowed width for Party B&apos;s range, preventing them from submitting artificially wide nets.</li>
                    <li><strong>Protect Your Position:</strong> If their range is outside your range + the % spread, the deal ends silently in a Deadlock. They never know what your numbers were.</li>
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
                    <li><strong>Fair Midpoints:</strong> If you overlap, the deal happens at the exact midpoint of the shared range, ensuring both parties get a &quot;better than expected&quot; outcome.</li>
                  </ul>
                </div>
                <div className="outcome-box">
                  <h4>Outcomes for You</h4>
                  <div className="outcome-item">
                    <span className="dot success"></span>
                    <div>
                      <strong>Instant Deal:</strong> Your range hit their range. You get a fair deal without the &quot;negotiation dance.&quot;
                    </div>
                  </div>
                  <div className="outcome-item">
                    <span className="dot warning"></span>
                    <div>
                      <strong>Directional Insight:</strong> If you&apos;re close, the system reveals if you are &quot;high&quot; or &quot;low&quot; relative to their range. You can then choose to adjust your position.
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
              Party A: <span className="hover-reveal" title="100–120k"><span className="hidden-text">***-***k</span><span className="actual">100–120k</span></span><br />
              Party B: <span className="hover-reveal" title="110–130k"><span className="hidden-text">***-***k</span><span className="actual">110–130k</span></span><br />
              <strong>Spread: 20%</strong>
            </div>
            <div className="visual-bar-wrapper">
              <div className="visual-bar-bg">
                <div className="bar-range a" style={{ left: '20%', width: '40%' }}>Party A</div>
                <div className="bar-range b" style={{ left: '40%', width: '40%' }}>Party B</div>
                <div className="match-point" style={{ left: '45%' }}></div>
              </div>
            </div>
            <p className="result-text success">Result: Deal at 115k (but original ranges are never disclosed)</p>
          </div>

          <div className="comparison-card">
            <h4>Scenario B: Close but No Overlap</h4>
            <div className="scenario-description">
              Party A: <span className="hover-reveal" title="100–110k"><span className="hidden-text">***-***k</span><span className="actual">100–110k</span></span><br />
              Party B: <span className="hover-reveal" title="115–125k"><span className="hidden-text">***-***k</span><span className="actual">115–125k</span></span><br />
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
              Party A: <span className="hover-reveal" title="100–110k"><span className="hidden-text">***-***k</span><span className="actual">100–110k</span></span><br />
              Party B: <span className="hover-reveal" title="150–170k"><span className="hidden-text">***-***k</span><span className="actual">150–170k</span></span><br />
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

      
    </div>
  );
}
