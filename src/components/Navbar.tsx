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
      await signOut(auth);
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <nav className="main-nav">
      <div className="nav-container">
        <Link href="/" className="nav-logo">
          No Regret Deals
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
          font-size: 1.25rem;
          font-weight: 700;
          letter-spacing: -0.02em;
          color: var(--text-primary);
          transition: opacity 0.2s;
        }

        .nav-logo:hover {
          opacity: 0.8;
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
        }

        .btn-logout:hover {
          background: rgba(239, 68, 68, 0.1);
          border-color: var(--error-color);
          color: var(--error-color);
        }

        .btn-login {
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--accent-color);
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
