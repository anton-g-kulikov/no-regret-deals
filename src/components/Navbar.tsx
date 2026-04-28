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


    </nav>
  );
}
