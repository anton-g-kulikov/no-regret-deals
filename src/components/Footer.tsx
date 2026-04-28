'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="main-footer">
      <div className="footer-container">
        <p className="footer-text">
          Happy with the outcome? <a href="https://buymeacoffee.com/antonkulikov" target="_blank" rel="noopener noreferrer" className="footer-link">Buy me a coffee!</a>
        </p>
        <div className="footer-copyright">
          No Regret Deals: <Link href="/protocol" className="protocol-link">Private Alignment Protocol</Link>.
          <div className="author-link">
            Made with 🦾 by <a href="https://antonkulikov.site/" target="_blank" rel="noopener noreferrer">Anton Kulikov</a>.
          </div>
        </div>
      </div>
    </footer>
  );
}
