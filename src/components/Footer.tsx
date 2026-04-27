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

      <style jsx>{`
        .main-footer {
          border-top: 1px solid var(--border-color);
          padding: 4rem 0;
          margin-top: 4rem;
          background: rgba(10, 10, 12, 0.4);
        }

        .footer-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          text-align: center;
        }

        .footer-text {
          font-size: 1.1rem;
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .footer-link {
          color: var(--accent-color);
          font-weight: 700;
          text-decoration: underline;
          text-underline-offset: 4px;
          transition: color 0.2s;
        }

        .footer-link:hover {
          color: var(--accent-hover);
        }

        .footer-copyright {
          font-size: 0.85rem;
          color: var(--text-secondary);
          opacity: 0.6;
        }

        .protocol-link {
          color: var(--text-primary);
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s;
          font-weight: 600;
        }

        .protocol-link:hover {
          color: var(--accent-color);
          opacity: 1;
        }

        .author-link {
          margin-top: 0.5rem;
        }

        .author-link a {
          color: var(--text-secondary);
          text-decoration: underline;
          font-weight: 400;
        }

        .author-link a:hover {
          text-decoration: underline;
        }

        @media (max-width: 640px) {
          .main-footer {
            padding: 2.5rem 0;
            margin-top: 2rem;
          }
          
          .footer-text {
            font-size: 1rem;
            line-height: 1.6;
          }
          
          .footer-copyright {
            font-size: 0.75rem;
          }
        }
      `}</style>
    </footer>
  );
}
