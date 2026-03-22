import React from 'react';
import { LayoutDashboard, BookOpen, CalendarCheck, TrendingUp, Timer, Settings, Flame, LogOut, User, Shield, Sun, Moon } from 'lucide-react';
import type { Page } from '../../lib/trackerTypes';

type NavItem = { id: Page; label: string; icon: React.ReactNode };

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { id: 'daily', label: 'Daily Log', icon: <BookOpen size={18} /> },
  { id: 'weekly', label: 'Weekly Check-in', icon: <CalendarCheck size={18} /> },
  { id: 'progress', label: 'Progress', icon: <TrendingUp size={18} /> },
  { id: 'timer', label: 'Interval Timer', icon: <Timer size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
];

type SidebarProps = {
  activePage: Page;
  onNavigate: (page: Page) => void;
  currentWeek: number;
  totalWeeks: number;
  streak: number;
  programDay: number;
  displayName: string;
  isAdmin?: boolean;
  onAdminClick?: () => void;
  onLogout: () => void;
};

export default function Sidebar({ activePage, onNavigate, currentWeek, totalWeeks, streak, programDay, displayName, isAdmin, onAdminClick, onLogout }: SidebarProps) {
  const isDark = !document.documentElement.classList.contains('light');

  const toggleTheme = () => {
    const html = document.documentElement;
    html.classList.toggle('light');
    localStorage.setItem('theme', html.classList.contains('light') ? 'light' : 'dark');
  };
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6366f1)' }}
          >
            <Flame size={18} className="text-white" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-sm leading-tight">Fat Loss</div>
            <div className="font-display text-violet-400 text-sm leading-tight">Tracker</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`nav-item ${activePage === item.id ? 'active' : ''}`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon flex-shrink-0">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
        {isAdmin && (
          <button
            className="nav-item mt-1"
            onClick={onAdminClick}
            style={{ color: '#f59e0b' }}
          >
            <span className="nav-icon flex-shrink-0"><Shield size={18} /></span>
            <span>Admin</span>
          </button>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/[0.06] flex flex-col gap-3">
        {/* Progress widget */}
        <div className="rounded-xl p-3" style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-medium">Week {currentWeek} of {totalWeeks}</span>
            {streak > 0 && (
              <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
                <Flame size={11} />
                {streak}
              </span>
            )}
          </div>
          <div className="progress-track">
            <div
              className="progress-fill gradient-violet"
              style={{ width: `${Math.min(100, (currentWeek / totalWeeks) * 100)}%` }}
            />
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Day {programDay} of program
          </div>
        </div>

        {/* User + logout */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(124,58,237,0.25)', border: '1px solid rgba(124,58,237,0.3)' }}>
            <User size={13} className="text-violet-400" />
          </div>
          <span className="text-xs text-slate-400 truncate flex-1 font-medium">{displayName}</span>
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <button
            onClick={onLogout}
            title="Sign out"
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:text-rose-400 transition-colors flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            <LogOut size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
}
