'use client';

import Link from 'next/link';

export default function ProtocolPage() {
  return (
    <main className="container protocol-spec">
      <div className="animate-fade-in">
        <header className="spec-header">
          <Link href="/" className="back-link">← Return to Application</Link>
          <div className="status-chip">Draft Specification v1.2</div>
          <h1>Bounded Alignment Protocol (BAP)</h1>
          <p className="abstract">
            A multi-stage negotiation protocol for identifying value alignment between two parties 
            without premature disclosure of private thresholds.
          </p>
        </header>

        <section className="spec-section">
          <h2>1. Definitions</h2>
          <div className="definition-box">
            <p><strong>Parties:</strong> <em>Initiator (A)</em> and <em>Responder (B)</em>.</p>
            <p><strong>Threshold Range (R):</strong> A closed interval $[min, max]$ representing a party&apos;s &quot;No Regret&quot; zone.</p>
            <p><strong>Flexibility Spread (&sigma;):</strong> A scalar percentage value (e.g., 0.2) defining the maximum allowed expansion of R.</p>
            <p><strong>Midpoint ($M$):</strong> The arithmetic mean of a range, (min + max) / 2.</p>
          </div>
        </section>

        <section className="spec-section">
          <h2>2. Protocol Lifecycle</h2>
          
          <div className="phase">
            <h3>Phase I: Initialization & Commitment</h3>
            <p>
              Initiator $A$ defines a target value $M_A$ and selects $\sigma$. 
              The system generates $R_A = [M_A(1-\sigma), M_A(1+\sigma)]$. 
              $A$ commits $R_A$ and $\sigma$ to the protocol state.
            </p>
          </div>

          <div className="phase">
            <h3>Phase II: Secure Response</h3>
            <p>
              Responder $B$ provides $M_B$. The system generates $R_B = [M_B(1-\sigma), M_B(1+\sigma)]$. 
              The protocol ensures fairness by applying the same $\sigma$ selected by the Initiator.
            </p>
          </div>

          <div className="phase">
            <h3>Phase III: Overlap Verification (Round 1)</h3>
            <p>The protocol evaluates the intersection $I = R_A \cap R_B$.</p>
            <div className="math-block">
              I_min = max(min_A, min_B) <br />
              I_max = min(max_A, max_B)
            </div>
            <p>
              If I_min &le; I_max, the state transitions to <strong>COMPLETED</strong>. 
              The final agreement value V is defined as the midpoint of I:
            </p>
            <div className="math-block">
              V = (I_min + I_max) / 2
            </div>
          </div>

          <div className="phase">
            <h3>Phase IV: Feasibility & Directional Disclosure</h3>
            <p>
              If $R_A \cap R_B = \emptyset$, the protocol checks for <strong>Bounded Feasibility</strong>. 
              Alignment is feasible if a second-round overlap is possible given the maximum flexibility spread.
            </p>
            <div className="logic-box">
              <h4>Case: B is below A (max_B &lt; min_A)</h4>
              <p>Feasible if: max_B(1+&sigma;) &ge; min_A / (1+&sigma;)</p>
              
              <h4>Case: B is above A (min_B &gt; max_A)</h4>
              <p>Feasible if: min_B / (1+&sigma;) &le; max_A(1+&sigma;)</p>
            </div>
            <p>
              If feasible, the protocol reveals the <strong>Directional Hint</strong> (e.g., &quot;Party B is Above&quot;) to both parties. 
              If not feasible, the protocol enters <strong>DEADLOCK</strong> and terminates without revealing any data.
            </p>
          </div>
        </section>

        <section className="spec-section">
          <h2>3. Security Properties</h2>
          <div className="security-grid">
            <div className="security-item">
              <h4>Internal Comparison</h4>
              <p>
                Calculations are performed privately within the system. Ranges are never shared between parties.
                In a DEADLOCK state, no information (including the direction of the gap) is revealed.
              </p>
            </div>
            <div className="security-item">
              <h4>Anti-Fishing Constraint</h4>
              <p>
                By locking the flexibility spread ($\sigma$) globally for the deal, a Responder cannot use a disproportionately 
                large range to &quot;fish&quot; for the Initiator&apos;s budget.
              </p>
            </div>
            <div className="security-item">
              <h4>Mathematical Neutrality</h4>
              <p>
                The use of overlap midpoints removes the first-mover disadvantage. 
                Neither party can &quot;win&quot; the negotiation through aggressive anchoring; the protocol extracts the shared surplus equally.
              </p>
            </div>
          </div>
        </section>

        <section className="spec-section">
          <h2>4. Reference Implementation</h2>
          <div className="download-box">
            <p>The complete, open-source implementation of the BAP engine and this application is available on GitHub.</p>
            <a href="https://github.com/anton-g-kulikov/no-regret-deals" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              View Source on GitHub
            </a>
          </div>
        </section>

        <footer className="spec-footer">
          <p>This protocol is open for review. For inquiries regarding the mathematical implementation, contact the architect.</p>
          <div className="author-tag">Architect: AK</div>
        </footer>
      </div>

      <style jsx>{`
        .protocol-spec {
          padding: 6rem 0;
          max-width: 800px;
          color: #d1d1d6;
          line-height: 1.6;
        }

        .back-link {
          color: var(--accent-color);
          font-weight: 600;
          font-size: 0.9rem;
          text-decoration: underline;
          display: block;
          margin-bottom: 2rem;
        }

        .status-chip {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          background: rgba(99, 102, 241, 0.1);
          color: var(--accent-color);
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 1rem;
        }

        h1 {
          font-size: 3rem;
          color: white;
          margin-bottom: 1.5rem;
          letter-spacing: -0.03em;
        }

        .abstract {
          font-size: 1.25rem;
          color: var(--text-secondary);
          border-left: 2px solid var(--border-color);
          padding-left: 1.5rem;
          margin-bottom: 4rem;
        }

        .spec-section {
          margin-bottom: 5rem;
        }

        h2 {
          font-size: 1.5rem;
          color: white;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 0.75rem;
          margin-bottom: 2rem;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        h3 {
          font-size: 1.25rem;
          color: white;
          margin-bottom: 1rem;
        }

        .definition-box, .math-block, .logic-box {
          background: #0f0f12;
          border: 1px solid var(--border-color);
          padding: 2rem;
          border-radius: 0.75rem;
          margin: 1.5rem 0;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .math-block {
          font-family: monospace;
          font-size: 1.1rem;
          color: var(--accent-hover);
          text-align: center;
        }

        .phase {
          margin-bottom: 3rem;
        }

        .logic-box h4 {
          font-size: 0.9rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
        }
        
        .logic-box h4:first-child { margin-top: 0; }

        .security-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 2rem;
        }

        .security-item h4 {
          color: white;
          margin-bottom: 0.5rem;
        }

        .security-item p {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }

        .spec-footer {
          margin-top: 8rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-color);
          text-align: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .author-tag {
          margin-top: 1rem;
          font-weight: bold;
          color: white;
        }

        .download-box {
          background: #0f0f12;
          border: 1px solid var(--border-color);
          padding: 2.5rem;
          border-radius: 1rem;
          text-align: center;
        }

        .download-box p {
          margin-bottom: 1.5rem;
          color: var(--text-secondary);
        }

        .btn-outline {
          background: transparent;
          border: 1px solid var(--accent-color);
          color: var(--accent-color);
          padding: 0.75rem 1.5rem;
          border-radius: 0.5rem;
          font-weight: 600;
          text-decoration: underline;
          display: inline-block;
          transition: all 0.2s;
        }

        .btn-outline:hover {
          background: var(--accent-color);
          color: white;
        }

        @media (min-width: 768px) {
          .security-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </main>
  );
}
