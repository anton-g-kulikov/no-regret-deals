'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, signOut } from '@/lib/firebase-client';
import { onAuthStateChanged, User } from 'firebase/auth';

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          <div className="logo-container">
            <div className="logo-symbol">
              <div className="logo-line"></div>
              <div className="logo-line"></div>
            </div>
            <span className="logo-text">No Regret Deals</span>
          </div>
        </Link>
        
        <div className="nav-actions">
          {user ? (
            <div className="user-menu">
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="btn-logout">
                Log Out
              </button>
            </div>
          ) : (
            <Link href="/create" className="btn-login">
              Get Started
            </Link>
          )}
        </div>
      </div>

      <style jsx>{`
        .main-nav {
          background: rgba(10, 10, 12, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          z-index: 1000;
          padding: 1rem 0;
        }

        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .nav-logo {
          text-decoration: none !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }

        .logo-container {
          display: flex !important;
          flex-direction: row !important;
          align-items: center !important;
          gap: 0.75rem !important;
          transition: transform 0.2s ease;
        }

        .nav-logo:hover .logo-container {
          transform: translateY(-1px);
        }

        .logo-symbol {
          position: relative;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .logo-line {
          position: absolute;
          height: 2.5px;
          width: 24px;
          border-radius: 99px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .logo-line:nth-child(1) {
          background: var(--accent-color);
          transform: rotate(15deg) translateX(-4px);
          box-shadow: 0 0 10px var(--accent-color);
        }

        .logo-line:nth-child(2) {
          background: #a78bfa;
          transform: rotate(-15deg) translateX(4px);
          box-shadow: 0 0 10px #a78bfa;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: 800;
          letter-spacing: -0.05em;
          color: #fff;
          line-height: 1;
          white-space: nowrap;
        }

        .logo-container:hover .logo-line:nth-child(1) {
          transform: rotate(15deg) translateX(-1px);
          width: 28px;
        }

        .logo-container:hover .logo-line:nth-child(2) {
          transform: rotate(-15deg) translateX(1px);
          width: 28px;
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .user-menu {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .user-email {
          font-size: 0.85rem;
          color: var(--text-secondary);
          display: none; /* Hide on small screens */
        }

        .btn-logout {
          background: transparent;
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none !important;
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error-color);
          color: var(--error-color);
        }

        .btn-login {
          font-size: 0.95rem;
          font-weight: 700;
          color: #fff;
          text-decoration: none !important;
          padding: 0.6rem 1.25rem;
          border-radius: 2rem;
          background: linear-gradient(135deg, var(--accent-color), #4f46e5);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
          transition: all 0.2s;
          border: none;
        }

        .btn-login:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
          filter: brightness(1.1);
        }

        @media (max-width: 640px) {
          .nav-logo {
            font-size: 1.25rem;
          }
          .logo-symbol {
            width: 28px;
            height: 28px;
          }
          .logo-circle {
            width: 16px;
            height: 16px;
            border-width: 2px;
          }
        }

        @media (min-width: 640px) {
          .user-email {
            display: inline;
          }
        }
      `}</style>
    </nav>
  );
}
