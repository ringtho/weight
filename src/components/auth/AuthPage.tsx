import React, { useState } from 'react';
import { Flame, LogIn, UserPlus, Eye, EyeOff, Loader } from 'lucide-react';
import { login, register } from '../../lib/authApi';
import type { AuthUser } from '../../lib/authApi';

type Props = { onAuth: (user: AuthUser) => void };

export default function AuthPage({ onAuth }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail]       = useState('');
  const [name, setName]         = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const switchMode = (m: 'login' | 'register') => { setMode(m); setError(''); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (mode === 'register' && password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const user = mode === 'login'
        ? await login(email.trim(), password)
        : await register(email.trim(), password, name.trim());
      onAuth(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Glow blobs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #7c3aed, transparent 70%)' }} />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #10b981, transparent 70%)' }} />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
            <Flame size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-white">Fat Loss Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Your personal transformation program</p>
        </div>

        <div className="card p-6">
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: mode === m ? 'rgba(124,58,237,0.5)' : 'transparent',
                  color: mode === m ? '#e9d5ff' : '#64748b',
                  border: mode === m ? '1px solid rgba(124,58,237,0.4)' : '1px solid transparent',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Full name (register only) */}
            {mode === 'register' && (
              <div>
                <label className="field-label">Full Name</label>
                <input className="dark-input" type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="field-label">Email Address</label>
              <input className="dark-input" type="email" placeholder="jane@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
            </div>

            {/* Password */}
            <div>
              <label className="field-label">Password</label>
              <div className="relative">
                <input
                  className="dark-input pr-10"
                  type={showPw ? 'text' : 'password'}
                  placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required minLength={6}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                />
                <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm (register only) */}
            {mode === 'register' && (
              <div>
                <label className="field-label">Confirm Password</label>
                <input className="dark-input" type={showPw ? 'text' : 'password'} placeholder="Repeat password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required autoComplete="new-password" />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-sm px-3 py-2 rounded-lg" style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.25)', color: '#fb7185' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary flex items-center justify-center gap-2 mt-1" style={{ opacity: loading ? 0.7 : 1 }}>
              {loading
                ? <><Loader size={15} className="animate-spin" />{mode === 'login' ? 'Signing in…' : 'Creating account…'}</>
                : mode === 'login'
                  ? <><LogIn size={15} />Sign In</>
                  : <><UserPlus size={15} />Create Account</>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-4">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => switchMode(mode === 'login' ? 'register' : 'login')} className="text-violet-400 hover:text-violet-300 transition-colors">
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </p>
        </div>


      </div>
    </div>
  );
}
