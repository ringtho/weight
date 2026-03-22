import React, { useEffect, useState } from 'react';
import FatLossTracker from './FatLossTracker';
import AuthPage from './components/auth/AuthPage';
import { getMe, logout } from './lib/authApi';
import type { AuthUser } from './lib/authApi';

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Apply saved theme
    if (localStorage.getItem('theme') === 'light') {
      document.documentElement.classList.add('light');
    }
    getMe()
      .then((u) => setUser(u))
      .finally(() => setChecking(false));
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuth={setUser} />;
  }

  return <FatLossTracker user={user} onLogout={handleLogout} />;
}
