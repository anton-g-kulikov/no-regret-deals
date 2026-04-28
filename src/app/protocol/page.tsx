'use client';

import Link from 'next/link';

export default function ProtocolPage() {
  return (
    <main className="container protocol-spec">
      <div className="animate-fade-in">
        <header className="spec-header">
          <Link href="/" className="back-link">← Return to Application</Link>
          <div className="status-chip">Draft Specification v1.2</div>
          <h1>Private Calibration Protocol (PCP)</h1>
          <p className="abstract">
            A multi-stage calibration protocol for identifying alignment between two parties
            without premature disclosure of private thresholds.
          </p>
        </header>

        <section className="spec-section">
          <h2>1. Definitions</h2>
          <div className="definition-box">
            <p><strong>Parties:</strong> Initiator (A) and Responder (B).</p>
            <p><strong>Threshold Range:</strong> A range [min, max] representing a party&apos;s &quot;No Regret&quot; zone.</p>
            <p><strong>Calibration Flexibility (&sigma;):</strong> A percentage (e.g., 20%) defining the maximum allowed expansion of the range.</p>
            <p><strong>Target Value (T):</strong> The ideal value at the center of your range.</p>
          </div>
        </section>

        <section className="spec-section">
          <h2>2. Protocol Lifecycle</h2>

          <div className="phase">
            <h3>Phase I: Initialization & Commitment</h3>
            <p>
              Initiator A defines a target value T<sub>A</sub> and selects a calibration flexibility (σ).</p>
            <p>
              The system generates an initial range: [T<sub>A</sub> - σ, T<sub>A</sub> + σ].</p>
            <p>
              This range is committed to the protocol.
            </p>
          </div>

          <div className="phase">
            <h3>Phase II: Secure Response</h3>
            <p>
              Responder B provides their target value T<sub>B</sub>. </p> <p> The system generates their range using the same flexibility σ selected by the Initiator to ensure fairness.
            </p>
          </div>

          <div className="phase">
            <h3>Phase III: Overlap Verification (Round 1)</h3>
            <p>The protocol checks if the two ranges overlap.</p>
            <div className="math-block">
              Overlap Min = Maximum of both Minimums <br />
              Overlap Max = Minimum of both Maximums
            </div>
            <p>
              If an overlap exists, the calibration is <strong>SUCCESSFUL</strong>.
              The final agreement value is the center point of the overlapping section.
            </p>
          </div>

          <div className="phase">
            <h3>Phase IV: Feasibility & Directional Disclosure</h3>
            <p>
              If the ranges do not overlap, the protocol checks for <strong>Bounded Feasibility</strong>.
              This determines if a deal is possible if both parties were to use their maximum flexibility.
            </p>
            <div className="logic-box">
              <h4>Case: B is below A</h4>
              <p>Feasible if B&apos;s maximum possible range reaches A&apos;s minimum possible range.</p>

              <h4>Case: B is above A</h4>
              <p>Feasible if B&apos;s minimum possible range reaches A&apos;s maximum possible range.</p>
            </div>
            <p>
              If feasible, the protocol reveals a <strong>Directional Hint</strong> (e.g., &quot;Party B is Above&quot;) to both parties.
              If not feasible, the protocol concludes as <strong>NOT ALIGNED</strong> and terminates without revealing any directional data.
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
                In a non-aligned state, no information (including the direction of the gap) is revealed.
              </p>
            </div>
            <div className="security-item">
              <h4>Anti-Fishing Constraint</h4>
              <p>
                By locking the calibration flexibility (σ) globally, a Responder cannot use a disproportionately
                large range to &quot;fish&quot; for the Initiator&apos;s target.
              </p>
            </div>
            <div className="security-item">
              <h4>Equitable Surplus Extraction</h4>
              <p>
                The use of overlap midpoints removes the first-mover disadvantage.
                Neither party can &quot;win&quot; the calibration through aggressive anchoring; the protocol extracts the shared surplus equally.
              </p>
            </div>
          </div>
        </section>

        <section className="spec-section">
          <h2>4. Reference Implementation</h2>
          <div className="download-box">
            <p>The complete, open-source implementation of the calibration engine and this application is available on GitHub.</p>
            <a href="https://github.com/anton-g-kulikov/no-regret-deals" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
              View Source on GitHub
            </a>
          </div>
        </section>

        <footer className="spec-footer">
          <p>This protocol is open for review.</p>
          <p>For inquiries regarding the mathematical implementation, drop me a line or submit an issue on <a href="https://github.com/anton-g-kulikov/no-regret-deals" target="_blank" rel="noopener noreferrer" className="protocol-link">GitHub</a>.</p>
        </footer>
      </div>

      
    </main>
  );
}
